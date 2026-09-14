"use client";

import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import type { Catalog } from "@/lib/catalog/get-catalog";
import { useCart } from "@/hooks/use-cart";
import { BurgerPicker } from "./burger-picker";
import { ComboPicker } from "./combo-picker";
import { SidePicker } from "./side-picker";
import { CartDrawer } from "./cart-drawer";

interface OrderBuilderProps {
  catalog: Catalog;
  /** Advisory only -- deliveryType defaults to "pickup" until WU3b adds the
   * actual checkout toggle, so this fee does not affect the total yet. */
  deliveryFeeArs: number;
}

// Top-level order-builder for the landing (WU3). Owns the cart state
// (useCart) and renders the three pickers as tabs plus the cart drawer.
// Checkout (pickup/delivery, address, phone) is WU3b; submitting the order
// to POST /api/orders and the WhatsApp handoff are WU4/WU5 -- nothing here
// writes anything, it only builds the in-memory selection.
export function OrderBuilder({ catalog, deliveryFeeArs }: OrderBuilderProps) {
  const cart = useCart({
    meatExtra: catalog.meatExtra,
    friesExtra: catalog.friesExtra,
    deliveryFee: deliveryFeeArs,
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

      <CartDrawer cart={cart} />
    </div>
  );
}
