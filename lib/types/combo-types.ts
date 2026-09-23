// ============================================
// COMBO TYPES - Catalog subset ported from jebbs-dashboard's
// lib/types/combo-types.ts. WU2 ported only the catalog-read shapes; WU3
// (order builder) adds back the order-building types (SelectedBurger,
// SelectedComboSlot, SelectedCombo) that the selection hooks and
// OrderPriceCalculator/OrderDataTransformer need. CreateComboPayload and
// isValidSlotType still belong to the dashboard's admin combo-management UI
// and are not ported here.
// ============================================

import type { Burger, Extra } from ".";

export interface Combo {
  id: string;
  name: string;
  description: string | null;
  price: number;
  is_available: boolean;
  created_at: string;
}

export interface ComboSlotRule {
  id: number;
  combo_slot_id: string;
  rule_type: string | null;
  rule_value: string | null;
  created_at: string;
}

export interface ComboSlot {
  id: string;
  combo_id: string;
  slot_type: string; // "burger" | "drink" | "side" | "nuggets" (any string in DB)
  quantity: number;
  required: boolean;
  default_meat_quantity: number | null;
  created_at: string;
}

// ============================================
// EXTENDED TYPES - For catalog consumption
// ============================================

// Parsed combo_slots_rules (key/value rows). Single definition shared by the
// catalog's slot and the customer's selected slot.
export interface ComboSlotRules {
  min_quantity: number;
  max_quantity: number;
  allowed_meat_count?: number[];
  no_fries?: boolean;
  // Mandatory burger: the slot is pinned to this burger id.
  fixed_burger_id?: string;
}

export interface ComboSlotWithRules extends ComboSlot {
  rules: ComboSlotRules;
}

export interface ComboWithSlots extends Combo {
  slots: ComboSlotWithRules[];
}

// ============================================
// ORDER-BUILDING TYPES (WU3) - selection state built by
// hooks/use-burger-selection.ts and hooks/use-combo-selection.ts, consumed
// by lib/order/price-calculator.ts and lib/order/data-transformer.ts.
// ============================================

export interface SelectedBurger {
  id: string;
  burger: Burger;
  quantity: number;
  meatCount: number;
  friesQuantity: number;
  referenceFriesQuantity?: number; // Override for combos without fries: avoids a discount when pricing
  isVeggie?: boolean; // true = veggie patties instead of meat
  removedIngredients: string[];
  selectedExtras: Array<{
    extra: Extra;
    quantity: number;
  }>;
  meatPriceAdjustment: number;
  locked?: boolean; // true = combo's fixed burger: cannot be removed or change quantity
}

/**
 * SelectedComboSlot - SHARED TYPE
 * Represents a slot inside a selected combo.
 */
export interface SelectedComboSlot {
  slotId: string;
  slotType: "burger" | "drink" | "side";
  defaultMeatCount?: number;
  maxQuantity: number;
  minQuantity: number;
  rules: ComboSlotRules;
  burgers: SelectedBurger[];
  selectedExtras: Extra[];
}

/**
 * SelectedCombo - SHARED TYPE
 * Represents a full combo selected in the order builder.
 */
export interface SelectedCombo {
  id: string;
  combo: ComboWithSlots;
  quantity: number;
  slots: SelectedComboSlot[];
}
