import { describe, expect, it } from "vitest";
import {
  summarizeBurger,
  summarizeCombo,
  summarizeSide,
} from "@/lib/order/customization-summary";
import type { Burger, Extra } from "@/lib/types";
import type { SelectedBurger, SelectedCombo, SelectedComboSlot } from "@/lib/types/combo-types";
import type { SelectedSide } from "@/hooks/use-side-selection";

function makeBurger(overrides: Partial<Burger> = {}): Burger {
  return {
    id: "burger-1",
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
    id: "extra-1",
    name: "Cheddar",
    category: "extra",
    price: 300,
    is_available: true,
    created_at: "2024-01-01",
    ...overrides,
  };
}

function makeSelectedBurger(overrides: Partial<SelectedBurger> = {}): SelectedBurger {
  return {
    id: "sb-1",
    burger: makeBurger(),
    quantity: 1,
    meatCount: 1,
    friesQuantity: 1,
    removedIngredients: [],
    selectedExtras: [],
    meatPriceAdjustment: 0,
    ...overrides,
  };
}

function makeSide(overrides: Partial<SelectedSide> = {}): SelectedSide {
  return {
    id: "side-1",
    extra: makeExtra({ category: "sides", name: "Papas fritas chicas" }),
    quantity: 1,
    selectedExtras: [],
    expanded: false,
    ...overrides,
  };
}

function makeComboSlot(overrides: Partial<SelectedComboSlot> = {}): SelectedComboSlot {
  return {
    slotId: "slot-1",
    slotType: "burger",
    maxQuantity: 1,
    minQuantity: 1,
    rules: { min_quantity: 1, max_quantity: 1 },
    burgers: [],
    selectedExtras: [],
    ...overrides,
  };
}

function makeSelectedCombo(overrides: Partial<SelectedCombo> = {}): SelectedCombo {
  return {
    id: "combo-1",
    combo: {
      id: "c1",
      name: "Combo Doble",
      description: null,
      price: 12000,
      is_available: true,
      created_at: "2024-01-01",
      slots: [],
    },
    quantity: 1,
    slots: [],
    ...overrides,
  };
}

describe("summarizeBurger", () => {
  it("returns null for an unmodified standalone burger", () => {
    expect(summarizeBurger(makeSelectedBurger())).toBeNull();
  });

  it("reports meat above the default", () => {
    expect(summarizeBurger(makeSelectedBurger({ meatCount: 2 }))).toBe("2 carnes");
  });

  it("reports meat below the default with singular wording", () => {
    const burger = makeSelectedBurger({
      burger: makeBurger({ default_meat_quantity: 2 }),
      meatCount: 1,
    });
    expect(summarizeBurger(burger)).toBe("1 carne");
  });

  it("reports zero fries as 'sin papas'", () => {
    expect(summarizeBurger(makeSelectedBurger({ friesQuantity: 0 }))).toBe("sin papas");
  });

  it("reports fries above the default by count", () => {
    expect(summarizeBurger(makeSelectedBurger({ friesQuantity: 2 }))).toBe("2 papas");
  });

  it("reports veggie", () => {
    expect(summarizeBurger(makeSelectedBurger({ isVeggie: true }))).toBe("veggie");
  });

  it("reports one extra", () => {
    const burger = makeSelectedBurger({
      selectedExtras: [{ extra: makeExtra({ name: "Bacon" }), quantity: 1 }],
    });
    expect(summarizeBurger(burger)).toBe("+ Bacon");
  });

  it("joins multiple changes with ' · ' in a fixed order", () => {
    const burger = makeSelectedBurger({
      meatCount: 2,
      friesQuantity: 0,
      isVeggie: true,
      selectedExtras: [
        { extra: makeExtra({ name: "Bacon" }), quantity: 1 },
        { extra: makeExtra({ name: "Cheddar" }), quantity: 1 },
      ],
    });
    expect(summarizeBurger(burger)).toBe("2 carnes · sin papas · veggie · + Bacon · + Cheddar");
  });
});

