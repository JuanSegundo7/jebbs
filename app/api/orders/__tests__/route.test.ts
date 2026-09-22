import { beforeEach, describe, expect, it, vi } from "vitest";
import type { NextRequest } from "next/server";

// lib/env.ts throws at module load (DD3) -- must be set before anything
// under test imports it transitively.
process.env.NEXT_PUBLIC_WHATSAPP_NUMBER = "5493454123456";

const BURGER_ID = "11111111-1111-4111-8111-111111111111";
const MEAT_EXTRA_ID = "22222222-2222-4222-8222-222222222222";
const FRIES_EXTRA_ID = "33333333-3333-4333-8333-333333333333";
const ZONE_ID = "44444444-4444-4444-8444-444444444444";
const INACTIVE_ZONE_ID = "55555555-5555-4555-8555-555555555555";

const CATALOG_FIXTURE = {
  burgers: [
    {
      id: BURGER_ID,
      name: "Clásica",
      description: null,
      base_price: 5000,
      ingredients: [],
      is_available: true,
      image_url: null,
      default_meat_quantity: 1,
      default_fries_quantity: 1,
      created_at: "2024-01-01",
    },
  ],
  extras: [],
  combos: [],
  meatExtra: { id: MEAT_EXTRA_ID, name: "Medallón", category: "extra", price: 800, is_available: true, created_at: "2024-01-01" },
  friesExtra: { id: FRIES_EXTRA_ID, name: "Papas fritas chicas", category: "fries", price: 500, is_available: true, created_at: "2024-01-01" },
  deliveryZones: [
    {
      id: ZONE_ID,
      name: "City Bell",
      description: null,
      fee: 1500,
      is_active: true,
      sort_order: 1,
      map_zone_key: "z1",
    },
  ],
  minDeliveryFeeArs: 1500,
};

vi.mock("@/lib/catalog/get-catalog", () => ({
  getCatalog: async () => CATALOG_FIXTURE,
}));

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
function hasEqColumn(calls: QueryCall[], column: string): boolean {
  return calls.some((c) => c.method === "eq" && c.args[0] === column);
}

function makeRequest(body: unknown, ip = "9.9.9.9"): NextRequest {
  return {
    headers: { get: (key: string) => (key === "x-forwarded-for" ? ip : null) },
    json: async () => body,
  } as unknown as NextRequest;
}

const ORDERS_RE_QUERY_ROW = {
  id: "order-1",
  order_number: 42,
  total_amount: 5000,
  delivery_fee: 0,
  delivery_zone_id: null,
  delivery_zone_name: null,
  delivery_fee_pending: false,
  created_at: "2026-01-15T15:05:00.000Z",
  customer_name: "Juan",
  customer: null,
  customer_address_id: null,
  delivery_type: "pickup",
  delivery_time: null,
  payment_method: "cash",
  discount_type: "none",
  discount_value: 0,
  discount_amount: 0,
  price_adjustment: 0,
  notes: null,
  order_items: [],
};

function pickupBody() {
  return {
    burgers: [
      {
        burger_id: BURGER_ID,
        quantity: 1,
        meat_count: 1,
        fries_quantity: 1,
        is_veggie: false,
        removed_ingredients: [],
        extras: [],
      },
    ],
    combos: [],
    sides: [],
    fulfillment: { type: "pickup" },
    customer: { name: "Juan" },
    payment_method: "cash",
  };
}

function deliveryBody(overrides: Record<string, unknown> = {}) {
  return {
    ...pickupBody(),
    fulfillment: { type: "delivery", address: "San Martín 123", zone_id: ZONE_ID, ...overrides },
    customer: { name: "Juan", phone: "+54 9 345 412-3456" },
  };
}

