"use client";

import { useEffect, useRef, useState } from "react";
import {
  ArrowLeft,
  ChevronRight,
  CupSoda,
  Receipt,
  Sandwich,
  Utensils,
  UtensilsCrossed,
  X,
} from "lucide-react";
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
import { ConfirmButton } from "@/components/landing/checkout/confirm-button";
import { CustomerDetailsPanel } from "@/components/landing/checkout/customer-details-panel";
import { OrderPreferences } from "@/components/landing/checkout/order-preferences";
import { OrderPriceCalculator } from "@/lib/order/price-calculator";
import {
  isMeatCountCustomized,
  meatCountLabel,
  summarizeBurger,
  summarizeCombo,
  summarizeSide,
} from "@/lib/order/customization-summary";
import { cn } from "@/lib/utils";
import type { useCart } from "@/hooks/use-cart";
import type { UseCheckoutState } from "@/hooks/use-checkout";
import type { DeliveryZone, Extra } from "@/lib/types";
import { BurgerCustomizePanel } from "./burger-customize-panel";
import { CartItemRow } from "./cart-item-row";
import { CartUpsell } from "./cart-upsell";
import { formatArs } from "./currency";

interface CartDrawerProps {
  cart: ReturnType<typeof useCart>;
  checkout: UseCheckoutState;
  /** Resolved fee for the customer's chosen zone (or 0 while pending) --
   * see order-builder.tsx, which computes this via resolveDeliveryFee. Not
   * the flat catalog value anymore. */
  deliveryFeeArs: number;
  /** See delivery-fee-line.tsx's `pending` prop for the same contract. */
  deliveryFeePending: boolean;
  /** Active zones for DeliveryZonePicker, threaded to order-preferences.tsx. */
  deliveryZones: DeliveryZone[];
  /** Cheapest active zone's fee, for the fulfillment toggle's "desde" label. */
  minDeliveryFeeArs: number | null;
  /** Same catalog rows OrderBuilder already passes to useCart -- reused
   * here (via OrderPriceCalculator's existing static methods, not new
   * logic) to show a per-line price, the same way a printed menu row
   * shows name -> leader dots -> price. */
  meatExtra: { price: number } | null;
  friesExtra: { price: number } | null;
  /** Needed only to reopen BurgerCustomizePanel from a cart row's "Editar"
   * -- same list OrderBuilder already threads into BurgerPicker. */
  toppingExtras: Extra[];
  /** Drinks/sides not already in the cart, for the "¿Le sumás algo?" block
   * -- OrderBuilder computes this once (drinksAndSides filtered against
   * cart.sides.selectedSides), no new catalog fetch needed. */
  upsellExtras: Extra[];
}

// Mismo string que "Agregar al pedido" en menu-item-sheet.tsx -- NO usar
// diner-btn/diner-btn-primary (globals.css): esa utility sigue con la
// paleta vieja (--cheddar, no retinteada) y no tiene consumidores reales en
// ningún componente hoy, solo un comentario stale.
const PRIMARY_BUTTON_CLASS =
  "inline-flex w-full items-center justify-center gap-[9px] rounded-lg bg-[var(--accent-brand)] px-[22px] py-[13px] font-condensed text-[1.06rem] font-bold tracking-[0.08em] text-[var(--accent-contrast)] uppercase shadow-[var(--shadow-sm)] transition-[background-color,box-shadow,transform] duration-150 hover:bg-[var(--accent-hover)] hover:shadow-[var(--shadow-md)] active:scale-[0.97] disabled:pointer-events-none disabled:opacity-45";

