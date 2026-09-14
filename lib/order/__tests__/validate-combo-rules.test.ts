import { describe, expect, it } from "vitest";
import { validateComboRules } from "@/lib/order/validate-combo-rules";
import type { CreateWebOrderRequest } from "@/lib/order/cart-request";
import type { Catalog } from "@/lib/catalog/get-catalog";
import type { Burger, Extra } from "@/lib/types";
import type { ComboWithSlots } from "@/lib/types/combo-types";

const BURGER_ID = "11111111-1111-1111-1111-111111111111";
const BURGER_2_ID = "11111111-1111-1111-1111-111111111112";
const MEAT_EXTRA_ID = "22222222-2222-2222-2222-222222222222";
const FRIES_EXTRA_ID = "33333333-3333-3333-3333-333333333333";
const DRINK_EXTRA_ID = "44444444-4444-4444-4444-444444444444";
const EXTRA_CATEGORY_ID = "44444444-4444-4444-4444-444444444445";
const COMBO_ID = "55555555-5555-5555-5555-555555555555";
const BURGER_SLOT_ID = "66666666-6666-6666-6666-666666666666";
const DRINK_SLOT_ID = "77777777-7777-7777-7777-777777777777";

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

function makeDrinkExtra(overrides: Partial<Extra> = {}): Extra {
  return {
    id: DRINK_EXTRA_ID,
    name: "Coca-Cola",
    category: "drink",
    price: 0,
    is_available: true,
    created_at: "2024-01-01",
    ...overrides,
  };
}

function makeCatalog(overrides: Partial<Catalog> = {}): Catalog {
  return {
    burgers: [makeBurger(), makeBurger({ id: BURGER_2_ID })],
    extras: [makeDrinkExtra()],
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

function burgerLine(burgerId: string, overrides: Record<string, unknown> = {}) {
  return {
    burger_id: burgerId,
    quantity: 1,
    meat_count: 1,
    fries_quantity: 1,
    is_veggie: false,
    removed_ingredients: [],
    extras: [],
    ...overrides,
  };
}

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
        id: BURGER_SLOT_ID,
        combo_id: COMBO_ID,
        slot_type: "burger",
        quantity: 1,
        required: true,
        default_meat_quantity: null,
        created_at: "2024-01-01",
        rules: { min_quantity: 1, max_quantity: 1 },
      },
    ],
    ...overrides,
  };
}

