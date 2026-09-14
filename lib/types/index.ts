// ============================================
// BASE TYPES - Catalog subset ported from jebbs-dashboard's lib/types/index.ts.
// Only what the landing's catalog read path (WU2) needs today -- orders,
// customers, costing, etc. from the dashboard's full types file are not
// ported here; add them when the work unit that needs them lands.
// ============================================

export type ExtraCategory = "extra" | "drink" | "fries" | "sides";

// ============================================
// BURGERS
// ============================================

export interface Burger {
  id: string;
  name: string;
  description: string | null;
  base_price: number;
  ingredients: string[];
  is_available: boolean;
  image_url: string | null;
  default_meat_quantity: number; // Comes from DB as smallint
  default_fries_quantity: number; // Comes from DB as numeric
  created_at: string;
}

// ============================================
// EXTRAS
// ============================================

export interface Extra {
  id: string;
  name: string;
  category: ExtraCategory;
  price: number;
  is_available: boolean;
  created_at: string;
}
