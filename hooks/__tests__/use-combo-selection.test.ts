import { act, renderHook } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { useComboSelection } from "@/hooks/use-combo-selection";
import type { Burger } from "@/lib/types";
import type { ComboSlotWithRules, ComboWithSlots } from "@/lib/types/combo-types";

function makeComboSlot(overrides: Partial<ComboSlotWithRules> = {}): ComboSlotWithRules {
  return {
    id: "slot-1",
    combo_id: "combo-1",
    slot_type: "burger",
    quantity: 1,
    required: true,
    default_meat_quantity: null,
    created_at: "2024-01-01",
    rules: { min_quantity: 0, max_quantity: 1 },
    ...overrides,
  };
}

function makeCombo(overrides: Partial<ComboWithSlots> = {}): ComboWithSlots {
  return {
    id: "combo-1",
    name: "Combo Doble",
    description: null,
    price: 12000,
    is_available: true,
    created_at: "2024-01-01",
    slots: [makeComboSlot()],
    ...overrides,
  };
}

describe("useComboSelection -- updateComboQuantity", () => {
  it("increments the quantity of an existing combo instance", () => {
    const { result } = renderHook(() => useComboSelection());

    act(() => {
      result.current.addCombo(makeCombo());
    });
    const instanceId = result.current.selectedCombos[0].id;

    act(() => {
      result.current.updateComboQuantity(instanceId, 1);
    });

    expect(result.current.selectedCombos[0].quantity).toBe(2);
  });

  it("decrements the quantity without removing the instance while it stays above 0", () => {
    const { result } = renderHook(() => useComboSelection());

    act(() => {
      result.current.addCombo(makeCombo());
    });
    const instanceId = result.current.selectedCombos[0].id;

    act(() => {
      result.current.updateComboQuantity(instanceId, 1);
    });
    act(() => {
      result.current.updateComboQuantity(instanceId, -1);
    });

    expect(result.current.selectedCombos).toHaveLength(1);
    expect(result.current.selectedCombos[0].quantity).toBe(1);
  });

  it("removes the combo instance once quantity would drop to 0 or below", () => {
    const { result } = renderHook(() => useComboSelection());

    act(() => {
      result.current.addCombo(makeCombo());
    });
    const instanceId = result.current.selectedCombos[0].id;

    act(() => {
      result.current.updateComboQuantity(instanceId, -1);
    });

    expect(result.current.selectedCombos).toEqual([]);
  });

  it("is a no-op for an unknown combo instance id", () => {
    const { result } = renderHook(() => useComboSelection());

    act(() => {
      result.current.addCombo(makeCombo());
    });

    act(() => {
      result.current.updateComboQuantity("does-not-exist", 1);
    });

    expect(result.current.selectedCombos).toHaveLength(1);
    expect(result.current.selectedCombos[0].quantity).toBe(1);
  });
});

function makeBurger(overrides: Partial<Burger> = {}): Burger {
  return {
    id: "burger-1",
    name: "Clásica",
    description: null,
    base_price: 5000,
    ingredients: ["cebolla", "tomate"],
    is_available: true,
    image_url: null,
    default_meat_quantity: 2,
    default_fries_quantity: 1,
    created_at: "2024-01-01",
    ...overrides,
  };
}

const FIXED_BURGER = makeBurger({
  id: "burger-fixed",
  name: "Triple con queso",
  default_meat_quantity: 3,
});
const OTHER_BURGER = makeBurger({
  id: "burger-other",
  name: "Doble",
  default_meat_quantity: 2,
});

function fixedSlotCombo(quantity = 2) {
  return makeCombo({
    slots: [
      makeComboSlot({
        quantity,
        rules: {
          min_quantity: quantity,
          max_quantity: quantity,
          fixed_burger_id: FIXED_BURGER.id,
        },
      }),
    ],
  });
}

function meatFilteredCombo() {
  return makeCombo({
    slots: [
      makeComboSlot({
        quantity: 2,
        rules: { min_quantity: 2, max_quantity: 2, allowed_meat_count: [3] },
      }),
    ],
  });
}

