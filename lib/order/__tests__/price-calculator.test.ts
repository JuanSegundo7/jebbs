import { describe, expect, it } from "vitest";
import { OrderPriceCalculator } from "@/lib/order/price-calculator";
import type { Burger, Extra } from "@/lib/types";
import type { SelectedBurger } from "@/lib/types/combo-types";
import type { SelectedSide } from "@/hooks/use-side-selection";

const MEAT_EXTRA = { price: 800 };
const FRIES_EXTRA = { price: 500 };

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

function makeSelectedBurger(
  overrides: Partial<SelectedBurger> = {},
): SelectedBurger {
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

describe("OrderPriceCalculator.calculateBurgersTotal", () => {
  it("prices a standalone burger with no adjustments", () => {
    const burgers = [makeSelectedBurger()];
    expect(OrderPriceCalculator.calculateBurgersTotal(burgers, FRIES_EXTRA)).toBe(
      5000,
    );
  });

  it("adds meatPriceAdjustment and quantity multiplier", () => {
    const burgers = [
      makeSelectedBurger({ quantity: 2, meatPriceAdjustment: 800 }),
    ];
    // (5000 + 800) * 2 = 11600
    expect(OrderPriceCalculator.calculateBurgersTotal(burgers, FRIES_EXTRA)).toBe(
      11600,
    );
  });

  it("charges for fries above the burger's default and refunds for fewer", () => {
    const extra = makeExtra();
    const overFries = makeSelectedBurger({ friesQuantity: 2, selectedExtras: [] });
    const underFries = makeSelectedBurger({ friesQuantity: 0, selectedExtras: [] });

    // default_fries_quantity: 1 -> diff +1 * 500 = +500
    expect(
      OrderPriceCalculator.calculateBurgersTotal([overFries], FRIES_EXTRA),
    ).toBe(5000 + 500);

    // diff -1 * 500 = -500
    expect(
      OrderPriceCalculator.calculateBurgersTotal([underFries], FRIES_EXTRA),
    ).toBe(5000 - 500);

    void extra;
  });

  it("skips fries pricing entirely when friesExtra is missing", () => {
    const burger = makeSelectedBurger({ friesQuantity: 5 });
    expect(OrderPriceCalculator.calculateBurgersTotal([burger], null)).toBe(5000);
  });

  it("sums selectedExtras priced per unit and multiplied by burger quantity", () => {
    const burger = makeSelectedBurger({
      quantity: 3,
      selectedExtras: [{ extra: makeExtra({ price: 300 }), quantity: 2 }],
    });
    // burgerTotal = 5000*3 = 15000; extrasTotal = 300*2 = 600 (per calculator,
    // extrasTotal is NOT multiplied by burger.quantity for standalone burgers)
    expect(OrderPriceCalculator.calculateBurgersTotal([burger], null)).toBe(
      15000 + 600,
    );
  });
});

describe("OrderPriceCalculator.calculateCombosTotal -- combo slot meat/fries adjustments (R17)", () => {
  function makeSlotBurger(
    overrides: Partial<SelectedBurger> = {},
  ): SelectedBurger {
    return makeSelectedBurger(overrides);
  }

  function makeCombo(slots: any[], quantity = 1) {
    return {
      id: "combo-instance-1",
      combo: { id: "combo-1", name: "Combo Clásico", price: 12000 },
      quantity,
      slots,
    };
  }

  it("charges only the combo base price when a slot burger matches the slot's default meat/fries", () => {
    const slot = {
      slotId: "slot-1",
      slotType: "burger" as const,
      maxQuantity: 1,
      defaultMeatCount: 2,
      burgers: [
        makeSlotBurger({
          meatCount: 2,
          friesQuantity: 1,
          referenceFriesQuantity: 1,
        }),
      ],
    };
    const combos = [makeCombo([slot])];

    expect(
      OrderPriceCalculator.calculateCombosTotal(combos, MEAT_EXTRA, FRIES_EXTRA),
    ).toBe(12000);
  });

  it("adds a positive meat adjustment when the slot burger's meatCount exceeds the slot default", () => {
    const slot = {
      slotId: "slot-1",
      slotType: "burger" as const,
      maxQuantity: 1,
      defaultMeatCount: 1,
      burgers: [
        makeSlotBurger({ meatCount: 3, friesQuantity: 1, referenceFriesQuantity: 1 }),
      ],
    };
    const combos = [makeCombo([slot])];

    // meatDiff = 3 - 1 = 2 -> 2 * 800 = 1600
    expect(
      OrderPriceCalculator.calculateCombosTotal(combos, MEAT_EXTRA, FRIES_EXTRA),
    ).toBe(12000 + 1600);
  });

  it("applies a negative meat adjustment when the slot burger's meatCount is below the slot default", () => {
    const slot = {
      slotId: "slot-1",
      slotType: "burger" as const,
      maxQuantity: 1,
      defaultMeatCount: 3,
      burgers: [
        makeSlotBurger({ meatCount: 1, friesQuantity: 1, referenceFriesQuantity: 1 }),
      ],
    };
    const combos = [makeCombo([slot])];

    // meatDiff = 1 - 3 = -2 -> -2 * 800 = -1600
    expect(
      OrderPriceCalculator.calculateCombosTotal(combos, MEAT_EXTRA, FRIES_EXTRA),
    ).toBe(12000 - 1600);
  });

  it("falls back to the burger's own default_meat_quantity when the slot has no defaultMeatCount", () => {
    const slot = {
      slotId: "slot-1",
      slotType: "burger" as const,
      maxQuantity: 1,
      defaultMeatCount: undefined,
      burgers: [
        makeSlotBurger({
          burger: makeBurger({ default_meat_quantity: 2 }),
          meatCount: 4,
          friesQuantity: 1,
          referenceFriesQuantity: 1,
        }),
      ],
    };
    const combos = [makeCombo([slot])];

    // no slot.defaultMeatCount, no burger.default_meat_quantity ?? 2 -> reference = 2
    // meatDiff = 4 - 2 = 2 -> 1600
    expect(
      OrderPriceCalculator.calculateCombosTotal(combos, MEAT_EXTRA, FRIES_EXTRA),
    ).toBe(12000 + 1600);
  });

  it("prices fries against referenceFriesQuantity, not the live friesQuantity default (no-fries combo slots)", () => {
    // rules.no_fries slots seed friesQuantity AND referenceFriesQuantity to 0
    // (use-combo-selection.ts:103-108) -- bumping friesQuantity later must be
    // priced against that 0 reference, not burger.default_fries_quantity.
    const slot = {
      slotId: "slot-1",
      slotType: "burger" as const,
      maxQuantity: 1,
      defaultMeatCount: 2,
      burgers: [
        makeSlotBurger({
          meatCount: 2,
          friesQuantity: 1,
          referenceFriesQuantity: 0,
          burger: makeBurger({ default_fries_quantity: 1 }),
        }),
      ],
    };
    const combos = [makeCombo([slot])];

    // friesDiff = 1 - 0 (referenceFriesQuantity, not the burger's default 1) = 1 -> +500
    expect(
      OrderPriceCalculator.calculateCombosTotal(combos, MEAT_EXTRA, FRIES_EXTRA),
    ).toBe(12000 + 500);
  });

  it("zeroes meat and fries adjustments entirely when meatExtra/friesExtra are missing", () => {
    const slot = {
      slotId: "slot-1",
      slotType: "burger" as const,
      maxQuantity: 1,
      defaultMeatCount: 1,
      burgers: [
        makeSlotBurger({ meatCount: 5, friesQuantity: 5, referenceFriesQuantity: 0 }),
      ],
    };
    const combos = [makeCombo([slot])];

    expect(OrderPriceCalculator.calculateCombosTotal(combos, null, null)).toBe(
      12000,
    );
  });

  it("charges combo-slot burger extras per unit, multiplied by that burger's own quantity", () => {
    const slot = {
      slotId: "slot-1",
      slotType: "burger" as const,
      maxQuantity: 2,
      defaultMeatCount: 1,
      burgers: [
        makeSlotBurger({
          quantity: 2,
          meatCount: 1,
          friesQuantity: 1,
          referenceFriesQuantity: 1,
          selectedExtras: [{ extra: makeExtra({ price: 400 }), quantity: 1 }],
        }),
      ],
    };
    const combos = [makeCombo([slot])];

    // (400 extras + 0 meat + 0 fries) * quantity 2 = 800
    expect(
      OrderPriceCalculator.calculateCombosTotal(combos, MEAT_EXTRA, FRIES_EXTRA),
    ).toBe(12000 + 800);
  });

  it("does not charge extra for drink/side slots -- only slot burger adjustments count", () => {
    const burgerSlot = {
      slotId: "slot-1",
      slotType: "burger" as const,
      maxQuantity: 1,
      defaultMeatCount: 1,
      burgers: [makeSlotBurger({ meatCount: 1, friesQuantity: 1, referenceFriesQuantity: 1 })],
    };
    const drinkSlot = {
      slotId: "slot-2",
      slotType: "drink" as const,
      maxQuantity: 1,
      burgers: [],
      selectedExtras: [{ id: "coke", name: "Coca", price: 1500 }],
    };
    const combos = [makeCombo([burgerSlot, drinkSlot])];

    // drink slot's own selectedExtras are NOT priced by calculateCombosTotal
    // (design.md's own comment: "Drink/side slots are included in the combo
    // price -- no extra charge"). Only per-burger adjustments inside a slot count.
    expect(
      OrderPriceCalculator.calculateCombosTotal(combos, MEAT_EXTRA, FRIES_EXTRA),
    ).toBe(12000);
  });

  it("multiplies the combo base price by the combo instance quantity", () => {
    const combos = [makeCombo([], 3)];
    expect(OrderPriceCalculator.calculateCombosTotal(combos)).toBe(36000);
  });
});

describe("OrderPriceCalculator.calculateDiscountAmount", () => {
  it("returns 0 for discountType 'none'", () => {
    expect(
      OrderPriceCalculator.calculateDiscountAmount(10000, "none", 5000),
    ).toBe(0);
  });

  it("returns 0 when discountValue is 0 or negative", () => {
    expect(OrderPriceCalculator.calculateDiscountAmount(10000, "amount", 0)).toBe(
      0,
    );
    expect(
      OrderPriceCalculator.calculateDiscountAmount(10000, "amount", -100),
    ).toBe(0);
  });

  it("caps a fixed-amount discount at the subtotal", () => {
    expect(
      OrderPriceCalculator.calculateDiscountAmount(1000, "amount", 5000),
    ).toBe(1000);
  });

  it("caps a percentage discount at 100%", () => {
    expect(
      OrderPriceCalculator.calculateDiscountAmount(10000, "percentage", 150),
    ).toBe(10000);
  });

  it("applies a percentage discount correctly under the cap", () => {
    expect(
      OrderPriceCalculator.calculateDiscountAmount(10000, "percentage", 10),
    ).toBe(1000);
  });
});

describe("OrderPriceCalculator.calculateOrderTotal", () => {
  const emptySides: SelectedSide[] = [];

  it("adds the delivery fee only when deliveryType is 'delivery'", () => {
    const burgers = [makeSelectedBurger()];

    const pickupTotal = OrderPriceCalculator.calculateOrderTotal({
      selectedBurgers: burgers,
      selectedCombos: [],
      selectedSides: emptySides,
      deliveryType: "pickup",
      deliveryFee: 2000,
    });
    expect(pickupTotal).toBe(5000);

    const deliveryTotal = OrderPriceCalculator.calculateOrderTotal({
      selectedBurgers: burgers,
      selectedCombos: [],
      selectedSides: emptySides,
      deliveryType: "delivery",
      deliveryFee: 2000,
    });
    expect(deliveryTotal).toBe(7000);
  });

  it("subtracts the discount and adds the manual price adjustment", () => {
    const burgers = [makeSelectedBurger()];

    const total = OrderPriceCalculator.calculateOrderTotal({
      selectedBurgers: burgers,
      selectedCombos: [],
      selectedSides: emptySides,
      deliveryType: "pickup",
      deliveryFee: 0,
      discountType: "amount",
      discountValue: 500,
      priceAdjustment: 100,
    });

    // 5000 - 500 + 0 + 100 = 4600
    expect(total).toBe(4600);
  });

  it("treats non-array selection inputs as empty instead of throwing", () => {
    const total = OrderPriceCalculator.calculateOrderTotal({
      selectedBurgers: undefined as unknown as SelectedBurger[],
      selectedCombos: null as unknown as any[],
      selectedSides: undefined as unknown as SelectedSide[],
      deliveryType: "pickup",
      deliveryFee: 0,
    });
    expect(total).toBe(0);
  });

  it("returns 0 instead of NaN/Infinity when the computed total is not finite", () => {
    const total = OrderPriceCalculator.calculateOrderTotal({
      selectedBurgers: [],
      selectedCombos: [],
      selectedSides: emptySides,
      deliveryType: "pickup",
      deliveryFee: Number.POSITIVE_INFINITY,
    });
    expect(total).toBe(0);
  });
});

describe("OrderPriceCalculator.calculateSubtotal -- sides", () => {
  it("prices a side's base price plus its own selectedExtras", () => {
    const side: SelectedSide = {
      id: "side-1",
      extra: makeExtra({ price: 2000 }),
      quantity: 2,
      selectedExtras: [{ extra: makeExtra({ price: 300 }), quantity: 3 }],
      expanded: false,
    };

    // burgersTotal 0 + combosTotal 0 + sidesTotal (2000*2 + 300*3)
    const subtotal = OrderPriceCalculator.calculateSubtotal([], [], [side]);
    expect(subtotal).toBe(4000 + 900);
  });
});
