import { beforeEach, describe, expect, it, vi } from "vitest";

// DD2 + DD5 (design.md): phone dedup (exact match fast path, bounded
// fallback scan), reuse-customer-never-update-name, reuse-address-on-text
// -match-else-insert-never-update.

type QueryCall = { method: string; args: unknown[] };
interface MockResult {
  data: unknown;
  error: unknown;
}
interface Route {
  table: string;
  match: (calls: QueryCall[]) => boolean;
  result: MockResult;
}

function createSupabaseMock(routes: Route[]) {
  const insertedRows: { table: string; payload: unknown }[] = [];

  const from = vi.fn((table: string) => {
    const calls: QueryCall[] = [];
    const resolveResult = (): MockResult => {
      const route = routes.find((r) => r.table === table && r.match(calls));
      return route ? route.result : { data: null, error: null };
    };

    const builder: Record<string, unknown> = {};
    for (const method of ["select", "eq", "not", "limit", "order"]) {
      builder[method] = vi.fn((...args: unknown[]) => {
        calls.push({ method, args });
        return builder;
      });
    }
    builder.insert = vi.fn((payload: unknown) => {
      calls.push({ method: "insert", args: [payload] });
      insertedRows.push({ table, payload });
      return builder;
    });
    builder.single = vi.fn(() => Promise.resolve(resolveResult()));
    builder.maybeSingle = vi.fn(() => Promise.resolve(resolveResult()));
    builder.then = (
      onFulfilled?: (value: MockResult) => unknown,
      onRejected?: (reason: unknown) => unknown,
    ) => Promise.resolve(resolveResult()).then(onFulfilled, onRejected);

    return builder;
  });

  return { from, insertedRows };
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

function hasInsert(calls: QueryCall[]): boolean {
  return calls.some((c) => c.method === "insert");
}
function hasEq(calls: QueryCall[], column: string): boolean {
  return calls.some((c) => c.method === "eq" && c.args[0] === column);
}
function hasNot(calls: QueryCall[], column: string): boolean {
  return calls.some((c) => c.method === "not" && c.args[0] === column);
}

describe("resolveDeliveryTarget()", () => {
  beforeEach(() => {
    vi.resetModules();
  });

  it("new phone creates both a customers row and a customer_addresses row", async () => {
    const mock = createSupabaseMock([
      // fast-path lookup misses
      {
        table: "customers",
        match: (calls) => hasEq(calls, "phone") && !hasInsert(calls),
        result: { data: null, error: null },
      },
      // fallback scan also misses (empty customer base)
      {
        table: "customers",
        match: (calls) => hasNot(calls, "phone"),
        result: { data: [], error: null },
      },
      // create the customer
      {
        table: "customers",
        match: (calls) => hasInsert(calls),
        result: { data: { id: "cust-new", name: "Juan" }, error: null },
      },
      // insert the first address
      {
        table: "customer_addresses",
        match: (calls) => hasInsert(calls),
        result: { data: { id: "addr-new" }, error: null },
      },
    ]);
    setSupabaseMock(mock);

    const { resolveDeliveryTarget } = await import(
      "@/lib/order/resolve-delivery-target"
    );

    const result = await resolveDeliveryTarget({
      name: "Juan",
      phone: "+54 9 345 412-3456",
      address: "San Martín 123",
    });

    expect(result).toEqual({ customerId: "cust-new", customerAddressId: "addr-new" });

    const customerInsert = mock.insertedRows.find((r) => r.table === "customers");
    expect(customerInsert?.payload).toEqual({
      name: "Juan",
      phone: "5493454123456",
    });

    const addressInsert = mock.insertedRows.find(
      (r) => r.table === "customer_addresses",
    );
    expect(addressInsert?.payload).toMatchObject({
      customer_id: "cust-new",
      address: "San Martín 123",
      label: "Principal",
      is_default: true,
    });
  });

  it("same phone + same (normalized) address reuses both the customer and the address", async () => {
    const mock = createSupabaseMock([
      {
        table: "customers",
        match: (calls) => hasEq(calls, "phone"),
        result: { data: { id: "cust-1", name: "Juan" }, error: null },
      },
      {
        table: "customer_addresses",
        match: (calls) => hasEq(calls, "customer_id") && !hasInsert(calls),
        result: {
          data: [{ id: "addr-1", address: "San Martín   123" }],
          error: null,
        },
      },
    ]);
    setSupabaseMock(mock);

    const { resolveDeliveryTarget } = await import(
      "@/lib/order/resolve-delivery-target"
    );

    const result = await resolveDeliveryTarget({
      name: "Juan",
      phone: "5493454123456",
      // Same address, different whitespace/case -- must still match via
      // the normalized-text comparison.
      address: "  san martín 123 ",
    });

    expect(result).toEqual({ customerId: "cust-1", customerAddressId: "addr-1" });
    expect(mock.insertedRows).toHaveLength(0);
  });

  it("same phone + a DIFFERENT address reuses the customer, inserts a NEW address, and never updates the existing row", async () => {
    const mock = createSupabaseMock([
      {
        table: "customers",
        match: (calls) => hasEq(calls, "phone"),
        result: { data: { id: "cust-1", name: "Juan" }, error: null },
      },
      {
        table: "customer_addresses",
        match: (calls) => hasEq(calls, "customer_id") && !hasInsert(calls),
        result: {
          data: [{ id: "addr-1", address: "San Martín 123" }],
          error: null,
        },
      },
      {
        table: "customer_addresses",
        match: (calls) => hasInsert(calls),
        result: { data: { id: "addr-2" }, error: null },
      },
    ]);
    setSupabaseMock(mock);

    const { resolveDeliveryTarget } = await import(
      "@/lib/order/resolve-delivery-target"
    );

    const result = await resolveDeliveryTarget({
      name: "Juan",
      phone: "5493454123456",
      address: "Belgrano 456",
    });

    expect(result).toEqual({ customerId: "cust-1", customerAddressId: "addr-2" });

    // Never an update/mutation of the existing row -- only one insert, and
    // it targets customer_addresses with is_default: false (an address
    // already exists for this customer).
    expect(mock.insertedRows).toHaveLength(1);
    expect(mock.insertedRows[0]).toMatchObject({
      table: "customer_addresses",
      payload: {
        customer_id: "cust-1",
        address: "Belgrano 456",
        is_default: false,
      },
    });
  });

  it("matches a legacy human-formatted phone via the bounded fallback scan", async () => {
    const mock = createSupabaseMock([
      // fast path misses -- the stored legacy row isn't in the normalized
      // digit format landing-created rows use.
      {
        table: "customers",
        match: (calls) => hasEq(calls, "phone") && !hasInsert(calls),
        result: { data: null, error: null },
      },
      // fallback scan finds it by phoneKey (last 10 digits)
      {
        table: "customers",
        match: (calls) => hasNot(calls, "phone"),
        result: {
          data: [{ id: "cust-legacy", name: "Ana", phone: "345 412 3456" }],
          error: null,
        },
      },
      {
        table: "customer_addresses",
        match: (calls) => hasEq(calls, "customer_id") && !hasInsert(calls),
        result: { data: [], error: null },
      },
      {
        table: "customer_addresses",
        match: (calls) => hasInsert(calls),
        result: { data: { id: "addr-legacy" }, error: null },
      },
    ]);
    setSupabaseMock(mock);

    const { resolveDeliveryTarget } = await import(
      "@/lib/order/resolve-delivery-target"
    );

    const result = await resolveDeliveryTarget({
      name: "Ana",
      phone: "+54 9 345 412 3456",
      address: "Mitre 789",
    });

    expect(result.customerId).toBe("cust-legacy");
    // No new customers row -- the legacy row was reused, not duplicated.
    expect(mock.insertedRows.some((r) => r.table === "customers")).toBe(false);
  });
});
