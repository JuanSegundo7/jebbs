"use client";

import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import type { Catalog } from "@/lib/catalog/get-catalog";
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
// checkout panel. Submitting the order to POST /api/orders and the
// WhatsApp handoff are WU4/WU5 -- nothing here writes anything yet, it only
// builds the in-memory selection and checkout fields.
export function OrderBuilder({ catalog, deliveryFeeArs }: OrderBuilderProps) {
  const checkout = useCheckout();
  const isDelivery = checkout.fulfillmentType === "delivery";
  const cart = useCart({
    meatExtra: catalog.meatExtra,
    friesExtra: catalog.friesExtra,
    deliveryType: checkout.fulfillmentType,
    deliveryFee: isDelivery ? deliveryFeeArs : 0,
  });

  const drinkExtras = catalog.extras.filter((e) => e.category === "drink");
  const sideExtras = catalog.extras.filter((e) => e.category === "sides");
  const toppingExtras = catalog.extras.filter((e) => e.category === "extra");

  return (
    <div className="space-y-6">
      <Tabs defaultValue="burgers">
        <TabsList>
          <TabsTrigger value="burgers">Hamburguesas</TabsTrigger>
          <TabsTrigger value="combos">Combos</TabsTrigger>
          <TabsTrigger value="sides">Acompanamientos</TabsTrigger>
        </TabsList>

        <TabsContent value="burgers">
          <BurgerPicker
            burgers={catalog.burgers}
            toppingExtras={toppingExtras}
            selection={cart.burgers}
          />
        </TabsContent>

        <TabsContent value="combos">
          <ComboPicker
            combos={catalog.combos}
            burgers={catalog.burgers}
            drinkExtras={drinkExtras}
            sideExtras={sideExtras}
            selection={cart.combos}
          />
        </TabsContent>

        <TabsContent value="sides">
          <SidePicker sides={sideExtras} selection={cart.sides} />
        </TabsContent>
      </Tabs>

      <CartDrawer cart={cart} checkout={checkout} deliveryFeeArs={deliveryFeeArs} />
    </div>
  );
}
