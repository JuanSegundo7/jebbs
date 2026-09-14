import { describe, expect, it } from "vitest";
import { CreateWebOrderSchema } from "@/lib/order/cart-request";

const BURGER_ID = "11111111-1111-1111-1111-111111111111";

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
        },
        customer: { name: "Juan", phone: "345 412 3456" },
      }),
    );
    expect(result.success).toBe(true);
  });
});
