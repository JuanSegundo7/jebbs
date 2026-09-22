import { describe, expect, it } from "vitest";
import { computeOrderTotal } from "@/lib/order/compute-order-total";
import type { CreateWebOrderRequest } from "@/lib/order/cart-request";
import type { Catalog } from "@/lib/catalog/get-catalog";
import type { Burger, Extra } from "@/lib/types";

const BURGER_ID = "11111111-1111-1111-1111-111111111111";
const MEAT_EXTRA_ID = "22222222-2222-2222-2222-222222222222";
const FRIES_EXTRA_ID = "33333333-3333-3333-3333-333333333333";
const CHEDDAR_EXTRA_ID = "44444444-4444-4444-4444-444444444444";

function makeBurger(overrides: Partial<Burger> = {}): Burger {
  return {
    id: BURGER_ID,
    name: "Doble Cheddar",
    description: null,
    base_price: 15000,
    ingredients: [],
    is_available: true,
    image_url: null,
    default_meat_quantity: 1,
    default_fries_quantity: 1,
    created_at: "2024-01-01",
    ...overrides,
  };
}

function makeExtra(overrides: Partial<Extra> = {}): Extra {
  return {
    id: CHEDDAR_EXTRA_ID,
    name: "Cheddar",
    category: "extra",
    price: 300,
    is_available: true,
    created_at: "2024-01-01",
    ...overrides,
  };
}

function makeCatalog(overrides: Partial<Catalog> = {}): Catalog {
  return {
    burgers: [makeBurger()],
    extras: [makeExtra()],
    combos: [],
    meatExtra: { id: MEAT_EXTRA_ID, name: "Medallón", category: "extra", price: 800, is_available: true, created_at: "2024-01-01" },
    friesExtra: { id: FRIES_EXTRA_ID, name: "Papas fritas chicas", category: "fries", price: 500, is_available: true, created_at: "2024-01-01" },
    deliveryZones: [],
    minDeliveryFeeArs: null,
    ...overrides,
  };
}

function legitimateRequest(
  overrides: Record<string, unknown> = {},
): CreateWebOrderRequest {
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
    ...overrides,
  } as CreateWebOrderRequest;
}

describe("computeOrderTotal", () => {
  it("matches the hand-computed price for a legitimate cart", () => {
    const catalog = makeCatalog();
    const req = legitimateRequest();

    // base_price 15000, no meat/fries/extra adjustments, pickup fee 0
    expect(computeOrderTotal(req, catalog, 0)).toBe(15000);
  });

  it("ignores a client-posted total_amount and recomputes the real total", () => {
    const catalog = makeCatalog();
    // Simulates a request object that somehow carries an extra, out-of-contract
    // field (the zod schema already rejects this at parse time via .strict(),
    // but this test asserts the pricing logic itself never reads it either).
    const tamperedReq = {
      ...legitimateRequest(),
      total_amount: 1,
    } as CreateWebOrderRequest & { total_amount: number };

    expect(computeOrderTotal(tamperedReq, catalog, 0)).toBe(15000);
    expect(computeOrderTotal(tamperedReq, catalog, 0)).not.toBe(1);
  });

  it("adds the server-stamped delivery fee only for delivery orders", () => {
    const catalog = makeCatalog();
    const req = legitimateRequest({
      fulfillment: { type: "delivery", address: "Calle Falsa 123, Springfield" },
      customer: { name: "Juan", phone: "3454123456" },
    });

    expect(computeOrderTotal(req, catalog, 2000)).toBe(15000 + 2000);
  });
});
