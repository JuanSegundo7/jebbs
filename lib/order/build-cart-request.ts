import type { CreateWebOrderRequest } from "@/lib/order/cart-request";
import type { SelectedBurger, SelectedCombo } from "@/lib/types/combo-types";
import type { SelectedSide } from "@/hooks/use-side-selection";
import type { Extra } from "@/lib/types";

// Structural subsets of hooks/use-cart.ts's and hooks/use-checkout.ts's
// return shapes -- kept narrow and pure (no React import) so this mapper is
// trivially unit-testable without renderHook. The full hook return types are
// a superset of these and pass through untouched (TypeScript's structural
// typing accepts them at the confirm-button.tsx call site).
export interface CartSelectionInput {
  burgers: { selectedBurgers: SelectedBurger[] };
  combos: { selectedCombos: SelectedCombo[] };
  sides: { selectedSides: SelectedSide[] };
}

export interface CheckoutSelectionInput {
  fulfillmentType: "pickup" | "delivery";
  phone: string;
  address: string;
  notes: string;
  customerName: string;
  paymentMethod: "cash" | "transfer";
}

function mapExtraRefs(extras: Array<{ extra: Extra; quantity: number }>) {
  return extras.map((e) => ({ extra_id: e.extra.id, quantity: e.quantity }));
}

function mapBurgerLine(burger: SelectedBurger) {
  return {
    burger_id: burger.burger.id,
    quantity: burger.quantity,
    meat_count: burger.meatCount,
    fries_quantity: burger.friesQuantity,
    is_veggie: burger.isVeggie ?? false,
    removed_ingredients: burger.removedIngredients,
    extras: mapExtraRefs(burger.selectedExtras),
  };
}

function mapComboLine(combo: SelectedCombo) {
  return {
    combo_id: combo.combo.id,
    quantity: combo.quantity,
    slots: combo.slots.map((slot) => ({
      slot_id: slot.slotId,
      burgers: slot.burgers.map(mapBurgerLine),
      extra_ids: slot.selectedExtras.map((e) => e.id),
    })),
  };
}

function mapSideLine(side: SelectedSide) {
  return {
    extra_id: side.extra.id,
    quantity: side.quantity,
    extras: mapExtraRefs(side.selectedExtras),
  };
}

// Builds the exact wire shape CreateWebOrderSchema (.strict()) expects,
// from the browser's cart + checkout state -- ids/quantities/flags only,
// never a price. The server (WU4) rehydrates and recomputes everything from
// its own catalog rows; this function's only job is to not accidentally
// post a field the schema would reject as unknown.
export function buildCreateWebOrderRequest(
  cart: CartSelectionInput,
  checkout: CheckoutSelectionInput,
): CreateWebOrderRequest {
  const fulfillment =
    checkout.fulfillmentType === "pickup"
      ? ({ type: "pickup" as const })
      : ({
          type: "delivery" as const,
          address: checkout.address.trim(),
          notes: checkout.notes.trim() || undefined,
        });

  return {
    burgers: cart.burgers.selectedBurgers.map(mapBurgerLine),
    combos: cart.combos.selectedCombos.map(mapComboLine),
    sides: cart.sides.selectedSides.map(mapSideLine),
    fulfillment,
    customer: {
      name: checkout.customerName.trim(),
      phone: checkout.phone.trim() || undefined,
    },
    payment_method: checkout.paymentMethod,
    notes: undefined,
  } as CreateWebOrderRequest;
}
