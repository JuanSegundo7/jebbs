import { describe, expect, it } from "vitest";
import {
  isMeatCountCustomized,
  meatCountLabel,
  summarizeBurger,
  summarizeComboBurger,
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

  it("reports an extra's quantity when greater than 1", () => {
    const burger = makeSelectedBurger({
      selectedExtras: [{ extra: makeExtra({ name: "Bacon" }), quantity: 3 }],
    });
    expect(summarizeBurger(burger)).toBe("+ 3x Bacon");
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

  // cart-drawer.tsx promotes the meat-count word into the item's NAME
  // instead of leaving it in the summary line -- includeMeatCount: false is
  // how it asks for the summary without that one part, so it isn't shown
  // twice on the same row.
  it("omits the meat-count part when includeMeatCount is false", () => {
    const burger = makeSelectedBurger({ meatCount: 2, isVeggie: true });
    expect(summarizeBurger(burger, { includeMeatCount: false })).toBe("veggie");
  });

  it("still omits meat count when it's the only change and includeMeatCount is false", () => {
    expect(summarizeBurger(makeSelectedBurger({ meatCount: 2 }), { includeMeatCount: false })).toBeNull();
  });
});

describe("meatCountLabel", () => {
  it("names each tier on the menu's own ladder", () => {
    expect(meatCountLabel(1)).toBe("Simple");
    expect(meatCountLabel(2)).toBe("Doble");
    expect(meatCountLabel(3)).toBe("Triple");
    expect(meatCountLabel(4)).toBe("Cuádruple");
    expect(meatCountLabel(5)).toBe("Quíntuple");
    expect(meatCountLabel(6)).toBe("Séxtuple");
  });

  it("falls back to 'N carnes' past the named ladder", () => {
    expect(meatCountLabel(7)).toBe("7 carnes");
  });
});

describe("isMeatCountCustomized", () => {
  it("is false when meatCount matches the burger's own default", () => {
    expect(isMeatCountCustomized(makeSelectedBurger({ meatCount: 1 }))).toBe(false);
  });

  it("is true once meatCount differs from the burger's own default", () => {
    expect(isMeatCountCustomized(makeSelectedBurger({ meatCount: 5 }))).toBe(true);
  });

  it("falls back to a default of 2 when the burger has no default_meat_quantity set", () => {
    const burger = makeSelectedBurger({
      burger: makeBurger({ default_meat_quantity: null as unknown as number }),
      meatCount: 2,
    });
    expect(isMeatCountCustomized(burger)).toBe(false);
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

describe("summarizeComboBurger / combo veggie", () => {
  it("returns null for an untouched combo burger, whatever the catalog defaults", () => {
    const item = makeSelectedBurger({
      meatCount: 2,
      friesQuantity: 0,
      referenceFriesQuantity: 0,
      burger: makeBurger({ default_meat_quantity: 1, default_fries_quantity: 1 }),
    });
    expect(summarizeComboBurger(item, 2)).toBeNull();
  });

  it("reports a burger switched to veggie", () => {
    const item = makeSelectedBurger({ isVeggie: true, burger: makeBurger({ name: "Clásica" }) });
    expect(summarizeComboBurger(item, 1)).toBe("veggie");
  });

  it("reports extras in a combo burger", () => {
    const item = makeSelectedBurger({
      selectedExtras: [{ extra: makeExtra({ name: "Bacon" }), quantity: 2 }],
    });
    expect(summarizeComboBurger(item, 1)).toBe("+ 2x Bacon");
  });

  it("summarizeCombo shows veggie for a non-veggie burger switched to veggie", () => {
    const combo = makeSelectedCombo({
      slots: [
        makeComboSlot({
          burgers: [makeSelectedBurger({ isVeggie: true, burger: makeBurger({ name: "Clásica" }) })],
        }),
      ],
    });
    expect(summarizeCombo(combo)).toBe("Clásica (veggie)");
  });
});
