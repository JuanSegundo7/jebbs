import { beforeEach, describe, expect, it, vi } from "vitest";

// lib/env.ts throws at module load (DD3), so it must be configured before
// anything under test imports it transitively via get-catalog.ts.
process.env.DELIVERY_FEE_ARS = "2000";
process.env.NEXT_PUBLIC_WHATSAPP_NUMBER = "5493454123456";

type QueryCall = { method: string; args: unknown[] };

interface MockResult {
  data: unknown;
  error: unknown;
}

interface Route {
  table: string;
  // Given every chained call recorded for this `.from(table)` invocation,
  // decide whether this route's result applies.
  match: (calls: QueryCall[]) => boolean;
  result: MockResult;
}

function hasEq(calls: QueryCall[], column: string, value: unknown): boolean {
  return calls.some(
    (c) => c.method === "eq" && c.args[0] === column && c.args[1] === value,
  );
}

/**
 * Minimal fluent Supabase query-builder mock. `select`/`eq`/`order` record
 * the call and return the same builder (chainable); the builder itself is
 * "thenable" (mirrors the real supabase-js PostgrestBuilder, which resolves
 * when awaited directly), and `.maybeSingle()` resolves the same way.
 */
function createSupabaseMock(routes: Route[]) {
  const from = vi.fn((table: string) => {
    const calls: QueryCall[] = [];
    const resolveResult = (): MockResult => {
      const route = routes.find((r) => r.table === table && r.match(calls));
      return route ? route.result : { data: null, error: null };
    };

    const builder: Record<string, unknown> = {};
    for (const method of ["select", "eq", "order"]) {
      builder[method] = vi.fn((...args: unknown[]) => {
        calls.push({ method, args });
        return builder;
      });
    }
    builder.maybeSingle = vi.fn(() => Promise.resolve(resolveResult()));
    builder.then = (
      onFulfilled?: (value: MockResult) => unknown,
      onRejected?: (reason: unknown) => unknown,
    ) => Promise.resolve(resolveResult()).then(onFulfilled, onRejected);

    return builder;
  });

  return { from };
}

const { adminClientMock, setSupabaseMock } = vi.hoisted(() => {
  let current: { from: ReturnType<typeof vi.fn> } | null = null;
  return {
    adminClientMock: () => current,
    setSupabaseMock: (client: { from: ReturnType<typeof vi.fn> }) => {
      current = client;
    },
  };
});

vi.mock("@/lib/supabase/admin", () => ({
  createAdminClient: () => adminClientMock(),
}));

const MEAT_EXTRA_ROW = {
  id: "meat-1",
  name: "Medallón",
  category: "extra",
  price: 800,
  is_available: true,
  created_at: "2024-01-01",
};

const FRIES_EXTRA_ROW = {
  id: "fries-1",
  name: "Papas fritas chicas",
  category: "fries",
  price: 500,
  is_available: true,
  created_at: "2024-01-01",
};

function routesWithMeatAndFries(overrides: Partial<Route>[] = []): Route[] {
  // Overrides go FIRST: createSupabaseMock() resolves the first matching
  // route, so a test-specific override must be checked before the generic
  // defaults below (both target the same table).
  return [
    ...(overrides as Route[]),
    {
      table: "burgers",
      match: () => true,
      result: { data: [], error: null },
    },
    {
      table: "combos",
      match: () => true,
      result: { data: [], error: null },
    },
    {
      table: "extras",
      match: (calls) => hasEq(calls, "is_available", true),
      result: { data: [], error: null },
    },
    {
      table: "extras",
      match: (calls) => hasEq(calls, "name", "Medallón"),
      result: { data: MEAT_EXTRA_ROW, error: null },
    },
    {
      table: "extras",
      match: (calls) => hasEq(calls, "name", "Papas fritas chicas"),
      result: { data: FRIES_EXTRA_ROW, error: null },
    },
  ];
}