// The cart is a 2-step wizard: paso 1 "Tu pedido" (lista + "¿Le sumás
// algo?" + Retiro/Envío + Efectivo/Transferencia -- estos dos toggles
// quedan acá porque cambian el Total que se ve) y paso 2 "Tus datos"
// (identidad + entrega + Subtotal/Envío + confirmar). Reemplaza la vista
// de scroll único anterior, donde el ticket con envío necesitaba su propio
// scroll (nombre + 2 toggles + teléfono + dirección + referencia +
// subtotal, todo apilado en una columna de 380px).
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
  deliveryFeePending,
  deliveryZones,
  minDeliveryFeeArs,
  meatExtra,
  friesExtra,
  toppingExtras,
  upsellExtras,
}: CartDrawerProps) {
  const { burgers, combos, sides, itemCount, isEmpty, total } = cart;
  // The rail is a persistent trigger, not part of the Drawer's own portal --
  // without tracking `open` here, it stays visible (and stacked on the same
  // z-index) behind the open sheet, reading as a second, washed-out "ver
  // pedido" bar fighting the drawer's own footer for the same space.
  const [open, setOpen] = useState(false);

  const [step, setStep] = useState<1 | 2>(1);
  const [direction, setDirection] = useState<"forward" | "back">("forward");
  // Vaciar el carrito estando en el paso 2 (se puede: borrar el último
  // ítem ahí) vuelve al paso 1 -- no tiene sentido pedir datos para un
  // pedido vacío.
  const currentStep = isEmpty ? 1 : step;

  const handleOpenChange = (next: boolean) => {
    setOpen(next);
    // Reseteo al ABRIR, no al cerrar: si reseteara al cerrar, alguien que
    // cierra desde el paso 2 vería el sheet "flashear" de vuelta al paso 1
    // mientras todavía se está animando hacia afuera (~300ms de exit de
    // vaul, drawer.tsx). Reseteando al abrir el resultado observable es el
    // mismo (siempre arranca en el paso 1) sin ese parpadeo.
    if (next) {
      setStep(1);
      setDirection("forward");
    }
  };

  const goToStep = (next: 1 | 2) => {
    setDirection(next > currentStep ? "forward" : "back");
    setStep(next);
  };

  // Al cambiar de paso: la región de scroll (compartida entre los dos
  // pasos) vuelve arriba -- si no, se podría llegar al paso 2 a mitad de
  // un scroll largo de la lista -- y el foco se mueve a la región del
  // paso, no al input de nombre (eso abriría el teclado en mobile sin que
  // el usuario haya tocado nada).
  const scrollRef = useRef<HTMLDivElement>(null);
  const stepRegionRef = useRef<HTMLDivElement>(null);
  const isFirstRender = useRef(true);
  useEffect(() => {
    if (isFirstRender.current) {
      isFirstRender.current = false;
      return;
    }
    // scrollTop = 0, no scrollTo({top:0}) -- jsdom (los tests) no implementa
    // Element.scrollTo, y esto logra exactamente lo mismo sin depender de
    // un método que no está en todos lados.
    if (scrollRef.current) scrollRef.current.scrollTop = 0;
    stepRegionRef.current?.focus();
  }, [currentStep]);

  return (
    <Drawer open={open} onOpenChange={handleOpenChange}>
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
          // Re-estilo a la identidad real: `diner-rail` (fondo negro/mostaza a
          // mano + blur hecho a mano) se reemplaza por `material-regular`
          // (mismo criterio que site-header.tsx) + posicionamiento fijo
          // literal, ya que la posición/altura no son parte del vocabulario
          // de color/material.
          className="material-regular group fixed inset-x-0 bottom-0 z-50 h-[var(--rail-h)] transition-opacity duration-150 data-[open=true]:pointer-events-none data-[open=true]:opacity-0"
          data-open={open}
          disabled={isEmpty}
        >
          <div className="diner-wrap flex h-full items-center gap-4">
            <div className="min-w-0 text-left">
              <span className="font-condensed block text-[0.8rem] font-semibold tracking-[.16em] text-[var(--muted-foreground)] uppercase">
                Tu pedido
              </span>
              <span className="numeric block truncate font-condensed text-[1.28rem] font-bold text-[var(--foreground)]">
                {itemCount > 0 ? `${itemCount} · ${formatArs(total)}` : "Carrito vacío"}
              </span>
            </div>
            {/* Glow ambiente permanente, no solo al hover -- es el CTA de
                conversión del rail fijo (apple-design §16.6), mismo
                tratamiento que el CTA del hero (hero.tsx). El
                group-disabled:opacity-45 ya existente atenúa el glow junto
                con el resto del botón cuando el carrito está vacío. */}
            <span className="pointer-events-none ml-auto inline-flex items-center gap-[9px] rounded-lg bg-[var(--accent-brand)] px-[22px] py-[13px] font-condensed text-[1.06rem] font-bold tracking-[0.08em] text-[var(--accent-contrast)] uppercase shadow-[var(--shadow-md),0_0_32px_-8px_rgba(255,159,10,.35)] transition-[background-color,box-shadow,transform] duration-150 group-disabled:opacity-45 hover:bg-[var(--accent-hover)] active:scale-[0.97]">
              <Receipt className="size-4" aria-hidden />
              Ver pedido
            </span>
          </div>
        </button>
      </DrawerTrigger>
      <DrawerContent variant="dialog">
        {/* El drawer ocupa todo el ancho del viewport en desktop (se probó
            acotarlo a ~900px centrado y no era lo que se quería: "sigue
            sin tener el width completo de toda la pantalla" -- feedback
            real). diner-wrap centra a min(1080px,92vw), el mismo ancho de
            lectura que usa el resto de la página, dentro de un drawer que
            sí ocupa el viewport completo. */}
        {/* md:text-center pisa el md:text-left de base de DrawerHeader
            (drawer.tsx) -- ese left-align tenía sentido cuando el paso
            todavía era una grilla de 2 columnas; ahora los dos pasos son de
            una sola columna centrada, así que el título tiene que quedar
            centrado sobre el contenido, no pegado a su borde izquierdo
            (feedback real: "no esta todo centrado"). */}
        <DrawerHeader className="diner-wrap relative md:text-center">
          <p className="font-condensed text-xs font-bold tracking-[.16em] text-[var(--muted-foreground)] uppercase">
            Paso {currentStep} de 2
          </p>
          <DrawerTitle className="font-condensed text-[1.35rem] font-bold tracking-[.06em] text-[var(--foreground)] uppercase">
            {currentStep === 1 ? "Tu pedido" : "Tus datos"}
          </DrawerTitle>
          {currentStep === 2 && (
            <button
              type="button"
              className="absolute top-4 left-4 inline-flex size-8 items-center justify-center rounded-full text-[var(--muted-foreground)] transition-colors hover:bg-[var(--surface-2)] hover:text-[var(--foreground)]"
              onClick={() => goToStep(1)}
            >
              <ArrowLeft className="size-4" aria-hidden />
              <span className="sr-only">Volver al detalle</span>
            </button>
          )}
          {/* La X para cerrar el drawer entero -- distinta de "Volver"
              arriba (un paso atrás, se queda en el drawer). En todas las
              resoluciones: la barrita de arrastre se oculta en desktop
              (variant="dialog" en drawer.tsx) pero un cierre explícito
              nunca está de más y en mobile convive con el drag sin
              competir. */}
          <DrawerClose className="absolute top-4 right-4 inline-flex size-8 items-center justify-center rounded-full text-[var(--muted-foreground)] transition-colors hover:bg-[var(--surface-2)] hover:text-[var(--foreground)]">
            <X className="size-4" aria-hidden />
            <span className="sr-only">Cerrar</span>
          </DrawerClose>
        </DrawerHeader>

        {/* Una sola región scrolleable compartida por los dos pasos.
            min-h-[55vh]/md:min-h-[45vh] para que el sheet no cambie
            bruscamente de alto al pasar de un paso 1 largo a un paso 2
            corto. DrawerContent es flex-col con max-h-[80vh]; flex-1
            min-h-0 acá deja header y footer fijos y todo lo del medio
            scrolleable. diner-wrap porque el resto de la página entera
            usa ese mismo ancho centrado (min(1080px,92vw)). */}
        <div
          ref={scrollRef}
          className="diner-wrap min-h-[55vh] flex-1 overflow-y-auto pb-4 md:min-h-[45vh]"
        >
          {/* key={currentStep} monta una región nueva por paso -- el
              slide-in/fade-in de abajo se dispara en cada cambio, con la
              curva espejada según la dirección (apple-design §7). No hay
              librería de animación en el repo (solo tw-animate-css) y esto
              es una transición discreta por botón, no un gesto -- un
              slide-in de Tailwind es la herramienta correcta acá.
              motion-reduce:animate-none explícito porque la regla global
              de prefers-reduced-motion solo acorta duración, no neutraliza
              keyframes. */}
          <div
            key={currentStep}
            ref={stepRegionRef}
            tabIndex={-1}
            aria-label={currentStep === 1 ? "Paso 1 de 2 — Tu pedido" : "Paso 2 de 2 — Tus datos"}
            className={cn(
              "outline-none animate-in fade-in-0 duration-200 motion-reduce:animate-none",
              direction === "forward"
                ? "slide-in-from-right-4 ease-[cubic-bezier(0.16,1,0.3,1)]"
                : "slide-in-from-left-4 ease-[cubic-bezier(0.7,0,0.84,0)]",
            )}
          >
            {currentStep === 1 ? (
              // Una sola columna en mobile y desktop -- feedback real: los
              // dos toggles de "¿Cómo lo querés?" van al final, debajo del
              // upsell/"Seguir eligiendo", no al costado de la lista. El
              // orden de stack es lista -> upsell -> "Seguir eligiendo" ->
              // preferencias.
              <div className="space-y-6">
                <div>
                  <p className="mb-3 font-condensed text-xs font-bold tracking-[.16em] text-[var(--muted-foreground)] uppercase">
                    Detalle
                  </p>
                  <div className="space-y-3">
                    {isEmpty && (
                      <p className="text-muted-foreground text-subheadline">
                        Todavia no agregaste nada.
                      </p>
                    )}

                    {burgers.selectedBurgers.map((item) => {
                      const expanded = burgers.expandedBurger === item.id;
                      // Meat count promoted into the NAME, not left as a
                      // buried "5 carnes" note in the summary line -- the
                      // menu already names burgers by patty count ("Triple
                      // Jebbs" = 3), so a customer who bumps the count to 5
                      // reads "Triple Jebbs (Quíntuple)" instead of a
                      // stale "Triple" label with the real count hidden
                      // below (real feedback, screenshot of exactly this).
                      // includeMeatCount: false on the summary so it isn't
                      // shown twice.
                      const name = isMeatCountCustomized(item)
                        ? `${item.burger.name} (${meatCountLabel(item.meatCount)})`
                        : item.burger.name;
                      return (
                        <CartItemRow
                          key={item.id}
                          icon={Sandwich}
                          name={name}
                          quantity={item.quantity}
                          price={OrderPriceCalculator.calculateBurgersTotal([item], friesExtra)}
                          summary={summarizeBurger(item, { includeMeatCount: false })}
                          onIncrement={() => burgers.updateQuantity(item.id, 1)}
                          onDecrement={() => burgers.updateQuantity(item.id, -1)}
                          onRemove={() => burgers.removeBurger(item.id)}
                          expandable
                          expanded={expanded}
                          onToggleExpanded={() => burgers.toggleExpanded(item.id)}
                        >
                          <BurgerCustomizePanel
                            item={item}
                            toppingExtras={toppingExtras}
                            onMeatChange={(delta) => burgers.updateMeatCount(item.id, delta)}
                            onFriesChange={(delta) => burgers.updateFriesQuantity(item.id, delta)}
                            onToggleVeggie={() => burgers.toggleVeggie(item.id)}
                            onToggleExtra={(extra) => burgers.toggleExtra(item.id, extra)}
                            onExtraQuantityChange={(extraId, delta) =>
                              burgers.updateExtraQuantity(item.id, extraId, delta)
                            }
                          />
                        </CartItemRow>
                      );
                    })}

                    {combos.selectedCombos.map((instance) => (
                      <CartItemRow
                        key={instance.id}
                        icon={UtensilsCrossed}
                        name={instance.combo.name}
                        quantity={instance.quantity}
                        price={OrderPriceCalculator.calculateCombosTotal(
                          [instance],
                          meatExtra,
                          friesExtra,
                        )}
                        summary={summarizeCombo(instance)}
                        onIncrement={() => combos.updateComboQuantity(instance.id, 1)}
                        onDecrement={() => combos.updateComboQuantity(instance.id, -1)}
                        onRemove={() => combos.removeCombo(instance.id)}
                      />
                    ))}

                    {sides.selectedSides.map((side) => (
                      <CartItemRow
                        key={side.id}
                        icon={side.extra.category === "drink" ? CupSoda : Utensils}
                        name={side.extra.name}
                        quantity={side.quantity}
                        price={
                          side.extra.price * side.quantity +
                          side.selectedExtras.reduce(
                            (sum, e) => sum + e.extra.price * e.quantity,
                            0,
                          )
                        }
                        summary={summarizeSide(side)}
                        onIncrement={() => sides.updateQuantity(side.id, 1)}
                        onDecrement={() => sides.updateQuantity(side.id, -1)}
                        onRemove={() => sides.removeSide(side.id)}
                      />
                    ))}
                  </div>
                </div>

                {/* Antes del upsell -- feedback real. Cambia el Total, así
                    que sigue en el paso 1, pero ya no compite por espacio
                    con el detalle del pedido. */}
                <OrderPreferences
                  checkout={checkout}
                  deliveryZones={deliveryZones}
                  minDeliveryFeeArs={minDeliveryFeeArs}
                />

                {/* Al final del todo -- feedback real ("le sumás algo" abajo
                    de todo). */}
                <div>
                  {!isEmpty && <CartUpsell extras={upsellExtras} onAdd={sides.addSide} />}

                  {/* Chico y debajo del upsell, no un botón a todo el ancho
                      en el footer -- es la acción secundaria, no debería
                      pesar más que "Continuar" (feedback real). Solo en el
                      paso 1: en el paso 2 sería una tercera salida ambigua
                      ("¿esto guarda lo que tipeé?"). */}
                  <DrawerClose asChild>
                    <button
                      type="button"
                      className="mt-3 font-body text-xs text-[var(--muted-foreground)] underline underline-offset-2 transition-colors hover:text-[var(--foreground)]"
                    >
                      Seguir eligiendo
                    </button>
                  </DrawerClose>
                </div>
              </div>
            ) : (
              // Paso 2 = solo el ticket -- ya se vio el detalle del pedido
              // en el paso 1, repetirlo acá era ancho perdido (feedback
              // real). Centrado con un tope de ancho en desktop: un ticket
              // a todo el ancho del drawer se ve raro (es una superficie de
              // recibo, no un formulario de página completa).
              <div className="md:mx-auto md:max-w-[480px]">
                <CustomerDetailsPanel
                  cart={cart}
                  checkout={checkout}
                  deliveryFeeArs={deliveryFeeArs}
                  deliveryFeePending={deliveryFeePending}
                />
              </div>
            )}
          </div>
        </div>

        {/* Total + acción del paso viven afuera de la región con scroll --
            siempre a mano en los dos pasos (feedback real: fijo abajo en
            mobile). material-thick va en el DrawerFooter (todo el ancho
            del drawer) -- diner-wrap va en el div de adentro, para que el
            contenido respire al mismo ancho de lectura que el resto de la
            página sin recortar el fondo. */}
        <DrawerFooter className="material-thick gap-0 border-t border-[var(--hairline)] p-0 pb-[env(safe-area-inset-bottom)]">
          <div className="diner-wrap flex flex-col gap-3 py-4">
            <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
              <span className="numeric font-condensed text-[1.15rem] font-bold tracking-[.04em] text-[var(--accent-brand)] uppercase">
                Total {formatArs(total)}
              </span>
              <div className="md:w-[280px]">
                {currentStep === 1 ? (
                  <button
                    type="button"
                    className={PRIMARY_BUTTON_CLASS}
                    disabled={isEmpty}
                    onClick={() => {
                      // Never silently advance with a delivery order that
                      // hasn't answered the zone question -- resolveDeliveryFee
                      // treats "didn't touch the picker" the same as "picked
                      // no encuentro mi zona" (both are deliveryZoneId ===
                      // null), so skipping this check would let a customer
                      // land on step 2 seeing "Envío: A confirmar" without
                      // ever having made that choice. Same tap-to-flag
                      // pattern as ConfirmButton in step 2: never disable the
                      // button, flag + focus what's missing instead.
                      if (checkout.missingFields.includes("zone")) {
                        checkout.requestValidation();
                        document.getElementById("checkout-delivery-zone")?.focus();
                        return;
                      }
                      goToStep(2);
                    }}
                  >
                    Continuar
                    <ChevronRight className="size-4" aria-hidden />
                  </button>
                ) : (
                  <ConfirmButton
                    cart={cart}
                    checkout={{
                      ...checkout,
                      // "zone" is only ever rendered in step 1
                      // (order-preferences.tsx) -- a failed validation
                      // that's missing it must bounce back there, or the
                      // focus-walk effect in customer-details-panel.tsx
                      // tries document.getElementById() for a field that
                      // isn't even mounted on step 2 and silently does
                      // nothing, leaving the customer stuck.
                      requestValidation: () => {
                        const ok = checkout.requestValidation();
                        if (!ok && checkout.missingFields.includes("zone")) {
                          goToStep(1);
                        }
                        return ok;
                      },
                    }}
                  />
                )}
              </div>
            </div>
            {/* Raya (—), no doble guion -- y acá abajo, junto al total/
                botón, que es donde el usuario la necesita. Sin condicionar
                por paso: es lo que le da a vaul/Radix el aria-describedby
                del diálogo entero, y la frase es igual de cierta en los
                dos pasos. */}
            <DrawerDescription className="text-center font-body text-[11px] text-[var(--muted-foreground)] md:text-right">
              Este total es orientativo — se confirma al enviar el pedido.
            </DrawerDescription>
          </div>
        </DrawerFooter>
      </DrawerContent>
    </Drawer>
  );
}