describe("POST /api/orders", () => {
  beforeEach(async () => {
    vi.resetModules();
    const { __resetRateLimitForTests } = await import("@/lib/order/rate-limit");
    __resetRateLimitForTests();
  });

  it("pickup: writes no customers/customer_addresses row, customer_address_id null, delivery_fee 0", async () => {
    const mock = createSupabaseMock([
      {
        table: "orders",
        match: (calls) => hasInsert(calls),
        result: { data: { id: "order-1" }, error: null },
      },
      {
        table: "order_items",
        match: (calls) => hasInsert(calls),
        result: { data: { id: "item-1" }, error: null },
      },
      {
        table: "orders",
        match: (calls) => hasEqColumn(calls, "id"),
        result: { data: ORDERS_RE_QUERY_ROW, error: null },
      },
    ]);
    setSupabaseMock(mock);

    const { POST } = await import("@/app/api/orders/route");
    const response = await POST(makeRequest(pickupBody()));
    const json = await response.json();

    expect(response.status).toBe(201);
    expect(json).toMatchObject({
      order_id: "order-1",
      order_number: 42,
      total_amount: 5000,
      delivery_fee: 0,
    });
    expect(typeof json.whatsapp_text).toBe("string");
    expect(json.whatsapp_url).toBe(
      `https://wa.me/5493454123456?text=${encodeURIComponent(json.whatsapp_text)}`,
    );

    expect(mock.insertedRows.some((r) => r.table === "customers")).toBe(false);
    expect(
      mock.insertedRows.some((r) => r.table === "customer_addresses"),
    ).toBe(false);

    const orderInsert = mock.insertedRows.find((r) => r.table === "orders");
    expect(orderInsert?.payload).toMatchObject({
      customer_id: null,
      customer_address_id: null,
      delivery_fee: 0,
      delivery_type: "pickup",
      source: "web",
      status: "new",
    });
  });

  it("delivery: writes both a customers row and a customer_addresses row", async () => {
    const mock = createSupabaseMock([
      // resolveDeliveryTarget: no existing customer
      {
        table: "customers",
        match: (calls) => hasEqColumn(calls, "phone") && !hasInsert(calls),
        result: { data: null, error: null },
      },
      {
        table: "customers",
        match: (calls) => calls.some((c) => c.method === "not") && !hasInsert(calls),
        result: { data: [], error: null },
      },
      {
        table: "customers",
        match: (calls) => hasInsert(calls),
        result: { data: { id: "cust-1", name: "Juan" }, error: null },
      },
      {
        table: "customer_addresses",
        match: (calls) => hasInsert(calls),
        result: { data: { id: "addr-1" }, error: null },
      },
      // create-web-order.ts
      {
        table: "orders",
        match: (calls) => hasInsert(calls),
        result: { data: { id: "order-1" }, error: null },
      },
      {
        table: "order_items",
        match: (calls) => hasInsert(calls),
        result: { data: { id: "item-1" }, error: null },
      },
      {
        table: "orders",
        match: (calls) => hasEqColumn(calls, "id"),
        result: {
          data: {
            ...ORDERS_RE_QUERY_ROW,
            delivery_fee: 1500,
            delivery_type: "delivery",
            delivery_zone_id: ZONE_ID,
            delivery_zone_name: "City Bell",
          },
          error: null,
        },
      },
    ]);
    setSupabaseMock(mock);

    const { POST } = await import("@/app/api/orders/route");
    const response = await POST(makeRequest(deliveryBody()));
    const json = await response.json();

    expect(response.status).toBe(201);
    expect(json.delivery_fee).toBe(1500);

    expect(mock.insertedRows.some((r) => r.table === "customers")).toBe(true);
    expect(
      mock.insertedRows.some((r) => r.table === "customer_addresses"),
    ).toBe(true);

    const orderInsert = mock.insertedRows.find((r) => r.table === "orders");
    expect(orderInsert?.payload).toMatchObject({
      customer_id: "cust-1",
      customer_address_id: "addr-1",
      delivery_type: "delivery",
      // The zone's real fee (CATALOG_FIXTURE.deliveryZones) -- see the
      // dedicated "stamps the active zone's own fee" test below, which
      // uses a mismatched fixture fee to prove it isn't hardcoded/stale.
      delivery_fee: 1500,
      delivery_zone_id: ZONE_ID,
      delivery_zone_name: "City Bell",
      delivery_fee_pending: false,
    });
  });

  it("stamps the active zone's own fee, recomputed from the live catalog", async () => {
    // CATALOG_FIXTURE's zone fee (1500) is swapped out for a different
    // value here so a regression back to a hardcoded/stale fee would be
    // caught by this assertion instead of passing by coincidence.
    //
    // Mutates the shared CATALOG_FIXTURE.deliveryZones in place (restored
    // in `finally`) instead of vi.doMock/vi.doUnmock: doUnmock-ing a module
    // also tears down the file's own top-level vi.mock() for it, leaving
    // every later test in this file to hit the real getCatalog() (and a
    // Supabase mock with no matching routes) -- a real bug hit while
    // writing this test.
    const originalZones = CATALOG_FIXTURE.deliveryZones;
    CATALOG_FIXTURE.deliveryZones = [{ ...originalZones[0], fee: 3300 }];

    try {
      const mock = createSupabaseMock([
        { table: "customers", match: (calls) => hasEqColumn(calls, "phone") && !hasInsert(calls), result: { data: null, error: null } },
        { table: "customers", match: (calls) => calls.some((c) => c.method === "not") && !hasInsert(calls), result: { data: [], error: null } },
        { table: "customers", match: (calls) => hasInsert(calls), result: { data: { id: "cust-1", name: "Juan" }, error: null } },
        { table: "customer_addresses", match: (calls) => hasInsert(calls), result: { data: { id: "addr-1" }, error: null } },
        { table: "orders", match: (calls) => hasInsert(calls), result: { data: { id: "order-1" }, error: null } },
        { table: "order_items", match: (calls) => hasInsert(calls), result: { data: { id: "item-1" }, error: null } },
        { table: "orders", match: (calls) => hasEqColumn(calls, "id"), result: { data: { ...ORDERS_RE_QUERY_ROW, delivery_fee: 3300, delivery_type: "delivery" }, error: null } },
      ]);
      setSupabaseMock(mock);

      const { POST } = await import("@/app/api/orders/route");
      const response = await POST(makeRequest(deliveryBody()));
      const json = await response.json();

      expect(response.status).toBe(201);
      expect(json.delivery_fee).toBe(3300);

      const orderInsert = mock.insertedRows.find((r) => r.table === "orders");
      expect(orderInsert?.payload).toMatchObject({ delivery_fee: 3300 });
    } finally {
      CATALOG_FIXTURE.deliveryZones = originalZones;
    }
  });

  it("an inactive/unknown zone id is rejected with 409 ZONE_UNAVAILABLE, no insert attempted", async () => {
    const mock = createSupabaseMock([]);
    setSupabaseMock(mock);

    const { POST } = await import("@/app/api/orders/route");
    const response = await POST(
      makeRequest(deliveryBody({ zone_id: INACTIVE_ZONE_ID })),
    );
    const json = await response.json();

    expect(response.status).toBe(409);
    expect(json.error.code).toBe("ZONE_UNAVAILABLE");
    expect(mock.insertedRows).toHaveLength(0);
  });

  it("zone_id: null creates the order with delivery_fee 0 and delivery_fee_pending true", async () => {
    const mock = createSupabaseMock([
      { table: "customers", match: (calls) => hasEqColumn(calls, "phone") && !hasInsert(calls), result: { data: null, error: null } },
      { table: "customers", match: (calls) => calls.some((c) => c.method === "not") && !hasInsert(calls), result: { data: [], error: null } },
      { table: "customers", match: (calls) => hasInsert(calls), result: { data: { id: "cust-1", name: "Juan" }, error: null } },
      { table: "customer_addresses", match: (calls) => hasInsert(calls), result: { data: { id: "addr-1" }, error: null } },
      { table: "orders", match: (calls) => hasInsert(calls), result: { data: { id: "order-1" }, error: null } },
      { table: "order_items", match: (calls) => hasInsert(calls), result: { data: { id: "item-1" }, error: null } },
      {
        table: "orders",
        match: (calls) => hasEqColumn(calls, "id"),
        result: {
          data: { ...ORDERS_RE_QUERY_ROW, delivery_type: "delivery", delivery_fee: 0, delivery_fee_pending: true },
          error: null,
        },
      },
    ]);
    setSupabaseMock(mock);

    const { POST } = await import("@/app/api/orders/route");
    const response = await POST(makeRequest(deliveryBody({ zone_id: null })));
    const json = await response.json();

    expect(response.status).toBe(201);
    expect(json.delivery_fee).toBe(0);

    const orderInsert = mock.insertedRows.find((r) => r.table === "orders");
    expect(orderInsert?.payload).toMatchObject({
      delivery_fee: 0,
      delivery_zone_id: null,
      delivery_zone_name: null,
      delivery_fee_pending: true,
    });
  });

  it("pickup fulfillment ignores zone entirely -- delivery_zone_id/name null, delivery_fee_pending false", async () => {
    const mock = createSupabaseMock([
      {
        table: "orders",
        match: (calls) => hasInsert(calls),
        result: { data: { id: "order-1" }, error: null },
      },
      {
        table: "order_items",
        match: (calls) => hasInsert(calls),
        result: { data: { id: "item-1" }, error: null },
      },
      {
        table: "orders",
        match: (calls) => hasEqColumn(calls, "id"),
        result: { data: ORDERS_RE_QUERY_ROW, error: null },
      },
    ]);
    setSupabaseMock(mock);

    const { POST } = await import("@/app/api/orders/route");
    // pickupBody()'s fulfillment is { type: "pickup" } -- no zone_id key at
    // all, since it's not part of the pickup branch of FulfillmentSchema.
    const response = await POST(makeRequest(pickupBody()));

    expect(response.status).toBe(201);
    const orderInsert = mock.insertedRows.find((r) => r.table === "orders");
    expect(orderInsert?.payload).toMatchObject({
      delivery_fee: 0,
      delivery_zone_id: null,
      delivery_zone_name: null,
      delivery_fee_pending: false,
    });
  });

  it("R11: never persists a delivery order with a null address id -- aborts before any insert", async () => {
    vi.doMock("@/lib/order/resolve-delivery-target", () => ({
      resolveDeliveryTarget: async () => ({
        customerId: "cust-1",
        customerAddressId: null,
      }),
    }));

    const mock = createSupabaseMock([]);
    setSupabaseMock(mock);

    const { POST } = await import("@/app/api/orders/route");
    const response = await POST(makeRequest(deliveryBody()));
    const json = await response.json();

    expect(response.status).toBe(500);
    expect(json.error.code).toBe("ORDER_PERSIST_FAILED");
    expect(mock.insertedRows.some((r) => r.table === "orders")).toBe(false);

    vi.doUnmock("@/lib/order/resolve-delivery-target");
  });

  it("rejects a tampered posted total/fee with a 400 before touching the database (unknown key)", async () => {
    const mock = createSupabaseMock([]);
    setSupabaseMock(mock);

    const { POST } = await import("@/app/api/orders/route");
    const response = await POST(
      makeRequest({ ...pickupBody(), total_amount: 1 }),
    );

    expect(response.status).toBe(400);
    expect(mock.insertedRows).toHaveLength(0);
  });

  it("rate limit: the 11th request within the window from the same IP is rejected with 429", async () => {
    const mock = createSupabaseMock([
      {
        table: "orders",
        match: (calls) => hasInsert(calls),
        result: { data: { id: "order-1" }, error: null },
      },
      {
        table: "order_items",
        match: (calls) => hasInsert(calls),
        result: { data: { id: "item-1" }, error: null },
      },
      {
        table: "orders",
        match: (calls) => hasEqColumn(calls, "id"),
        result: { data: ORDERS_RE_QUERY_ROW, error: null },
      },
    ]);
    setSupabaseMock(mock);

    const { POST } = await import("@/app/api/orders/route");
    for (let i = 0; i < 10; i++) {
      const response = await POST(makeRequest(pickupBody(), "5.5.5.5"));
      expect(response.status).toBe(201);
    }

    const eleventh = await POST(makeRequest(pickupBody(), "5.5.5.5"));
    expect(eleventh.status).toBe(429);
    const json = await eleventh.json();
    expect(json.error.code).toBe("RATE_LIMITED");
  });
});