describe("useComboSelection -- fixed burger slot", () => {
  it("addCombo preloads N separate locked entries of quantity 1", () => {
    const { result } = renderHook(() => useComboSelection());

    act(() => {
      result.current.addCombo(fixedSlotCombo(2), [OTHER_BURGER, FIXED_BURGER]);
    });

    const burgers = result.current.selectedCombos[0].slots[0].burgers;
    expect(burgers).toHaveLength(2);
    expect(burgers.every((b) => b.burger.id === FIXED_BURGER.id)).toBe(true);
    expect(burgers.every((b) => b.quantity === 1)).toBe(true);
    expect(burgers.every((b) => b.locked === true)).toBe(true);
    expect(new Set(burgers.map((b) => b.id)).size).toBe(2);
    expect(
      result.current.getRemainingQuantity(
        result.current.selectedCombos[0].id,
        "slot-1",
      ),
    ).toBe(0);
  });

  it("addCombo leaves the slot empty when the fixed burger cannot be resolved", () => {
    const { result } = renderHook(() => useComboSelection());

    act(() => {
      result.current.addCombo(fixedSlotCombo(2), [OTHER_BURGER]);
    });

    expect(result.current.selectedCombos[0].slots[0].burgers).toEqual([]);
  });

  it("addCombo without a burgers list keeps working for combos with no fixed burger", () => {
    const { result } = renderHook(() => useComboSelection());

    act(() => {
      result.current.addCombo(makeCombo());
    });

    expect(result.current.selectedCombos[0].slots[0].burgers).toEqual([]);
  });

  it("canAddBurgerToSlot only accepts the fixed burger", () => {
    const { result } = renderHook(() => useComboSelection());
    // Nothing preloaded (no burgers passed), so the slot has room.
    act(() => {
      result.current.addCombo(fixedSlotCombo(2));
    });
    const comboId = result.current.selectedCombos[0].id;

    expect(result.current.canAddBurgerToSlot(comboId, "slot-1", FIXED_BURGER)).toBe(true);
    expect(result.current.canAddBurgerToSlot(comboId, "slot-1", OTHER_BURGER)).toBe(false);
  });

  it("addBurgerToSlot respects canAddBurgerToSlot (rejects a non-fixed burger)", () => {
    const { result } = renderHook(() => useComboSelection());
    act(() => {
      result.current.addCombo(fixedSlotCombo(2));
    });
    const comboId = result.current.selectedCombos[0].id;

    act(() => {
      result.current.addBurgerToSlot(comboId, "slot-1", OTHER_BURGER);
    });

    expect(result.current.selectedCombos[0].slots[0].burgers).toEqual([]);
  });

  it("removeBurgerFromSlot is a no-op on a locked burger", () => {
    const { result } = renderHook(() => useComboSelection());
    act(() => {
      result.current.addCombo(fixedSlotCombo(2), [FIXED_BURGER]);
    });
    const comboId = result.current.selectedCombos[0].id;
    const itemId = result.current.selectedCombos[0].slots[0].burgers[0].id;

    act(() => {
      result.current.removeBurgerFromSlot(comboId, "slot-1", itemId);
    });

    expect(result.current.selectedCombos[0].slots[0].burgers).toHaveLength(2);
  });

  it("decreaseBurgerQty is a no-op on a locked burger", () => {
    const { result } = renderHook(() => useComboSelection());
    act(() => {
      result.current.addCombo(fixedSlotCombo(2), [FIXED_BURGER]);
    });
    const comboId = result.current.selectedCombos[0].id;
    const itemId = result.current.selectedCombos[0].slots[0].burgers[0].id;

    act(() => {
      result.current.decreaseBurgerQty(comboId, "slot-1", itemId);
    });

    const burgers = result.current.selectedCombos[0].slots[0].burgers;
    expect(burgers).toHaveLength(2);
    expect(burgers[0].quantity).toBe(1);
  });

  it("increaseBurgerQty is a no-op on a locked burger even with spare room", () => {
    const { result } = renderHook(() => useComboSelection());
    act(() => {
      result.current.addCombo(fixedSlotCombo(2), [FIXED_BURGER]);
    });
    const comboId = result.current.selectedCombos[0].id;
    const slot = result.current.selectedCombos[0].slots[0];
    // Force spare room: keep only one of the two locked entries.
    act(() => {
      result.current.loadCombos([
        {
          ...result.current.selectedCombos[0],
          slots: [{ ...slot, burgers: [slot.burgers[0]] }],
        },
      ]);
    });
    const itemId = result.current.selectedCombos[0].slots[0].burgers[0].id;
    expect(result.current.getRemainingQuantity(comboId, "slot-1")).toBe(1);

    act(() => {
      result.current.increaseBurgerQty(comboId, "slot-1", itemId);
    });

    expect(result.current.selectedCombos[0].slots[0].burgers[0].quantity).toBe(1);
  });

  it("locked burgers can still be customized, each one independently", () => {
    const { result } = renderHook(() => useComboSelection());
    act(() => {
      result.current.addCombo(fixedSlotCombo(2), [FIXED_BURGER]);
    });
    const comboId = result.current.selectedCombos[0].id;
    const [first, second] = result.current.selectedCombos[0].slots[0].burgers;

    act(() => {
      result.current.toggleComboBurgerIngredient(
        comboId,
        "slot-1",
        first.id,
        "cebolla",
      );
    });

    const burgers = result.current.selectedCombos[0].slots[0].burgers;
    expect(burgers.find((b) => b.id === first.id)?.removedIngredients).toEqual([
      "cebolla",
    ]);
    expect(burgers.find((b) => b.id === second.id)?.removedIngredients).toEqual(
      [],
    );
  });
});

