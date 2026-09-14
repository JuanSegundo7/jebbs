// ============================================
// COMBO TYPES - Catalog subset ported from jebbs-dashboard's
// lib/types/combo-types.ts. Only the shapes get-catalog.ts needs to read and
// parse combos/slots/rules -- the order-building types (SelectedBurger,
// SelectedCombo, CreateComboPayload, etc.) belong to WU3/WU4 and are not
// ported here yet.
// ============================================

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

export interface ComboSlotWithRules extends ComboSlot {
  rules: {
    min_quantity: number;
    max_quantity: number;
    allowed_meat_count?: number[];
    no_fries?: boolean;
  };
}

export interface ComboWithSlots extends Combo {
  slots: ComboSlotWithRules[];
}
