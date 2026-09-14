import { describe, expect, it } from "vitest";
import { OrderDataTransformer } from "@/lib/order/data-transformer";
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

describe("OrderDataTransformer.transformBurgersToOrderItems", () => {
  it("maps a standalone burger to an OrderItemInput with unit_price = base + meat adjustment", () => {
    const burger = makeSelectedBurger({ meatPriceAdjustment: 800, quantity: 2 });
    const [item] = OrderDataTransformer.transformBurgersToOrderItems(
      [burger],
      FRIES_EXTRA,
    );

    expect(item.burger_id).toBe("burger-1");
    expect(item.combo_id).toBeNull();
    expect(item.unit_price).toBe(5800);
    // subtotal = unitPrice * quantity + friesAdjustment (friesDiff=0 here)
    expect(item.subtotal).toBe(11600);
  });

  it("includes friesAdjustment in the subtotal, scaled by burger quantity", () => {
    const burger = makeSelectedBurger({ friesQuantity: 3, quantity: 2 });
    const [item] = OrderDataTransformer.transformBurgersToOrderItems(
      [burger],
      FRIES_EXTRA,
    );

    // friesDiff = 3 - 1(default) = 2; friesAdjustment = 2 * 500 * 2(qty) = 2000
    // subtotal = 5000 * 2 + 2000 = 12000
    expect(item.subtotal).toBe(12000);
  });

  it("serializes customizations as a JSON string carrying meat/fries/veggie/extras state", () => {
    const extra = makeExtra({ id: "e1", name: "Cheddar", price: 300 });
    const burger = makeSelectedBurger({
      meatCount: 2,
      isVeggie: true,
      removedIngredients: ["lechuga"],
      selectedExtras: [{ extra, quantity: 1 }],
    });
    const [item] = OrderDataTransformer.transformBurgersToOrderItems(
      [burger],
      FRIES_EXTRA,
    );

    const parsed = JSON.parse(item.customizations as string);
    expect(parsed.meatCount).toBe(2);
    expect(parsed.isVeggie).toBe(true);
    expect(parsed.removedIngredients).toEqual(["lechuga"]);
    expect(parsed.extras).toEqual([
      { id: "e1", name: "Cheddar", quantity: 1, price: 300 },
    ]);
  });

  it("maps selectedExtras to the extras[] wire shape with their own subtotal", () => {
    const extra = makeExtra({ id: "e1", name: "Cheddar", price: 300 });
    const burger = makeSelectedBurger({
      selectedExtras: [{ extra, quantity: 2 }],
    });
    const [item] = OrderDataTransformer.transformBurgersToOrderItems(
      [burger],
      null,
    );

    expect(item.extras).toEqual([
      {
        extra_id: "e1",
        extra_name: "Cheddar",
        quantity: 2,
        unit_price: 300,
        subtotal: 600,
      },
    ]);
  });
});