describe("useComboSelection -- slot rules without a fixed burger", () => {
  it("canAddBurgerToSlot filters by allowed_meat_count", () => {
    const { result } = renderHook(() => useComboSelection());
    act(() => {
      result.current.addCombo(meatFilteredCombo());
    });
    const comboId = result.current.selectedCombos[0].id;

    expect(result.current.canAddBurgerToSlot(comboId, "slot-1", FIXED_BURGER)).toBe(true);
    expect(result.current.canAddBurgerToSlot(comboId, "slot-1", OTHER_BURGER)).toBe(false);
  });

  it("canAddBurgerToSlot converts a string-typed meat quantity from the DB", () => {
    const { result } = renderHook(() => useComboSelection());
    act(() => {
      result.current.addCombo(meatFilteredCombo());
    });
    const comboId = result.current.selectedCombos[0].id;
    const stringy = makeBurger({
      id: "burger-stringy",
      default_meat_quantity: "3" as unknown as number,
    });

    expect(result.current.canAddBurgerToSlot(comboId, "slot-1", stringy)).toBe(true);
  });

  it("addBurgerToSlot does not add a burger that violates allowed_meat_count", () => {
    const { result } = renderHook(() => useComboSelection());
    act(() => {
      result.current.addCombo(meatFilteredCombo());
    });
    const comboId = result.current.selectedCombos[0].id;

    act(() => {
      result.current.addBurgerToSlot(comboId, "slot-1", OTHER_BURGER);
    });
    expect(result.current.selectedCombos[0].slots[0].burgers).toEqual([]);

    act(() => {
      result.current.addBurgerToSlot(comboId, "slot-1", FIXED_BURGER);
    });
    expect(result.current.selectedCombos[0].slots[0].burgers).toHaveLength(1);
  });

  it("addBurgerToSlot does not overfill the slot", () => {
    const { result } = renderHook(() => useComboSelection());
    act(() => {
      result.current.addCombo(makeCombo());
    });
    const comboId = result.current.selectedCombos[0].id;

    act(() => {
      result.current.addBurgerToSlot(comboId, "slot-1", OTHER_BURGER);
    });
    act(() => {
      result.current.addBurgerToSlot(comboId, "slot-1", OTHER_BURGER);
    });

    expect(result.current.selectedCombos[0].slots[0].burgers).toHaveLength(1);
  });
});

