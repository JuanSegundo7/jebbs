import type { Catalog } from "./get-catalog";
import type { Extra } from "@/lib/types";

export interface StorefrontExtras {
  drinks: Extra[];
  sides: Extra[];
  toppings: Extra[];
}

// The burger customization panel must not offer "Medallón" / "Papas fritas
// chicas" as generic toppings -- those two extras already have their own
// dedicated steppers (Carne / Papas) in the burger UI, so surfacing them
// again as chips would let a customer double-charge themselves for the same
// item. catalog.extras keeps ALL sellable rows (including these two) because
// server-side availability validation depends on that -- this filter is
// display-only and must stay out of get-catalog.ts.
export function splitStorefrontExtras(
  catalog: Pick<Catalog, "extras" | "meatExtra" | "friesExtra">,
): StorefrontExtras {
  const dedicated = new Set([catalog.meatExtra.id, catalog.friesExtra.id]);
  return {
    drinks: catalog.extras.filter((e) => e.category === "drink"),
    sides: catalog.extras.filter((e) => e.category === "sides"),
    toppings: catalog.extras.filter((e) => e.category === "extra" && !dedicated.has(e.id)),
  };
}