describe("summarizeCombo", () => {
  it("returns 'Sin configurar' when every slot is empty", () => {
    const combo = makeSelectedCombo({ slots: [makeComboSlot(), makeComboSlot({ slotId: "s2", slotType: "drink" })] });
    expect(summarizeCombo(combo)).toBe("Sin configurar");
  });

  it("names an unmodified burger in a burger slot with no extra detail", () => {
    const combo = makeSelectedCombo({
      slots: [
        makeComboSlot({
          burgers: [makeSelectedBurger({ burger: makeBurger({ name: "Doble Cheddar" }) })],
        }),
      ],
    });
    expect(summarizeCombo(combo)).toBe("Doble Cheddar");
  });

  it("prefixes quantity when more than one of the same burger is in a slot", () => {
    const combo = makeSelectedCombo({
      slots: [
        makeComboSlot({
          burgers: [
            makeSelectedBurger({ quantity: 2, burger: makeBurger({ name: "Clásica" }) }),
          ],
        }),
      ],
    });
    expect(summarizeCombo(combo)).toBe("2x Clásica");
  });

  it("does not report 'sin papas' for a burger in a no_fries slot at its reference fries", () => {
    const combo = makeSelectedCombo({
      slots: [
        makeComboSlot({
          rules: { min_quantity: 1, max_quantity: 1, no_fries: true },
          burgers: [
            makeSelectedBurger({
              friesQuantity: 0,
              referenceFriesQuantity: 0,
              burger: makeBurger({ name: "Clásica" }),
            }),
          ],
        }),
      ],
    });
    expect(summarizeCombo(combo)).toBe("Clásica");
  });

  it("does not report 'veggie' for a burger auto-named Veggie with no real change", () => {
    const combo = makeSelectedCombo({
      slots: [
        makeComboSlot({
          burgers: [
            makeSelectedBurger({
              isVeggie: true,
              burger: makeBurger({ name: "Veggie Deluxe" }),
            }),
          ],
        }),
      ],
    });
    expect(summarizeCombo(combo)).toBe("Veggie Deluxe");
  });

  it("uses the slot's own default meat count, not the catalog default", () => {
    const combo = makeSelectedCombo({
      slots: [
        makeComboSlot({
          defaultMeatCount: 2,
          burgers: [
            makeSelectedBurger({
              meatCount: 2,
              burger: makeBurger({ name: "Clásica", default_meat_quantity: 1 }),
            }),
          ],
        }),
      ],
    });
    // meatCount (2) matches the slot's default (2), not the catalog's (1) --
    // must NOT report "2 carnes" as a change.
    expect(summarizeCombo(combo)).toBe("Clásica");
  });

  it("lists drink/side slot extra names directly", () => {
    const combo = makeSelectedCombo({
      slots: [
        makeComboSlot({
          slotType: "drink",
          selectedExtras: [makeExtra({ name: "Coca-Cola" })],
        }),
      ],
    });
    expect(summarizeCombo(combo)).toBe("Coca-Cola");
  });

  it("combines a burger slot and a drink slot", () => {
    const combo = makeSelectedCombo({
      slots: [
        makeComboSlot({ burgers: [makeSelectedBurger({ burger: makeBurger({ name: "Clásica" }) })] }),
        makeComboSlot({ slotId: "s2", slotType: "drink", selectedExtras: [makeExtra({ name: "Sprite" })] }),
      ],
    });
    expect(summarizeCombo(combo)).toBe("Clásica · Sprite");
  });
});

describe("summarizeSide", () => {
  it("returns null when there are no extras", () => {
    expect(summarizeSide(makeSide())).toBeNull();
  });

  it("lists extras when present (e.g. rehydrated from a saved cart)", () => {
    const side = makeSide({
      selectedExtras: [{ extra: makeExtra({ name: "Cheddar" }), quantity: 1 }],
    });
    expect(summarizeSide(side)).toBe("+ Cheddar");
  });
});