describe("useComboSelection -- pre-select the only candidate burger", () => {
  const singleSlotCombo = (rules: ComboSlotWithRules["rules"], quantity = 1) =>
    makeCombo({ slots: [makeComboSlot({ quantity, rules })] });

  it("pre-fills a non-locked entry when exactly one burger is eligible", () => {
    const { result } = renderHook(() => useComboSelection());

    act(() => {
      result.current.addCombo(
        singleSlotCombo({ min_quantity: 1, max_quantity: 1 }),
        [OTHER_BURGER],
      );
    });

    const slot = result.current.selectedCombos[0].slots[0];
    expect(slot.burgers).toHaveLength(1);
    expect(slot.burgers[0].burger.id).toBe(OTHER_BURGER.id);
    expect(slot.burgers[0].locked).toBeUndefined();
    expect(slot.burgers[0].quantity).toBe(1);
    expect(
      result.current.getRemainingQuantity(result.current.selectedCombos[0].id, "slot-1"),
    ).toBe(0);
  });

  it("uses allowed_meat_count to find the single eligible burger", () => {
    const { result } = renderHook(() => useComboSelection());

    act(() => {
      result.current.addCombo(
        singleSlotCombo({ min_quantity: 1, max_quantity: 1, allowed_meat_count: [3] }),
        [OTHER_BURGER, FIXED_BURGER],
      );
    });

    const burgers = result.current.selectedCombos[0].slots[0].burgers;
    expect(burgers.map((b) => b.burger.id)).toEqual([FIXED_BURGER.id]);
  });

  it("stays removable and the slot is offered again afterwards", () => {
    const { result } = renderHook(() => useComboSelection());
    act(() => {
      result.current.addCombo(
        singleSlotCombo({ min_quantity: 1, max_quantity: 1 }),
        [OTHER_BURGER],
      );
    });
    const comboId = result.current.selectedCombos[0].id;
    const itemId = result.current.selectedCombos[0].slots[0].burgers[0].id;

    act(() => {
      result.current.removeBurgerFromSlot(comboId, "slot-1", itemId);
    });

    expect(result.current.selectedCombos[0].slots[0].burgers).toEqual([]);
    expect(result.current.canAddBurgerToSlot(comboId, "slot-1", OTHER_BURGER)).toBe(true);
  });

  it("does not pre-fill when two burgers are eligible", () => {
    const { result } = renderHook(() => useComboSelection());

    act(() => {
      result.current.addCombo(
        singleSlotCombo({ min_quantity: 1, max_quantity: 1 }),
        [OTHER_BURGER, FIXED_BURGER],
      );
    });

    expect(result.current.selectedCombos[0].slots[0].burgers).toEqual([]);
  });

  it("does not pre-fill when the slot allows more than one burger", () => {
    const { result } = renderHook(() => useComboSelection());

    act(() => {
      result.current.addCombo(
        singleSlotCombo({ min_quantity: 1, max_quantity: 2 }, 2),
        [OTHER_BURGER],
      );
    });

    expect(result.current.selectedCombos[0].slots[0].burgers).toEqual([]);
  });

  it("does not pre-fill when the slot's minimum is 0", () => {
    const { result } = renderHook(() => useComboSelection());

    act(() => {
      result.current.addCombo(
        singleSlotCombo({ min_quantity: 0, max_quantity: 1 }),
        [OTHER_BURGER],
      );
    });

    expect(result.current.selectedCombos[0].slots[0].burgers).toEqual([]);
  });

  it("keeps a fixed-burger slot locked instead of pre-selecting", () => {
    const { result } = renderHook(() => useComboSelection());

    act(() => {
      result.current.addCombo(
        singleSlotCombo({
          min_quantity: 1,
          max_quantity: 1,
          fixed_burger_id: FIXED_BURGER.id,
        }),
        [FIXED_BURGER],
      );
    });

    const burgers = result.current.selectedCombos[0].slots[0].burgers;
    expect(burgers).toHaveLength(1);
    expect(burgers[0].locked).toBe(true);
  });

  it("does not pre-fill when the filter leaves no burger", () => {
    const { result } = renderHook(() => useComboSelection());

    act(() => {
      result.current.addCombo(
        singleSlotCombo({ min_quantity: 1, max_quantity: 1, allowed_meat_count: [5] }),
        [OTHER_BURGER, FIXED_BURGER],
      );
    });

    expect(result.current.selectedCombos[0].slots[0].burgers).toEqual([]);
  });

  it("does not pre-fill drink or side slots", () => {
    const { result } = renderHook(() => useComboSelection());

    act(() => {
      result.current.addCombo(
        makeCombo({
          slots: [
            makeComboSlot({
              slot_type: "drink",
              rules: { min_quantity: 1, max_quantity: 1 },
            }),
          ],
        }),
        [OTHER_BURGER],
      );
    });

    expect(result.current.selectedCombos[0].slots[0].burgers).toEqual([]);
  });
});