describe("validateComboRules", () => {
  it("passes a valid combo (burger count within slot bounds)", () => {
    const catalog = makeCatalog({ combos: [makeCombo()] });
    const req = baseRequest({
      combos: [
        {
          combo_id: COMBO_ID,
          quantity: 1,
          slots: [
            { slot_id: BURGER_SLOT_ID, burgers: [burgerLine(BURGER_ID)], extra_ids: [] },
          ],
        },
      ],
    });

    expect(validateComboRules(req, catalog)).toEqual({ ok: true });
  });

  it("rejects a slot posted over its max quantity", () => {
    const catalog = makeCatalog({
      combos: [
        makeCombo({
          slots: [
            {
              id: BURGER_SLOT_ID,
              combo_id: COMBO_ID,
              slot_type: "burger",
              quantity: 1,
              required: true,
              default_meat_quantity: null,
              created_at: "2024-01-01",
              rules: { min_quantity: 1, max_quantity: 1 },
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
              slot_id: BURGER_SLOT_ID,
              burgers: [burgerLine(BURGER_ID), burgerLine(BURGER_2_ID)],
              extra_ids: [],
            },
          ],
        },
      ],
    });

    const result = validateComboRules(req, catalog);
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.violations.some((v) => v.includes("exceeds max"))).toBe(true);
    }
  });

  it("rejects a slot posted under its min quantity", () => {
    const catalog = makeCatalog({
      combos: [
        makeCombo({
          slots: [
            {
              id: BURGER_SLOT_ID,
              combo_id: COMBO_ID,
              slot_type: "burger",
              quantity: 2,
              required: true,
              default_meat_quantity: null,
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
          slots: [{ slot_id: BURGER_SLOT_ID, burgers: [], extra_ids: [] }],
        },
      ],
    });

    const result = validateComboRules(req, catalog);
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.violations.some((v) => v.includes("below min"))).toBe(true);
    }
  });

  it("rejects a burger whose default_meat_quantity is not in allowed_meat_count", () => {
    const catalog = makeCatalog({
      burgers: [makeBurger({ default_meat_quantity: 3 })],
      combos: [
        makeCombo({
          slots: [
            {
              id: BURGER_SLOT_ID,
              combo_id: COMBO_ID,
              slot_type: "burger",
              quantity: 1,
              required: true,
              default_meat_quantity: null,
              created_at: "2024-01-01",
              rules: { min_quantity: 1, max_quantity: 1, allowed_meat_count: [1, 2] },
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
          slots: [{ slot_id: BURGER_SLOT_ID, burgers: [burgerLine(BURGER_ID)], extra_ids: [] }],
        },
      ],
    });

    const result = validateComboRules(req, catalog);
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(
        result.violations.some((v) => v.includes("allowed_meat_count")),
      ).toBe(true);
    }
  });

  it("rejects fries posted for a no_fries slot", () => {
    const catalog = makeCatalog({
      combos: [
        makeCombo({
          slots: [
            {
              id: BURGER_SLOT_ID,
              combo_id: COMBO_ID,
              slot_type: "burger",
              quantity: 1,
              required: true,
              default_meat_quantity: null,
              created_at: "2024-01-01",
              rules: { min_quantity: 1, max_quantity: 1, no_fries: true },
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
              slot_id: BURGER_SLOT_ID,
              burgers: [burgerLine(BURGER_ID, { fries_quantity: 2 })],
              extra_ids: [],
            },
          ],
        },
      ],
    });

    const result = validateComboRules(req, catalog);
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.violations.some((v) => v.includes("no_fries"))).toBe(true);
    }
  });

  it("accepts fries_quantity 0 for a no_fries slot", () => {
    const catalog = makeCatalog({
      combos: [
        makeCombo({
          slots: [
            {
              id: BURGER_SLOT_ID,
              combo_id: COMBO_ID,
              slot_type: "burger",
              quantity: 1,
              required: true,
              default_meat_quantity: null,
              created_at: "2024-01-01",
              rules: { min_quantity: 1, max_quantity: 1, no_fries: true },
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
              slot_id: BURGER_SLOT_ID,
              burgers: [burgerLine(BURGER_ID, { fries_quantity: 0 })],
              extra_ids: [],
            },
          ],
        },
      ],
    });

    expect(validateComboRules(req, catalog)).toEqual({ ok: true });
  });

  it("rejects extra_ids over the slot's max quantity", () => {
    const catalog = makeCatalog({
      extras: [makeDrinkExtra(), makeDrinkExtra({ id: EXTRA_CATEGORY_ID })],
      combos: [
        makeCombo({
          slots: [
            {
              id: DRINK_SLOT_ID,
              combo_id: COMBO_ID,
              slot_type: "drink",
              quantity: 1,
              required: true,
              default_meat_quantity: null,
              created_at: "2024-01-01",
              rules: { min_quantity: 1, max_quantity: 1 },
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
              slot_id: DRINK_SLOT_ID,
              burgers: [],
              extra_ids: [DRINK_EXTRA_ID, EXTRA_CATEGORY_ID],
            },
          ],
        },
      ],
    });

    const result = validateComboRules(req, catalog);
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.violations.some((v) => v.includes("extra_ids"))).toBe(true);
    }
  });

  it("rejects an extra whose category does not match the slot type", () => {
    const catalog = makeCatalog({
      extras: [makeDrinkExtra({ id: EXTRA_CATEGORY_ID, category: "extra" })],
      combos: [
        makeCombo({
          slots: [
            {
              id: DRINK_SLOT_ID,
              combo_id: COMBO_ID,
              slot_type: "drink",
              quantity: 1,
              required: true,
              default_meat_quantity: null,
              created_at: "2024-01-01",
              rules: { min_quantity: 1, max_quantity: 1 },
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
            { slot_id: DRINK_SLOT_ID, burgers: [], extra_ids: [EXTRA_CATEGORY_ID] },
          ],
        },
      ],
    });

    const result = validateComboRules(req, catalog);
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.violations.some((v) => v.includes("not allowed for slot type"))).toBe(true);
    }
  });

  it("accepts a drink extra whose category matches the drink slot type", () => {
    const catalog = makeCatalog({
      combos: [
        makeCombo({
          slots: [
            {
              id: DRINK_SLOT_ID,
              combo_id: COMBO_ID,
              slot_type: "drink",
              quantity: 1,
              required: true,
              default_meat_quantity: null,
              created_at: "2024-01-01",
              rules: { min_quantity: 1, max_quantity: 1 },
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
            { slot_id: DRINK_SLOT_ID, burgers: [], extra_ids: [DRINK_EXTRA_ID] },
          ],
        },
      ],
    });

    expect(validateComboRules(req, catalog)).toEqual({ ok: true });
  });
});
