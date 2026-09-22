import { act, renderHook } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { useComboSelection } from "@/hooks/use-combo-selection";
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
