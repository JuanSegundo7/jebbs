import { describe, expect, it } from "vitest";
import { findUnavailableItemIds } from "@/lib/order/assert-catalog-availability";
import type { CreateWebOrderRequest } from "@/lib/order/cart-request";
import type { Catalog } from "@/lib/catalog/get-catalog";
import type { Burger, Extra } from "@/lib/types";
import type { ComboWithSlots } from "@/lib/types/combo-types";

const AVAILABLE_BURGER_ID = "11111111-1111-1111-1111-111111111111";
const UNAVAILABLE_BURGER_ID = "11111111-1111-1111-1111-111111111112";
const MEAT_EXTRA_ID = "22222222-2222-2222-2222-222222222222";
const FRIES_EXTRA_ID = "33333333-3333-3333-3333-333333333333";
const AVAILABLE_EXTRA_ID = "44444444-4444-4444-4444-444444444444";
const COMBO_ID = "55555555-5555-5555-5555-555555555555";
const SLOT_ID = "66666666-6666-6666-6666-666666666666";

function makeBurger(overrides: Partial<Burger> = {}): Burger {
  return {
    id: AVAILABLE_BURGER_ID,
    name: "Clásica",
    description: null,
    base_price: 5000,
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
    id: AVAILABLE_EXTRA_ID,
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

function baseRequest(overrides: Partial<CreateWebOrderRequest> = {}): CreateWebOrderRequest {
  return {
    burgers: [],
    combos: [],
    sides: [],
    fulfillment: { type: "pickup" },
    customer: { name: "Juan" },
    payment_method: "cash",
    ...overrides,
  } as CreateWebOrderRequest;
}

describe("findUnavailableItemIds", () => {
  it("returns an empty list for a fully-available cart", () => {
    const catalog = makeCatalog();
    const req = baseRequest({
      burgers: [
        {
          burger_id: AVAILABLE_BURGER_ID,
          quantity: 1,
          meat_count: 1,
          fries_quantity: 1,
          is_veggie: false,
          removed_ingredients: [],
          extras: [{ extra_id: AVAILABLE_EXTRA_ID, quantity: 1 }],
        },
      ],
    });

    expect(findUnavailableItemIds(req, catalog)).toEqual([]);
  });

  it("flags a burger_id that is not in the catalog's is_available=true list", () => {
    // getCatalog() only ever returns is_available=true rows, so an id that
    // is either missing or was filtered out for being unavailable looks
    // identical here -- both must be rejected.
    const catalog = makeCatalog({ burgers: [makeBurger({ id: AVAILABLE_BURGER_ID })] });
    const req = baseRequest({
      burgers: [
        {
          burger_id: UNAVAILABLE_BURGER_ID,
          quantity: 1,
          meat_count: 1,
          fries_quantity: 1,
          is_veggie: false,
          removed_ingredients: [],
          extras: [],
        },
      ],
    });

    expect(findUnavailableItemIds(req, catalog)).toEqual([UNAVAILABLE_BURGER_ID]);
  });

  it("flags an unavailable extra_id referenced by a standalone burger", () => {
    const catalog = makeCatalog({ extras: [] });
    const req = baseRequest({
      burgers: [
        {
          burger_id: AVAILABLE_BURGER_ID,
          quantity: 1,
          meat_count: 1,
          fries_quantity: 1,
          is_veggie: false,
          removed_ingredients: [],
          extras: [{ extra_id: AVAILABLE_EXTRA_ID, quantity: 1 }],
        },
      ],
    });

    expect(findUnavailableItemIds(req, catalog)).toEqual([AVAILABLE_EXTRA_ID]);
  });

  it("flags a missing combo_id and a missing slot_id", () => {
    const catalog = makeCatalog({ combos: [] });
    const req = baseRequest({
      combos: [
        {
          combo_id: COMBO_ID,
          quantity: 1,
          slots: [{ slot_id: SLOT_ID, burgers: [], extra_ids: [] }],
        },
      ],
    });

    expect(findUnavailableItemIds(req, catalog)).toEqual([COMBO_ID]);
  });

  it("flags a slot_id that does not belong to the resolved combo", () => {
    const combo: ComboWithSlots = {
      id: COMBO_ID,
      name: "Combo Clásico",
      description: null,
      price: 12000,
      is_available: true,
      created_at: "2024-01-01",
      slots: [
        {
          id: "77777777-7777-7777-7777-777777777777",
          combo_id: COMBO_ID,
          slot_type: "burger",
          quantity: 1,
          required: true,
          default_meat_quantity: null,
          created_at: "2024-01-01",
          rules: { min_quantity: 1, max_quantity: 1 },
        },
      ],
    };
    const catalog = makeCatalog({ combos: [combo] });
    const req = baseRequest({
      combos: [
        {
          combo_id: COMBO_ID,
          quantity: 1,
          slots: [{ slot_id: SLOT_ID, burgers: [], extra_ids: [] }],
        },
      ],
    });

    expect(findUnavailableItemIds(req, catalog)).toEqual([SLOT_ID]);
  });

  it("flags an unavailable extra_id posted as a side", () => {
    const catalog = makeCatalog({ extras: [] });
    const req = baseRequest({
      sides: [{ extra_id: AVAILABLE_EXTRA_ID, quantity: 1, extras: [] }],
    });

    expect(findUnavailableItemIds(req, catalog)).toEqual([AVAILABLE_EXTRA_ID]);
  });
});
