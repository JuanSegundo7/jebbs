"use client";

import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import type { Catalog } from "@/lib/catalog/get-catalog";
import { splitStorefrontExtras } from "@/lib/catalog/storefront-extras";
import { resolveDeliveryFee } from "@/lib/order/resolve-delivery-fee";
import { useCart } from "@/hooks/use-cart";
import { useCheckout } from "@/hooks/use-checkout";
import type { DeliveryZone } from "@/lib/types";
import { BurgerPicker } from "./burger-picker";
import { ComboPicker } from "./combo-picker";
import { SidePicker } from "./side-picker";
import { CartDrawer } from "./cart-drawer";

interface OrderBuilderProps {
  catalog: Catalog;
  deliveryZones: DeliveryZone[];
  minDeliveryFeeArs: number | null;
}

// Top-level order-builder for the landing (WU3 + WU3b). Owns both the cart
// state (useCart) and the checkout state (useCheckout -- fulfillment type,
// address, phone, notes), and renders the pickers, the cart drawer, and the
// checkout panel. The checkout panel's ConfirmButton (WU5) is what actually
// submits to POST /api/orders and performs the WhatsApp handoff.
export function OrderBuilder({ catalog, deliveryZones, minDeliveryFeeArs }: OrderBuilderProps) {
  const checkout = useCheckout();
  const isDelivery = checkout.fulfillmentType === "delivery";

  // Resolves the SAME way the server will (lib/order/resolve-delivery-fee.ts
  // is the single source of truth for both) -- this total is advisory only
  // (cart-drawer.tsx's own footer note), the server is the real authority.
  // Wrapped in try/catch: a stale deliveryZoneId (catalog changed under the
  // customer, e.g. a zone got deactivated between renders) must fall back
  // to "a confirmar" here, not crash the whole order builder -- POST
  // /api/orders is the place that actually rejects a bad zone id (409
  // ZONE_UNAVAILABLE).
  let resolvedDeliveryFee = 0;
  let deliveryFeePending = false;
  if (isDelivery) {
    try {
      const resolved = resolveDeliveryFee(deliveryZones, checkout.deliveryZoneId);
      resolvedDeliveryFee = resolved.deliveryFee;
      deliveryFeePending = resolved.deliveryFeePending;
    } catch {
      deliveryFeePending = true;
    }
  }

  const cart = useCart({
    meatExtra: catalog.meatExtra,
    friesExtra: catalog.friesExtra,
    deliveryType: checkout.fulfillmentType,
    deliveryFee: resolvedDeliveryFee,
  });

  const {
    drinks: drinkExtras,
    sides: sideExtras,
    toppings: toppingExtras,
  } = splitStorefrontExtras(catalog);
  // Bebidas y sides tab: standalone drinks + sides, both handled by the same
  // generic useSidesSelection (it prices/selects any Extra regardless of
  // category) -- only the display grouping is category-aware (SidePicker).
  const drinksAndSides = [...drinkExtras, ...sideExtras];

  // "¿Le sumás algo?" candidates for the cart drawer -- same pool as the
  // Bebidas y sides tab, minus whatever's already in the cart (addSide
  // dedupes by extra.id, so this just avoids offering a "+" on something
  // already selected).
  const inCart = new Set(cart.sides.selectedSides.map((s) => s.extra.id));
  const upsellExtras = drinksAndSides.filter((extra) => !inCart.has(extra.id));

  // Colores de jebbs-dashboard (escalera de acento en vez de cheddar/coal);
  // tipografía "diner" (font-condensed uppercase/tracking) restaurada por
  // pedido del dueño. dark: variants repeat every override on purpose -- see the
  // identical note in checkout/fulfillment-toggle.tsx. The base TabsTrigger
  // ships dark:text-muted-foreground / dark:data-[state=active]:bg-input/30,
  // and this app is hardcoded to dark mode, so a bare-only override loses.
  // [transition-timing-function:...] -- misma curva que diner-interactive
  // (cubic-bezier(0.16,1,0.3,1)) para que el cambio de tab active/inactive
  // se sienta como el mismo gesto que el resto de la página. La base
  // TabsTrigger (components/ui/tabs.tsx) ya trae `transition-[color,box-shadow]`
  // sin timing-function propio (ease del navegador); esto solo agrega la
  // curva, no pelea con transition-property.
  const tabTriggerClass =
    "rounded-full px-4 py-1.5 font-condensed text-[12px] font-bold tracking-[.08em] text-[var(--muted-foreground)] uppercase [transition-timing-function:cubic-bezier(0.16,1,0.3,1)] data-[state=active]:bg-[var(--accent-brand)] data-[state=active]:text-[var(--accent-contrast)] data-[state=active]:shadow-none dark:text-[var(--muted-foreground)] dark:data-[state=active]:bg-[var(--accent-brand)] dark:data-[state=active]:text-[var(--accent-contrast)]";

  return (
    <div className="space-y-6">
      <Tabs defaultValue="burgers">
        <TabsList className="h-auto w-full flex-wrap justify-start gap-1 border border-[var(--hairline)] bg-[var(--surface-1)] p-1 sm:w-fit">
          <TabsTrigger value="burgers" className={tabTriggerClass}>
            Hamburguesas
          </TabsTrigger>
          <TabsTrigger value="combos" className={tabTriggerClass}>
            Combos
          </TabsTrigger>
          <TabsTrigger value="sides" className={tabTriggerClass}>
            Bebidas y sides
          </TabsTrigger>
        </TabsList>

        <TabsContent value="burgers" className="mt-4">
          <BurgerPicker
            burgers={catalog.burgers}
            toppingExtras={toppingExtras}
            selection={cart.burgers}
          />
        </TabsContent>

        <TabsContent value="combos" className="mt-4">
          <ComboPicker
            combos={catalog.combos}
            burgers={catalog.burgers}
            drinkExtras={drinkExtras}
            sideExtras={sideExtras}
            selection={cart.combos}
          />
        </TabsContent>

        <TabsContent value="sides" className="mt-4">
          <SidePicker sides={drinksAndSides} selection={cart.sides} />
        </TabsContent>
      </Tabs>

      <CartDrawer
        cart={cart}
        checkout={checkout}
        deliveryFeeArs={resolvedDeliveryFee}
        deliveryFeePending={deliveryFeePending}
        deliveryZones={deliveryZones}
        minDeliveryFeeArs={minDeliveryFeeArs}
        meatExtra={catalog.meatExtra}
        friesExtra={catalog.friesExtra}
        toppingExtras={toppingExtras}
        upsellExtras={upsellExtras}
      />
    </div>
  );
}
