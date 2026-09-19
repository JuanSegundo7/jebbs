"use client";

import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import type { Catalog } from "@/lib/catalog/get-catalog";
import { splitStorefrontExtras } from "@/lib/catalog/storefront-extras";
import { useCart } from "@/hooks/use-cart";
import { useCheckout } from "@/hooks/use-checkout";
import { BurgerPicker } from "./burger-picker";
import { ComboPicker } from "./combo-picker";
import { SidePicker } from "./side-picker";
import { CartDrawer } from "./cart-drawer";

interface OrderBuilderProps {
  catalog: Catalog;
  /** Display-only source for the fee line; the actual amount applied to
   * the cart's advisory total depends on the checkout's fulfillment type
   * (WU3b) -- pickup never adds it, delivery always does. */
  deliveryFeeArs: number;
}

// Top-level order-builder for the landing (WU3 + WU3b). Owns both the cart
// state (useCart) and the checkout state (useCheckout -- fulfillment type,
// address, phone, notes), and renders the pickers, the cart drawer, and the
// checkout panel. The checkout panel's ConfirmButton (WU5) is what actually
// submits to POST /api/orders and performs the WhatsApp handoff.
export function OrderBuilder({ catalog, deliveryFeeArs }: OrderBuilderProps) {
  const checkout = useCheckout();
  const isDelivery = checkout.fulfillmentType === "delivery";
  const cart = useCart({
    meatExtra: catalog.meatExtra,
    friesExtra: catalog.friesExtra,
    deliveryType: checkout.fulfillmentType,
    deliveryFee: isDelivery ? deliveryFeeArs : 0,
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

  // Re-estilo a la identidad real de jebbs-dashboard: tipografía nativa
  // (font-sans, sin mayúscula/tracking condensado -- el dashboard no usa esa
  // convención) y fondo/texto con la escalera de acento en vez de
  // cheddar/coal. dark: variants repeat every override on purpose -- see the
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
    "rounded-full px-4 py-1.5 font-sans text-[12px] font-semibold text-[var(--muted-foreground)] [transition-timing-function:cubic-bezier(0.16,1,0.3,1)] data-[state=active]:bg-[var(--accent-brand)] data-[state=active]:text-[var(--accent-contrast)] data-[state=active]:shadow-none dark:text-[var(--muted-foreground)] dark:data-[state=active]:bg-[var(--accent-brand)] dark:data-[state=active]:text-[var(--accent-contrast)]";

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
        deliveryFeeArs={deliveryFeeArs}
        meatExtra={catalog.meatExtra}
        friesExtra={catalog.friesExtra}
      />
    </div>
  );
}
