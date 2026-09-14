"use client";

import { ShoppingCart } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Drawer,
  DrawerClose,
  DrawerContent,
  DrawerDescription,
  DrawerFooter,
  DrawerHeader,
  DrawerTitle,
  DrawerTrigger,
} from "@/components/ui/drawer";
import type { useCart } from "@/hooks/use-cart";
import { formatArs } from "./currency";

interface CartDrawerProps {
  cart: ReturnType<typeof useCart>;
}

// The cart is display-only in this phase (WU3): it lists what's selected and
// the advisory total. WU3b adds checkout (pickup/delivery, address, phone)
// and WU5 wires the real "Confirmar pedido" -> WhatsApp handoff. There is no
// submit action here on purpose.
export function CartDrawer({ cart }: CartDrawerProps) {
  const { burgers, combos, sides, itemCount, isEmpty, total } = cart;

  return (
    <Drawer>
      <DrawerTrigger asChild>
        <Button
          variant="default"
          className="fixed bottom-4 right-4 z-40 shadow-lg"
          disabled={isEmpty}
        >
          <ShoppingCart />
          {itemCount > 0 ? `${itemCount} - ${formatArs(total)}` : "Carrito"}
        </Button>
      </DrawerTrigger>
      <DrawerContent>
        <DrawerHeader>
          <DrawerTitle>Tu pedido</DrawerTitle>
          <DrawerDescription>
            Este total es orientativo -- se confirma al enviar el pedido.
          </DrawerDescription>
        </DrawerHeader>

        <div className="max-h-[50vh] space-y-3 overflow-y-auto px-4">
          {isEmpty && (
            <p className="text-muted-foreground text-subheadline">
              Todavia no agregaste nada.
            </p>
          )}

          {burgers.selectedBurgers.map((item) => (
            <div key={item.id} className="flex items-center justify-between text-subheadline">
              <span>
                {item.quantity}x {item.burger.name}
              </span>
            </div>
          ))}

          {combos.selectedCombos.map((instance) => (
            <div
              key={instance.id}
              className="flex items-center justify-between text-subheadline"
            >
              <span>
                {instance.quantity}x {instance.combo.name}
              </span>
            </div>
          ))}

          {sides.selectedSides.map((side) => (
            <div key={side.id} className="flex items-center justify-between text-subheadline">
              <span>
                {side.quantity}x {side.extra.name}
              </span>
            </div>
          ))}
        </div>

        <DrawerFooter>
          <div className="flex items-center justify-between text-title3 font-semibold">
            <span>Total</span>
            <span>{formatArs(total)}</span>
          </div>
          <DrawerClose asChild>
            <Button variant="outline">Seguir eligiendo</Button>
          </DrawerClose>
        </DrawerFooter>
      </DrawerContent>
    </Drawer>
  );
}
