"use client";

import { CupSoda, MessageCircle, Sandwich, Utensils, UtensilsCrossed } from "lucide-react";
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
import { CheckoutPanel } from "@/components/landing/checkout/checkout-panel";
import type { useCart } from "@/hooks/use-cart";
import type { UseCheckoutState } from "@/hooks/use-checkout";
import { formatArs } from "./currency";

interface CartDrawerProps {
  cart: ReturnType<typeof useCart>;
  checkout: UseCheckoutState;
  deliveryFeeArs: number;
}

// The cart lists what's selected, the advisory total, and (WU3b) the
// checkout panel -- fulfillment toggle, conditional delivery form, fee
// line, and the "Confirmar pedido" guard. WU5 wires the real submit
// (POST /api/orders -> WhatsApp handoff), replacing CheckoutPanel's bare
// button with confirm-button.tsx's single-flight fetch + fallback anchor.
//
// El trigger es la barra fija .rail (ref-style.css:189-195) en vez del
// FAB circular genérico: precio+CTA siempre visibles al pie de la
// pantalla, con el alto reservado por --rail-h (globals.css, body
// diner-body). Mismo mecanismo de Drawer/DrawerTrigger -- solo cambia el
// afordance visual del disparador.
export function CartDrawer({ cart, checkout, deliveryFeeArs }: CartDrawerProps) {
  const { burgers, combos, sides, itemCount, isEmpty, total } = cart;

  return (
    <Drawer>
      <DrawerTrigger asChild>
        <button type="button" className="diner-rail disabled:opacity-45" disabled={isEmpty}>
          <div className="diner-wrap flex h-full items-center gap-4">
            <div className="min-w-0 text-left">
              <span className="diner-rail-k block">Tu pedido</span>
              <span className="diner-rail-v block truncate">
                {itemCount > 0 ? `${itemCount} · ${formatArs(total)}` : "Carrito vacío"}
              </span>
            </div>
            <span className="diner-btn diner-btn-primary pointer-events-none ml-auto">
              <MessageCircle className="size-4" aria-hidden />
              Ver pedido
            </span>
          </div>
        </button>
      </DrawerTrigger>
      <DrawerContent>
        <DrawerHeader>
          <DrawerTitle className="font-display text-xl text-[var(--cream)]">
            Tu pedido
          </DrawerTitle>
          <DrawerDescription>
            Este total es orientativo -- se confirma al enviar el pedido.
          </DrawerDescription>
        </DrawerHeader>

        <div className="max-h-[50vh] space-y-2 overflow-y-auto px-4">
          {isEmpty && (
            <p className="text-muted-foreground text-subheadline">
              Todavia no agregaste nada.
            </p>
          )}

          {burgers.selectedBurgers.map((item) => (
            <div
              key={item.id}
              className="flex items-center gap-2 font-body text-sm text-[var(--cream)]"
            >
              <Sandwich className="size-4 shrink-0 text-[var(--cheddar)]" aria-hidden />
              <span>
                {item.quantity}x {item.burger.name}
              </span>
            </div>
          ))}

          {combos.selectedCombos.map((instance) => (
            <div
              key={instance.id}
              className="flex items-center gap-2 font-body text-sm text-[var(--cream)]"
            >
              <UtensilsCrossed
                className="size-4 shrink-0 text-[var(--cheddar)]"
                aria-hidden
              />
              <span>
                {instance.quantity}x {instance.combo.name}
              </span>
            </div>
          ))}

          {sides.selectedSides.map((side) => {
            const SideIcon = side.extra.category === "drink" ? CupSoda : Utensils;
            return (
              <div
                key={side.id}
                className="flex items-center gap-2 font-body text-sm text-[var(--cream)]"
              >
                <SideIcon className="size-4 shrink-0 text-[var(--cheddar)]" aria-hidden />
                <span>
                  {side.quantity}x {side.extra.name}
                </span>
              </div>
            );
          })}
        </div>

        <div className="px-4">
          <CheckoutPanel cart={cart} checkout={checkout} deliveryFeeArs={deliveryFeeArs} />
        </div>

        <DrawerFooter>
          <div className="flex items-center justify-between font-condensed text-lg font-bold text-[var(--cream)] uppercase">
            <span>Total</span>
            <span className="numeric text-[var(--cheddar)]">{formatArs(total)}</span>
          </div>
          <DrawerClose asChild>
            <Button variant="outline">Seguir eligiendo</Button>
          </DrawerClose>
        </DrawerFooter>
      </DrawerContent>
    </Drawer>
  );
}
