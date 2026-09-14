import type { CreateWebOrderRequest } from "@/lib/order/cart-request";
import type { Catalog } from "@/lib/catalog/get-catalog";
import { rehydrateSelection } from "@/lib/order/rehydrate-selection";
import { OrderPriceCalculator } from "@/lib/order/price-calculator";

// The central security mechanism of this whole change: the server ALWAYS
// recomputes the price, ignoring whatever the client sends. This function
// never reads a `total_amount`/`delivery_fee` field off `req` -- it only
// consumes ids/quantities/flags (via rehydrateSelection), the live catalog,
// and a server-stamped `deliveryFee` (from lib/env.ts, never the request
// body). The wire schema (cart-request.ts) already rejects a posted total
// outright via `.strict()`, but this function is the actual pricing
// boundary regardless of parsing.
export function computeOrderTotal(
  req: CreateWebOrderRequest,
  catalog: Catalog,
  deliveryFee: number,
): number {
  const { selectedBurgers, selectedCombos, selectedSides } = rehydrateSelection(
    req,
    catalog,
  );

  return OrderPriceCalculator.calculateOrderTotal({
    selectedBurgers,
    selectedCombos,
    selectedSides,
    deliveryType: req.fulfillment.type,
    deliveryFee,
    meatExtra: catalog.meatExtra,
    friesExtra: catalog.friesExtra,
  });
}