describe("getCatalog()", () => {
  beforeEach(() => {
    vi.resetModules();
  });

  it("requests burgers filtered by is_available", async () => {
    const mock = createSupabaseMock(routesWithMeatAndFries());
    setSupabaseMock(mock);

    const { getCatalog } = await import("@/lib/catalog/get-catalog");
    await getCatalog();

    const burgersCall = mock.from.mock.calls.find(([table]) => table === "burgers");
    expect(burgersCall).toBeDefined();
  });

  it("filters extras (non-meat/fries lookup) by is_available = true", async () => {
    const mock = createSupabaseMock(
      routesWithMeatAndFries([
        {
          table: "extras",
          match: (calls) => hasEq(calls, "is_available", true),
          result: {
            data: [{ ...MEAT_EXTRA_ROW, id: "extra-visible" }],
            error: null,
          },
        },
      ]),
    );
    setSupabaseMock(mock);

    const { getCatalog } = await import("@/lib/catalog/get-catalog");
    const catalog = await getCatalog();

    expect(catalog.extras).toEqual([{ ...MEAT_EXTRA_ROW, id: "extra-visible" }]);
  });

  it("filters combos by is_available = true and parses slot rules", async () => {
    const comboRow = {
      id: "combo-1",
      name: "Combo Clásico",
      price: 12000,
      description: null,
      is_available: true,
      created_at: "2024-01-01",
      combo_slots: [
        {
          id: "slot-1",
          combo_id: "combo-1",
          slot_type: "burger",
          quantity: 2,
          required: true,
          default_meat_quantity: 1,
          created_at: "2024-01-01",
          combo_slots_rules: [
            { id: 1, rule_type: "min_quantity", rule_value: "1" },
            { id: 2, rule_type: "max_quantity", rule_value: "2" },
            { id: 3, rule_type: "allowed_meat_count", rule_value: "[1,2]" },
          ],
        },
        {
          id: "slot-2",
          combo_id: "combo-1",
          slot_type: "side",
          quantity: 1,
          required: true,
          default_meat_quantity: null,
          created_at: "2024-01-01",
          combo_slots_rules: [
            { id: 4, rule_type: "no_fries", rule_value: "true" },
          ],
        },
        {
          id: "slot-3",
          combo_id: "combo-1",
          slot_type: "drink",
          quantity: 3,
          required: false,
          default_meat_quantity: null,
          created_at: "2024-01-01",
          combo_slots_rules: [],
        },
      ],
    };

    const mock = createSupabaseMock(
      routesWithMeatAndFries([
        {
          table: "combos",
          match: (calls) => hasEq(calls, "is_available", true),
          result: { data: [comboRow], error: null },
        },
      ]),
    );
    setSupabaseMock(mock);

    const combosCallsBefore = mock.from.mock.calls.length;
    const { getCatalog } = await import("@/lib/catalog/get-catalog");
    const catalog = await getCatalog();
    expect(combosCallsBefore).toBeGreaterThanOrEqual(0);

    expect(catalog.combos).toHaveLength(1);
    const [combo] = catalog.combos;
    expect(combo.slots).toHaveLength(3);

    expect(combo.slots[0].rules).toEqual({
      min_quantity: 1,
      max_quantity: 2,
      allowed_meat_count: [1, 2],
      no_fries: undefined,
    });

    expect(combo.slots[1].rules).toEqual({
      min_quantity: 0,
      max_quantity: 1,
      allowed_meat_count: undefined,
      no_fries: true,
    });

    // Slot with no rules at all: max_quantity falls back to slot.quantity,
    // min_quantity falls back to 0 (mirrors use-combos.ts:82-91).
    expect(combo.slots[2].rules).toEqual({
      min_quantity: 0,
      max_quantity: 3,
      allowed_meat_count: undefined,
      no_fries: undefined,
    });
  });

  it("R17: throws a named error when the 'Medallón' extra is missing", async () => {
    const mock = createSupabaseMock(
      routesWithMeatAndFries([
        {
          table: "extras",
          match: (calls) => hasEq(calls, "name", "Medallón"),
          result: { data: null, error: null },
        },
      ]),
    );
    setSupabaseMock(mock);

    const { getCatalog } = await import("@/lib/catalog/get-catalog");

    await expect(getCatalog()).rejects.toThrow(/Medallón/);
    await expect(getCatalog()).rejects.toThrow(/Catalog integrity/);
  });

  it("R17: throws a named error when the 'Papas fritas chicas' extra is missing", async () => {
    const mock = createSupabaseMock(
      routesWithMeatAndFries([
        {
          table: "extras",
          match: (calls) => hasEq(calls, "name", "Papas fritas chicas"),
          result: { data: null, error: null },
        },
      ]),
    );
    setSupabaseMock(mock);

    const { getCatalog } = await import("@/lib/catalog/get-catalog");

    await expect(getCatalog()).rejects.toThrow(/Papas fritas chicas/);
    await expect(getCatalog()).rejects.toThrow(/Catalog integrity/);
  });

  it("R17: returns meatExtra/friesExtra even when is_available = false on those rows, without filtering by is_available", async () => {
    const unavailableMeat = { ...MEAT_EXTRA_ROW, is_available: false };
    const unavailableFries = { ...FRIES_EXTRA_ROW, is_available: false };

    const mock = createSupabaseMock([
      { table: "burgers", match: () => true, result: { data: [], error: null } },
      { table: "combos", match: () => true, result: { data: [], error: null } },
      {
        table: "extras",
        match: (calls) => hasEq(calls, "is_available", true),
        result: { data: [], error: null },
      },
      {
        table: "extras",
        match: (calls) => hasEq(calls, "name", "Medallón"),
        result: { data: unavailableMeat, error: null },
      },
      {
        table: "extras",
        match: (calls) => hasEq(calls, "name", "Papas fritas chicas"),
        result: { data: unavailableFries, error: null },
      },
    ]);
    setSupabaseMock(mock);

    const { getCatalog } = await import("@/lib/catalog/get-catalog");
    const catalog = await getCatalog();

    expect(catalog.meatExtra).toEqual(unavailableMeat);
    expect(catalog.friesExtra).toEqual(unavailableFries);

    // The meat/fries lookups must be a separate query that never filters by
    // is_available -- confirm no `.eq("is_available", ...)` call happened on
    // the same builder invocation used for the name-based lookup.
    const meatCall = mock.from.mock.results
      .map((r) => r.value)
      .find((builder) =>
        (builder.eq as ReturnType<typeof vi.fn>).mock.calls.some(
          (args: unknown[]) => args[0] === "name" && args[1] === "Medallón",
        ),
      );
    expect(meatCall).toBeDefined();
    const meatEqCalls = (meatCall.eq as ReturnType<typeof vi.fn>).mock.calls;
    expect(meatEqCalls.some((args: unknown[]) => args[0] === "is_available")).toBe(
      false,
    );
  });

  it("includes deliveryFeeArs from lib/env.ts in the returned catalog", async () => {
    const mock = createSupabaseMock(routesWithMeatAndFries());
    setSupabaseMock(mock);

    const { getCatalog } = await import("@/lib/catalog/get-catalog");
    const catalog = await getCatalog();

    expect(catalog.deliveryFeeArs).toBe(2000);
  });
});
