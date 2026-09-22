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

// ============================================
// DELIVERY ZONES
// ============================================

// Ported from the dashboard's new `delivery_zones` table (not yet applied
// to production -- the landing develops against this shape ahead of the
// migration landing). `map_zone_key` matches a `data-zone="z1".."z4"`
// attribute in public/delivery-zone-map.svg; null means the zone has no
// drawn location on that map (it still appears in the picker/list).
// `map_polygon` is the dashboard's free-draw alternative: an array of
// [x, y] points in the SAME "0 0 1654 966" viewBox coordinate space as
// public/delivery-zone-map.svg, for zones with no pre-traced data-zone
// path. Invariant from the dashboard's editor: a zone never has both
// map_zone_key and map_polygon set at once (drawing a polygon clears the
// legacy key).
export interface DeliveryZone {
  id: string;
  name: string;
  description: string | null;
  fee: number;
  is_active: boolean;
  sort_order: number;
  map_zone_key: string | null;
  map_polygon: [number, number][] | null;
}