describe("OrderDataTransformer.transformCombosToOrderItems", () => {
  function makeCombo(slots: any[], quantity = 1) {
    return {
      id: "combo-instance-1",
      combo: { id: "combo-1", name: "Combo Clásico", price: 12000 },
      quantity,
      slots,
    };
  }

  it("produces one OrderItemInput per combo instance, priced base + slot burger adjustments", () => {
    const slot = {
      slotId: "slot-1",
      slotType: "burger" as const,
      maxQuantity: 1,
      defaultMeatCount: 1,
      burgers: [
        makeSelectedBurger({
          meatCount: 3,
          friesQuantity: 1,
          referenceFriesQuantity: 1,
        }),
      ],
    };
    const combos = [makeCombo([slot])];
    const [item] = OrderDataTransformer.transformCombosToOrderItems(
      combos,
      MEAT_EXTRA,
      FRIES_EXTRA,
    );

    expect(item.combo_id).toBe("combo-1");
    expect(item.burger_id).toBeNull();
    // meatDiff = 3 - 1 = 2 -> +1600
    expect(item.subtotal).toBe(12000 + 1600);
  });

  it("serializes per-slot burger customizations including a re-derived friesAdjustment", () => {
    const slot = {
      slotId: "slot-1",
      slotType: "burger" as const,
      maxQuantity: 1,
      defaultMeatCount: 1,
      burgers: [
        makeSelectedBurger({
          meatCount: 1,
          friesQuantity: 2,
          referenceFriesQuantity: 0,
          quantity: 1,
        }),
      ],
    };
    const combos = [makeCombo([slot])];
    const [item] = OrderDataTransformer.transformCombosToOrderItems(
      combos,
      MEAT_EXTRA,
      FRIES_EXTRA,
    );

    const parsed = JSON.parse(item.customizations as string);
    expect(parsed[0].burgers[0].friesQuantity).toBe(2);
    // friesDiff = 2 - 0(referenceFriesQuantity) = 2 -> 2 * 500 * qty(1) = 1000
    expect(parsed[0].burgers[0].friesAdjustment).toBe(1000);
  });

  it("returns an empty extras[] array -- combo extras travel inside customizations, not extras[]", () => {
    const combos = [makeCombo([])];
    const [item] = OrderDataTransformer.transformCombosToOrderItems(combos);
    expect(item.extras).toEqual([]);
  });
});

describe("OrderDataTransformer.transformSidesToOrderItems", () => {
  it("maps a side to an OrderItemInput keyed by extra_id, with the base price as subtotal", () => {
    const side: SelectedSide = {
      id: "side-1",
      extra: makeExtra({ id: "fries-side", name: "Papas grandes", price: 2000 }),
      quantity: 2,
      selectedExtras: [],
      expanded: false,
    };

    const [item] = OrderDataTransformer.transformSidesToOrderItems([side]);

    expect(item.extra_id).toBe("fries-side");
    expect(item.burger_id).toBeNull();
    expect(item.combo_id).toBeNull();
    expect(item.customizations).toBeNull();
    // subtotal is ONLY the base price -- side extras are priced separately in extras[]
    expect(item.subtotal).toBe(4000);
  });

  it("maps a side's own selectedExtras into extras[] with their own subtotal", () => {
    const side: SelectedSide = {
      id: "side-1",
      extra: makeExtra({ id: "fries-side", price: 2000 }),
      quantity: 1,
      selectedExtras: [
        { extra: makeExtra({ id: "cheese-sauce", name: "Cheddar sauce", price: 400 }), quantity: 2 },
      ],
      expanded: false,
    };

    const [item] = OrderDataTransformer.transformSidesToOrderItems([side]);

    expect(item.extras).toEqual([
      {
        extra_id: "cheese-sauce",
        extra_name: "Cheddar sauce",
        quantity: 2,
        unit_price: 400,
        subtotal: 800,
      },
    ]);
  });
});

describe("OrderDataTransformer.transformToOrderPayload", () => {
  it("orders items as combos, then burgers, then sides", () => {
    const burger = makeSelectedBurger();
    const combo = {
      id: "combo-instance-1",
      combo: { id: "combo-1", name: "Combo Clásico", price: 12000 },
      quantity: 1,
      slots: [],
    };
    const side: SelectedSide = {
      id: "side-1",
      extra: makeExtra({ id: "side-extra", name: "Papas", price: 2000 }),
      quantity: 1,
      selectedExtras: [],
      expanded: false,
    };

    const items = OrderDataTransformer.transformToOrderPayload(
      [burger],
      [combo],
      MEAT_EXTRA,
      FRIES_EXTRA,
      [side],
    );

    expect(items.map((i) => i.combo_id ?? i.burger_id ?? i.extra_id)).toEqual([
      "combo-1",
      "burger-1",
      "side-extra",
    ]);
  });

  it("omits sides entirely when none were selected", () => {
    const burger = makeSelectedBurger();
    const items = OrderDataTransformer.transformToOrderPayload(
      [burger],
      [],
      MEAT_EXTRA,
      FRIES_EXTRA,
    );
    expect(items).toHaveLength(1);
  });
});
