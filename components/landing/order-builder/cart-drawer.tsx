"use client";

import { useState } from "react";
import {
  CupSoda,
  MessageCircle,
  Sandwich,
  Utensils,
  UtensilsCrossed,
  type LucideIcon,
} from "lucide-react";
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
import { OrderPriceCalculator } from "@/lib/order/price-calculator";
import {
  summarizeBurger,
  summarizeCombo,
  summarizeSide,
} from "@/lib/order/customization-summary";
import type { useCart } from "@/hooks/use-cart";
import type { UseCheckoutState } from "@/hooks/use-checkout";
import { formatArs } from "./currency";

interface CartDrawerProps {
  cart: ReturnType<typeof useCart>;
  checkout: UseCheckoutState;
  deliveryFeeArs: number;
  /** Same catalog rows OrderBuilder already passes to useCart -- reused
   * here (via OrderPriceCalculator's existing static methods, not new
   * logic) to show a per-line price, the same way a printed menu row
   * shows name -> leader dots -> price. */
  meatExtra: { price: number } | null;
  friesExtra: { price: number } | null;
}

// One row per cart item: icon, "{qty}x {name}" connected to its price by
// leader dots (menu-leader -- the same "printed menu" pattern the browsing
// rows in burger-picker.tsx/combo-picker.tsx/side-picker.tsx already use,
// reused here so the cart reads as the same list, not a smaller/different
// one), and a secondary customization line when there is one. Deliberately
// does NOT truncate the name: the picker truncates because that row is a
// control competing with a stepper for width, with the full detail one tap
// away in its expanded panel. This is the final review screen before the
// WhatsApp handoff -- there's no "expand" here, so clipping with "…" would
// hide exactly the detail the cart exists to surface. Let it wrap instead.
function CartLine({
  icon: Icon,
  label,
  price,
  summary,
}: {
  icon: LucideIcon;
  label: string;
  price: number;
  summary: string | null;
}) {
  return (
    <div className="flex items-start gap-3">
      <Icon className="mt-1 size-4 shrink-0 text-[var(--cheddar)]" aria-hidden />
      <div className="min-w-0 flex-1">
        <div className="flex items-baseline">
          <span className="font-condensed text-[1.05rem] font-bold tracking-[.03em] text-[var(--cream)] uppercase">
            {label}
          </span>
          <span className="menu-leader" aria-hidden />
          <span className="numeric shrink-0 font-condensed text-[1.05rem] font-bold text-[var(--cheddar)]">
            {formatArs(price)}
          </span>
        </div>
        {summary && (
          <p className="mt-0.5 font-body text-[13px] leading-snug text-[var(--ash-bright)]">
            {summary}
          </p>
        )}
      </div>
    </div>
  );
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
export function CartDrawer({
  cart,
  checkout,
  deliveryFeeArs,
  meatExtra,
  friesExtra,
}: CartDrawerProps) {
  const { burgers, combos, sides, itemCount, isEmpty, total } = cart;
  // The rail is a persistent trigger, not part of the Drawer's own portal --
  // without tracking `open` here, it stays visible (and stacked on the same
  // z-index) behind the open sheet, reading as a second, washed-out "ver
  // pedido" bar fighting the drawer's own footer for the same space.
  const [open, setOpen] = useState(false);

  return (
    <Drawer open={open} onOpenChange={setOpen}>
      <DrawerTrigger asChild>
        <button
          type="button"
          // disabled:opacity-45 vivía en el <button> entero -- eso incluye
          // diner-rail (el fondo casi opaco de la barra), así que un
          // carrito vacío bajaba la opacidad de TODA la barra al 45% y
          // dejaba ver el contenido de la página de atrás con claridad
          // (reportado real, con screenshot: texto de la sección de menú
          // superpuesto con "Tu pedido"/"Carrito vacío"). El estado
          // "no accionable" ahora se comunica solo en la píldora "Ver
          // pedido", no en el fondo de la barra entera.
          className="diner-rail group transition-opacity duration-150 data-[open=true]:pointer-events-none data-[open=true]:opacity-0"
          data-open={open}
          disabled={isEmpty}
        >
          <div className="diner-wrap flex h-full items-center gap-4">
            <div className="min-w-0 text-left">
              <span className="diner-rail-k block">Tu pedido</span>
              <span className="diner-rail-v block truncate">
                {itemCount > 0 ? `${itemCount} · ${formatArs(total)}` : "Carrito vacío"}
              </span>
            </div>
            {/* diner-cta-glow: glow ambiente permanente, no solo al hover --
                es el CTA de conversión del rail fijo (apple-design §16.6,
                ver comentario de la utility en globals.css). El
                group-disabled:opacity-45 ya existente atenúa el glow junto
                con el resto del botón cuando el carrito está vacío. */}
            <span className="diner-btn diner-btn-primary diner-cta-glow pointer-events-none ml-auto group-disabled:opacity-45">
              <MessageCircle className="size-4" aria-hidden />
              Ver pedido
            </span>
          </div>
        </button>
      </DrawerTrigger>
      <DrawerContent>
        <DrawerHeader className="diner-wrap">
          <DrawerTitle className="font-display text-xl text-[var(--cream)]">
            Tu pedido
          </DrawerTitle>
          <DrawerDescription>
            Este total es orientativo -- se confirma al enviar el pedido.
          </DrawerDescription>
        </DrawerHeader>

        {/* Una sola región scrolleable (antes la lista tenía su propio
            max-h-[50vh] separado del panel de checkout -- con el ticket más
            alto por header+cajas de input+totales, eso podía dejar el
            botón de confirmar fuera de la pantalla sin forma de llegar a
            él en un teléfono chico). DrawerContent es flex-col con
            max-h-[80vh]; flex-1 min-h-0 acá deja header y footer fijos y
            todo lo del medio scrolleable. diner-wrap (no un px-4 suelto)
            porque el resto de la página entera usa ese mismo ancho
            centrado (min(1080px,92vw)).

            En desktop, lista y ticket van en dos columnas en vez de
            apiladas: en una sola columna angosta (diner-wrap tope 1080px)
            el ticket -- con su propio padding/campos/botón -- ocupaba
            mucho más alto que la lista de ítems, y el detalle de
            personalización de cada línea quedaba comprimido arriba del
            todo, chico en comparación. Repartiendo el ancho, la lista
            respira en su propia columna y el ticket no tiene que competir
            por el mismo carril vertical. En mobile (`md:` para abajo)
            siguen apiladas como antes -- dos columnas angostas en un
            teléfono serían peor, no mejor. */}
        <div className="diner-wrap min-h-0 flex-1 overflow-y-auto">
          <div className="grid gap-6 md:grid-cols-[1fr_380px] md:items-start">
            <div>
              <p className="mb-3 font-condensed text-xs font-bold tracking-[.16em] text-[var(--ash)] uppercase">
                Detalle
              </p>
              <div className="space-y-3">
                {isEmpty && (
                  <p className="text-muted-foreground text-subheadline">
                    Todavia no agregaste nada.
                  </p>
                )}

                {burgers.selectedBurgers.map((item) => (
                  <CartLine
                    key={item.id}
                    icon={Sandwich}
                    label={`${item.quantity}x ${item.burger.name}`}
                    price={OrderPriceCalculator.calculateBurgersTotal([item], friesExtra)}
                    summary={summarizeBurger(item)}
                  />
                ))}

                {combos.selectedCombos.map((instance) => (
                  <CartLine
                    key={instance.id}
                    icon={UtensilsCrossed}
                    label={`${instance.quantity}x ${instance.combo.name}`}
                    price={OrderPriceCalculator.calculateCombosTotal(
                      [instance],
                      meatExtra,
                      friesExtra,
                    )}
                    summary={summarizeCombo(instance)}
                  />
                ))}

                {sides.selectedSides.map((side) => (
                  <CartLine
                    key={side.id}
                    icon={side.extra.category === "drink" ? CupSoda : Utensils}
                    label={`${side.quantity}x ${side.extra.name}`}
                    price={
                      side.extra.price * side.quantity +
                      side.selectedExtras.reduce(
                        (sum, e) => sum + e.extra.price * e.quantity,
                        0,
                      )
                    }
                    summary={summarizeSide(side)}
                  />
                ))}
              </div>
            </div>

            <CheckoutPanel cart={cart} checkout={checkout} deliveryFeeArs={deliveryFeeArs} />
          </div>
        </div>

        {/* El total ahora vive dentro del ticket de CheckoutPanel (Subtotal
            / Envío / Total, como un recibo real) -- acá solo queda cerrar
            el carrito, sin un segundo total compitiendo en otro sistema
            visual (oscuro/cheddar) a metros del ticket de papel. */}
        <DrawerFooter className="diner-wrap">
          <DrawerClose asChild>
            <Button variant="outline">Seguir eligiendo</Button>
          </DrawerClose>
        </DrawerFooter>
      </DrawerContent>
    </Drawer>
  );
}
