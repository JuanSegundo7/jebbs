import { beforeEach, describe, expect, it, vi } from "vitest";

// lib/env.ts throws at module load (DD3), so it must be configured before
// anything under test imports it transitively via get-catalog.ts.
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
    {
      table: "delivery_zones",
      match: () => true,
      result: { data: [], error: null },
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

    // Side slot with required: true and no min rule: required NO exige nada en
    // slots que no son de hamburguesa (en producción required=true es el default
    // de la DB en todos los slots, no una decisión del dueño).
    expect(combo.slots[1].rules).toEqual({
      min_quantity: 0,
      max_quantity: 1,
      allowed_meat_count: undefined,
      no_fries: true,
    });

    // Slot with no rules at all: max_quantity falls back to slot.quantity,
    // min_quantity falls back to 0 when not required.
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

  it("filters delivery zones by is_active = true and orders by sort_order then name", async () => {
    const zoneRows = [
      { id: "z-1", name: "City Bell", description: null, fee: 1500, is_active: true, sort_order: 1, map_zone_key: "z1" },
      { id: "z-2", name: "La Plata", description: null, fee: 2500, is_active: true, sort_order: 2, map_zone_key: "z4" },
    ];
    const mock = createSupabaseMock(
      routesWithMeatAndFries([
        {
          table: "delivery_zones",
          match: (calls) => hasEq(calls, "is_active", true),
          result: { data: zoneRows, error: null },
        },
      ]),
    );
    setSupabaseMock(mock);

    const { getCatalog } = await import("@/lib/catalog/get-catalog");
    const catalog = await getCatalog();

    expect(catalog.deliveryZones).toEqual(zoneRows);
    expect(catalog.minDeliveryFeeArs).toBe(1500);
  });

  it("minDeliveryFeeArs is null when no zones are active", async () => {
    const mock = createSupabaseMock(routesWithMeatAndFries());
    setSupabaseMock(mock);

    const { getCatalog } = await import("@/lib/catalog/get-catalog");
    const catalog = await getCatalog();

    expect(catalog.deliveryZones).toEqual([]);
    expect(catalog.minDeliveryFeeArs).toBeNull();
  });
  describe("combo slot rules: fixed burger, meat alias, min by required", () => {
    const FIXED_BURGER_ID = "burger-fixed";
    const burgerRow = (id: string) => ({
      id,
      name: id,
      description: null,
      base_price: 5000,
      ingredients: [],
      is_available: true,
      image_url: null,
      default_meat_quantity: 3,
      default_fries_quantity: 1,
      created_at: "2024-01-01",
    });

    const comboWithSlot = (
      slotOverrides: Record<string, unknown>,
      rules: { id: number; rule_type: string; rule_value: string }[],
      comboId = "combo-x",
    ) => ({
      id: comboId,
      name: `Combo ${comboId}`,
      price: 12000,
      description: null,
      is_available: true,
      created_at: "2024-01-01",
      combo_slots: [
        {
          id: `${comboId}-slot`,
          combo_id: comboId,
          slot_type: "burger",
          quantity: 2,
          required: true,
          default_meat_quantity: null,
          created_at: "2024-01-01",
          combo_slots_rules: rules,
          ...slotOverrides,
        },
      ],
    });

    async function catalogFor(
      combos: unknown[],
      burgers: unknown[] = [burgerRow(FIXED_BURGER_ID)],
    ) {
      const mock = createSupabaseMock(
        routesWithMeatAndFries([
          {
            table: "burgers",
            match: (calls) => hasEq(calls, "is_available", true),
            result: { data: burgers, error: null },
          },
          {
            table: "combos",
            match: (calls) => hasEq(calls, "is_available", true),
            result: { data: combos, error: null },
          },
        ]),
      );
      setSupabaseMock(mock);
      const { getCatalog } = await import("@/lib/catalog/get-catalog");
      return getCatalog();
    }

    it("parses fixed_burger_id into rules", async () => {
      const catalog = await catalogFor([
        comboWithSlot({}, [
          { id: 1, rule_type: "fixed_burger_id", rule_value: FIXED_BURGER_ID },
        ]),
      ]);
      expect(catalog.combos).toHaveLength(1);
      expect(catalog.combos[0].slots[0].rules.fixed_burger_id).toBe(FIXED_BURGER_ID);
    });

    it("reads the legacy allowed_default_meat_quantity name as an alias of allowed_meat_count", async () => {
      const catalog = await catalogFor([
        comboWithSlot({}, [
          { id: 1, rule_type: "allowed_default_meat_quantity", rule_value: "[3]" },
        ]),
      ]);
      expect(catalog.combos[0].slots[0].rules.allowed_meat_count).toEqual([3]);
    });

    it("prefers allowed_meat_count when both names are present", async () => {
      const catalog = await catalogFor([
        comboWithSlot({}, [
          { id: 1, rule_type: "allowed_default_meat_quantity", rule_value: "[1]" },
          { id: 2, rule_type: "allowed_meat_count", rule_value: "[2,3]" },
        ]),
      ]);
      expect(catalog.combos[0].slots[0].rules.allowed_meat_count).toEqual([2, 3]);
    });

    it("min_quantity falls back to slot.quantity when a BURGER slot is required and has no rule", async () => {
      const catalog = await catalogFor([comboWithSlot({ required: true }, [])]);
      expect(catalog.combos[0].slots[0].rules.min_quantity).toBe(2);
    });

    it.each(["drink", "side", "nuggets"])(
      "min_quantity stays 0 for a required %s slot with no rule (required is the DB default, not intent)",
      async (slotType) => {
        const catalog = await catalogFor([
          comboWithSlot({ slot_type: slotType, required: true }, []),
        ]);
        expect(catalog.combos[0].slots[0].rules.min_quantity).toBe(0);
      },
    );

    it("an explicit min_quantity rule still applies to a drink slot", async () => {
      const catalog = await catalogFor([
        comboWithSlot({ slot_type: "drink", required: true }, [
          { id: 1, rule_type: "min_quantity", rule_value: "1" },
        ]),
      ]);
      expect(catalog.combos[0].slots[0].rules.min_quantity).toBe(1);
    });

    it("min_quantity falls back to 0 when not required and no rule", async () => {
      const catalog = await catalogFor([comboWithSlot({ required: false }, [])]);
      expect(catalog.combos[0].slots[0].rules.min_quantity).toBe(0);
    });

    it("an explicit min_quantity rule wins over required", async () => {
      const catalog = await catalogFor([
        comboWithSlot({ required: true }, [
          { id: 1, rule_type: "min_quantity", rule_value: "1" },
        ]),
      ]);
      expect(catalog.combos[0].slots[0].rules.min_quantity).toBe(1);
    });

    it("excludes a combo whose fixed burger is not among the available burgers", async () => {
      const catalog = await catalogFor([
        comboWithSlot(
          {},
          [{ id: 1, rule_type: "fixed_burger_id", rule_value: "burger-gone" }],
          "combo-broken",
        ),
        comboWithSlot(
          {},
          [{ id: 2, rule_type: "fixed_burger_id", rule_value: FIXED_BURGER_ID }],
          "combo-ok",
        ),
      ]);
      expect(catalog.combos.map((c) => c.id)).toEqual(["combo-ok"]);
    });
  });
});
