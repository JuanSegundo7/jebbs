import { beforeEach, describe, expect, it, vi } from "vitest";
import type { NextRequest } from "next/server";

// lib/env.ts throws at module load (DD3) -- must be set before anything
// under test imports it transitively (route.ts imports it directly for
// env.DELIVERY_FEE_ARS).
process.env.DELIVERY_FEE_ARS = "1500";
process.env.NEXT_PUBLIC_WHATSAPP_NUMBER = "5493454123456";

const BURGER_ID = "11111111-1111-4111-8111-111111111111";
const MEAT_EXTRA_ID = "22222222-2222-4222-8222-222222222222";
const FRIES_EXTRA_ID = "33333333-3333-4333-8333-333333333333";

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
  deliveryFeeArs: 1500,
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

function deliveryBody() {
  return {
    ...pickupBody(),
    fulfillment: { type: "delivery", address: "San Martín 123" },
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
    expect(json).toEqual({
      order_id: "order-1",
      order_number: 42,
      total_amount: 5000,
      delivery_fee: 0,
    });

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
          data: { ...ORDERS_RE_QUERY_ROW, delivery_fee: 1500 },
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
      delivery_fee: 1500,
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
