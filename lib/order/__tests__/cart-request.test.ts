import { describe, expect, it } from "vitest";
import { CreateWebOrderSchema } from "@/lib/order/cart-request";

const BURGER_ID = "11111111-1111-1111-1111-111111111111";
const ZONE_ID = "22222222-2222-2222-2222-222222222222";

function validBurgerLine(overrides: Record<string, unknown> = {}) {
  return {
    burger_id: BURGER_ID,
    quantity: 1,
    meat_count: 1,
    fries_quantity: 1,
    is_veggie: false,
    removed_ingredients: [],
    extras: [],
    ...overrides,
  };
}

function validPayload(overrides: Record<string, unknown> = {}) {
  return {
    burgers: [validBurgerLine()],
    combos: [],
    sides: [],
    fulfillment: { type: "pickup" as const },
    customer: { name: "Juan" },
    payment_method: "cash" as const,
    ...overrides,
  };
}

describe("CreateWebOrderSchema", () => {
  it("accepts a valid pickup payload", () => {
    const result = CreateWebOrderSchema.safeParse(validPayload());
    expect(result.success).toBe(true);
  });

  it("rejects an unknown top-level key (e.g. a posted total_amount)", () => {
    const result = CreateWebOrderSchema.safeParse(
      validPayload({ total_amount: 1 }),
    );
    expect(result.success).toBe(false);
  });

  it("rejects an unknown key on a burger line (e.g. a posted unit_price)", () => {
    const result = CreateWebOrderSchema.safeParse(
      validPayload({ burgers: [validBurgerLine({ unit_price: 5000 })] }),
    );
    expect(result.success).toBe(false);
  });

  it("rejects a posted delivery_fee key at the top level", () => {
    const result = CreateWebOrderSchema.safeParse(
      validPayload({ delivery_fee: 2000 }),
    );
    expect(result.success).toBe(false);
  });

  it("rejects a posted source/status override", () => {
    const result = CreateWebOrderSchema.safeParse(
      validPayload({ source: "web", status: "new" }),
    );
    expect(result.success).toBe(false);
  });

  it("rejects an empty cart with EMPTY_CART", () => {
    const result = CreateWebOrderSchema.safeParse(
      validPayload({ burgers: [], combos: [], sides: [] }),
    );
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(
        result.error.issues.some((issue) => issue.message === "EMPTY_CART"),
      ).toBe(true);
    }
  });

  it("rejects delivery without a valid phone with PHONE_REQUIRED_FOR_DELIVERY", () => {
    const result = CreateWebOrderSchema.safeParse(
      validPayload({
        fulfillment: {
          type: "delivery",
          address: "Calle Falsa 123, Springfield",
          zone_id: ZONE_ID,
        },
        customer: { name: "Juan" },
      }),
    );
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(
        result.error.issues.some(
          (issue) => issue.message === "PHONE_REQUIRED_FOR_DELIVERY",
        ),
      ).toBe(true);
    }
  });

  it("accepts delivery with a valid phone and address", () => {
    const result = CreateWebOrderSchema.safeParse(
      validPayload({
        fulfillment: {
          type: "delivery",
          address: "Calle Falsa 123, Springfield",
          zone_id: ZONE_ID,
        },
        customer: { name: "Juan", phone: "345 412 3456" },
      }),
    );
    expect(result.success).toBe(true);
  });

  it("rejects a delivery payload missing zone_id entirely (a stale client must get a 400, never silently become pending)", () => {
    const result = CreateWebOrderSchema.safeParse(
      validPayload({
        fulfillment: {
          type: "delivery",
          address: "Calle Falsa 123, Springfield",
        },
        customer: { name: "Juan", phone: "345 412 3456" },
      }),
    );
    expect(result.success).toBe(false);
  });

  it("accepts zone_id: null (explicit 'no encuentro mi zona')", () => {
    const result = CreateWebOrderSchema.safeParse(
      validPayload({
        fulfillment: {
          type: "delivery",
          address: "Calle Falsa 123, Springfield",
          zone_id: null,
        },
        customer: { name: "Juan", phone: "345 412 3456" },
      }),
    );
    expect(result.success).toBe(true);
  });

  it("accepts zone_id as a valid uuid", () => {
    const result = CreateWebOrderSchema.safeParse(
      validPayload({
        fulfillment: {
          type: "delivery",
          address: "Calle Falsa 123, Springfield",
          zone_id: ZONE_ID,
        },
        customer: { name: "Juan", phone: "345 412 3456" },
      }),
    );
    expect(result.success).toBe(true);
  });

  // "No money crosses the wire" guard (app/api/orders/route.ts step 6):
  // zone_id is an id, not money -- confirm delivery_fee/total_amount are
  // still rejected even on an otherwise-valid delivery payload.
  it("still rejects a client-posted delivery_fee/total_amount on a delivery payload with a valid zone_id", () => {
    const result = CreateWebOrderSchema.safeParse(
      validPayload({
        fulfillment: {
          type: "delivery",
          address: "Calle Falsa 123, Springfield",
          zone_id: ZONE_ID,
        },
        customer: { name: "Juan", phone: "345 412 3456" },
        delivery_fee: 2000,
        total_amount: 1,
      }),
    );
    expect(result.success).toBe(false);
  });
});
