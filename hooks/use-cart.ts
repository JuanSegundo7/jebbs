"use client";

import { useMemo } from "react";
import type { Extra } from "@/lib/types";
import { OrderPriceCalculator } from "@/lib/order/price-calculator";
import { useBurgerSelection } from "@/hooks/use-burger-selection";
import { useComboSelection } from "@/hooks/use-combo-selection";
import { useSidesSelection } from "@/hooks/use-side-selection";

export interface UseCartOptions {
  /** Required to price meat-count adjustments (R17, design.md). */
  meatExtra: Extra;
  /** Required to price fries-quantity adjustments (R17, design.md). */
  friesExtra: Extra;
  /** Current fulfillment choice. Defaults to "pickup" -- WU3b (checkout) is
   * the phase that actually lets the customer switch this. */
  deliveryType?: "pickup" | "delivery";
  /** Display-only delivery fee, ignored when deliveryType is "pickup". */
  deliveryFee?: number;
}

/**
 * Aggregates the three selection hooks (burgers, combos, sides) into a
 * single cart and derives a display total via OrderPriceCalculator.
 *
 * IMPORTANT: this total is advisory only, for the customer to see what
 * they're about to order. It is NEVER sent to the server as-is and it is
 * NEVER the source of truth for what gets charged -- WU4's
 * `POST /api/orders` recomputes the whole total from scratch server-side,
 * from catalog rows it fetches itself, and ignores any client-posted total.
 */
export function useCart({
  meatExtra,
  friesExtra,
  deliveryType = "pickup",
  deliveryFee = 0,
}: UseCartOptions) {
  const burgers = useBurgerSelection(meatExtra);
  const combos = useComboSelection();
  const sides = useSidesSelection();

  const itemCount = useMemo(() => {
    const burgerCount = burgers.selectedBurgers.reduce(
      (acc, b) => acc + b.quantity,
      0,
    );
    const comboCount = combos.selectedCombos.reduce(
      (acc, c) => acc + c.quantity,
      0,
    );
    const sideCount = sides.selectedSides.reduce(
      (acc, s) => acc + s.quantity,
      0,
    );
    return burgerCount + comboCount + sideCount;
  }, [burgers.selectedBurgers, combos.selectedCombos, sides.selectedSides]);

  const isEmpty = itemCount === 0;

  // Excludes delivery fee/discount/adjustment -- `total` (below) is the one
  // that includes those. Split out because checkout-panel.tsx was reading
  // `total` (already fee-inclusive) into its "Subtotal" row and then adding
  // the fee again for "Total", double-charging delivery on screen.
  const subtotal = useMemo(() => {
    return OrderPriceCalculator.calculateSubtotal(
      burgers.selectedBurgers,
      combos.selectedCombos,
      sides.selectedSides,
      meatExtra,
      friesExtra,
    );
  }, [burgers.selectedBurgers, combos.selectedCombos, sides.selectedSides, meatExtra, friesExtra]);

  const total = useMemo(() => {
    return OrderPriceCalculator.calculateOrderTotal({
      selectedBurgers: burgers.selectedBurgers,
      selectedCombos: combos.selectedCombos,
      selectedSides: sides.selectedSides,
      deliveryType,
      deliveryFee,
      meatExtra,
      friesExtra,
      discountType: "none",
      discountValue: 0,
      priceAdjustment: 0,
    });
  }, [
    burgers.selectedBurgers,
    combos.selectedCombos,
    sides.selectedSides,
    deliveryType,
    deliveryFee,
    meatExtra,
    friesExtra,
  ]);

  const reset = () => {
    burgers.reset();
    combos.resetState();
    sides.reset();
  };

  return {
    burgers,
    combos,
    sides,
    itemCount,
    isEmpty,
    subtotal,
    total,
    reset,
  };
}
