import { describe, expect, it } from "vitest";
import { rehydrateSelection } from "@/lib/order/rehydrate-selection";
import type { CreateWebOrderRequest } from "@/lib/order/cart-request";
import type { Catalog } from "@/lib/catalog/get-catalog";
import type { Burger, Extra } from "@/lib/types";
import type { ComboWithSlots } from "@/lib/types/combo-types";

const BURGER_ID = "11111111-1111-1111-1111-111111111111";
const VEGGIE_BURGER_ID = "11111111-1111-1111-1111-111111111112";
const MEAT_EXTRA_ID = "22222222-2222-2222-2222-222222222222";
const FRIES_EXTRA_ID = "33333333-3333-3333-3333-333333333333";
const CHEDDAR_EXTRA_ID = "44444444-4444-4444-4444-444444444444";
const COMBO_ID = "55555555-5555-5555-5555-555555555555";
const SLOT_ID = "66666666-6666-6666-6666-666666666666";

function makeBurger(overrides: Partial<Burger> = {}): Burger {
  return {
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
    deliveryFeeArs: 2000,
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

describe("rehydrateSelection - standalone burgers", () => {
  it("computes meatPriceAdjustment from (meat_count - burger.default_meat_quantity) * meatExtra.price", () => {
    const catalog = makeCatalog({ burgers: [makeBurger({ default_meat_quantity: 1 })] });
    const req = baseRequest({
      burgers: [
        {
          burger_id: BURGER_ID,
          quantity: 1,
          meat_count: 3,
          fries_quantity: 1,
          is_veggie: false,
          removed_ingredients: [],
          extras: [],
        },
      ],
    });

    const { selectedBurgers } = rehydrateSelection(req, catalog);

    expect(selectedBurgers).toHaveLength(1);
    // meatDiff = 3 - 1 = 2 -> 2 * 800 = 1600
    expect(selectedBurgers[0].meatPriceAdjustment).toBe(1600);
    expect(selectedBurgers[0].meatCount).toBe(3);
    expect(selectedBurgers[0].friesQuantity).toBe(1);
  });

  it("computes a negative meatPriceAdjustment when meat_count is below the default", () => {
    const catalog = makeCatalog({ burgers: [makeBurger({ default_meat_quantity: 2 })] });
    const req = baseRequest({
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
    });

    const { selectedBurgers } = rehydrateSelection(req, catalog);

    // meatDiff = 1 - 2 = -1 -> -1 * 800 = -800
    expect(selectedBurgers[0].meatPriceAdjustment).toBe(-800);
  });

  it("takes is_veggie and removed_ingredients directly from the request", () => {
    const catalog = makeCatalog({ burgers: [makeBurger({ id: VEGGIE_BURGER_ID })] });
    const req = baseRequest({
      burgers: [
        {
          burger_id: VEGGIE_BURGER_ID,
          quantity: 1,
          meat_count: 1,
          fries_quantity: 1,
          is_veggie: true,
          removed_ingredients: ["lechuga"],
          extras: [],
        },
      ],
    });

    const { selectedBurgers } = rehydrateSelection(req, catalog);

    expect(selectedBurgers[0].isVeggie).toBe(true);
    expect(selectedBurgers[0].removedIngredients).toEqual(["lechuga"]);
  });

  it("rehydrates selectedExtras from the catalog's extra rows", () => {
    const catalog = makeCatalog();
    const req = baseRequest({
      burgers: [
        {
          burger_id: BURGER_ID,
          quantity: 1,
          meat_count: 1,
          fries_quantity: 1,
          is_veggie: false,
          removed_ingredients: [],
          extras: [{ extra_id: CHEDDAR_EXTRA_ID, quantity: 2 }],
        },
      ],
    });

    const { selectedBurgers } = rehydrateSelection(req, catalog);

    expect(selectedBurgers[0].selectedExtras).toEqual([
      { extra: makeExtra(), quantity: 2 },
    ]);
  });
});

describe("rehydrateSelection - combo slot burgers", () => {
  function makeCombo(overrides: Partial<ComboWithSlots> = {}): ComboWithSlots {
    return {
      id: COMBO_ID,
      name: "Combo Clásico",
      description: null,
      price: 12000,
      is_available: true,
      created_at: "2024-01-01",
      slots: [
        {
          id: SLOT_ID,
          combo_id: COMBO_ID,
          slot_type: "burger",
          quantity: 2,
          required: true,
          default_meat_quantity: null,
          created_at: "2024-01-01",
          rules: { min_quantity: 1, max_quantity: 2 },
        },
      ],
      ...overrides,
    };
  }

  it("defaults meatCount to slot.default_meat_quantity, ignoring the posted meat_count", () => {
    const catalog = makeCatalog({
      combos: [
        makeCombo({
          slots: [
            {
              id: SLOT_ID,
              combo_id: COMBO_ID,
              slot_type: "burger",
              quantity: 2,
              required: true,
              default_meat_quantity: 2,
              created_at: "2024-01-01",
              rules: { min_quantity: 1, max_quantity: 2 },
            },
          ],
        }),
      ],
    });
    const req = baseRequest({
      combos: [
        {
          combo_id: COMBO_ID,
          quantity: 1,
          slots: [
            {
              slot_id: SLOT_ID,
              burgers: [
                {
                  burger_id: BURGER_ID,
                  quantity: 1,
                  meat_count: 6, // tampered value -- must be ignored
                  fries_quantity: 6, // tampered value -- must be ignored
                  is_veggie: false,
                  removed_ingredients: [],
                  extras: [],
                },
              ],
              extra_ids: [],
            },
          ],
        },
      ],
    });

    const { selectedCombos } = rehydrateSelection(req, catalog);
    const burger = selectedCombos[0].slots[0].burgers[0];

    expect(burger.meatCount).toBe(2);
    expect(burger.meatPriceAdjustment).toBe(0);
  });

  it("falls back to burger.default_meat_quantity ?? 2 when the slot has no default", () => {
    const catalog = makeCatalog({
      burgers: [makeBurger({ default_meat_quantity: 3 })],
      combos: [makeCombo()],
    });
    const req = baseRequest({
      combos: [
        {
          combo_id: COMBO_ID,
          quantity: 1,
          slots: [
            {
              slot_id: SLOT_ID,
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
              extra_ids: [],
            },
          ],
        },
      ],
    });

    const { selectedCombos } = rehydrateSelection(req, catalog);
    expect(selectedCombos[0].slots[0].burgers[0].meatCount).toBe(3);
  });

  it("sets friesQuantity and referenceFriesQuantity to burger.default_fries_quantity ?? 1 when no_fries is not set", () => {
    const catalog = makeCatalog({
      burgers: [makeBurger({ default_fries_quantity: 1 })],
      combos: [makeCombo()],
    });
    const req = baseRequest({
      combos: [
        {
          combo_id: COMBO_ID,
          quantity: 1,
          slots: [
            {
              slot_id: SLOT_ID,
              burgers: [
                {
                  burger_id: BURGER_ID,
                  quantity: 1,
                  meat_count: 1,
                  fries_quantity: 5, // tampered value -- must be ignored
                  is_veggie: false,
                  removed_ingredients: [],
                  extras: [],
                },
              ],
              extra_ids: [],
            },
          ],
        },
      ],
    });

    const { selectedCombos } = rehydrateSelection(req, catalog);
    const burger = selectedCombos[0].slots[0].burgers[0];
    expect(burger.friesQuantity).toBe(1);
    expect(burger.referenceFriesQuantity).toBe(1);
  });

  it("zeroes friesQuantity and referenceFriesQuantity when the slot rule is no_fries", () => {
    const catalog = makeCatalog({
      combos: [
        makeCombo({
          slots: [
            {
              id: SLOT_ID,
              combo_id: COMBO_ID,
              slot_type: "side",
              quantity: 1,
              required: true,
              default_meat_quantity: null,
              created_at: "2024-01-01",
              rules: { min_quantity: 0, max_quantity: 1, no_fries: true },
            },
          ],
        }),
      ],
    });
    const req = baseRequest({
      combos: [
        {
          combo_id: COMBO_ID,
          quantity: 1,
          slots: [
            {
              slot_id: SLOT_ID,
              burgers: [
                {
                  burger_id: BURGER_ID,
                  quantity: 1,
                  meat_count: 1,
                  fries_quantity: 4,
                  is_veggie: false,
                  removed_ingredients: [],
                  extras: [],
                },
              ],
              extra_ids: [],
            },
          ],
        },
      ],
    });

    const { selectedCombos } = rehydrateSelection(req, catalog);
    const burger = selectedCombos[0].slots[0].burgers[0];
    expect(burger.friesQuantity).toBe(0);
    expect(burger.referenceFriesQuantity).toBe(0);
  });
});
