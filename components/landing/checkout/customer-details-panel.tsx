"use client";

import { useEffect, useRef } from "react";
import type { useCart } from "@/hooks/use-cart";
import type { CheckoutField, UseCheckoutState } from "@/hooks/use-checkout";
import { BRAND_NAME } from "@/lib/brand";
import { formatArs } from "@/components/landing/order-builder/currency";
import { CustomerNameField } from "./customer-name-field";
import { DeliveryDetailsForm } from "./delivery-details-form";
import { DeliveryFeeLine } from "./delivery-fee-line";

interface CustomerDetailsPanelProps {
  cart: ReturnType<typeof useCart>;
  checkout: UseCheckoutState;
  deliveryFeeArs: number;
  /** See delivery-fee-line.tsx's `pending` prop for the same contract. */
  deliveryFeePending?: boolean;
}

// Native ids over refs: all three already exist, are stable, and unique --
// there is exactly one CustomerDetailsPanel on the page, so the usual "ids
// aren't composable" objection doesn't apply. The alternative (threading
// refs through ConfirmButton -> CartDrawer -> this component) is a lot of
// plumbing for one .focus() call.
const FIELD_IDS: Record<CheckoutField, string> = {
  // "zone" lives in order-preferences.tsx (step 1), not this panel (step
  // 2) -- it can never actually be focused from here. cart-drawer.tsx
  // intercepts a failed requestValidation() while missingFields includes
  // "zone" and redirects to step 1 before this component's own focus-walk
  // effect ever runs, but the id still has to exist for the
  // Record<CheckoutField, string> contract below.
  zone: "checkout-delivery-zone",
  name: "checkout-customer-name",
  phone: "checkout-phone",
  address: "checkout-address",
};

// Step 2 of the cart wizard ("Tus datos") -- customer identity, delivery
// details, and the Subtotal/Envío breakdown. Was CheckoutPanel (renamed via
// git mv to keep blame): the fulfillment/payment toggles moved OUT, to
// order-preferences.tsx (step 1), since they change the total shown and the
// owner wanted them visible before committing to entering personal details.
//
// Checkout card in the same dark/cheddar identity as the rest of the
// page (2nd revision -- the light "paper ticket" faithful to the
// reference site read as a jarring white rectangle against the coal
// background regardless of exact tone, per real feedback). Subtotal/Envío
// (delivery-only) stay INSIDE the card -- the grand Total and the confirm
// button moved OUT, to cart-drawer.tsx's DrawerFooter, so they're always
// visible without scrolling (real feedback: "el total y el botón de
// confirmar deberían quedar fijos abajo"). None of the selection/
// validation logic moved.
export function CustomerDetailsPanel({
  cart,
  checkout,
  deliveryFeeArs,
  deliveryFeePending = false,
}: CustomerDetailsPanelProps) {
  const {
    fulfillmentType,
    phone,
    setPhone,
    address,
    setAddress,
    notes,
    setNotes,
    customerName,
    setCustomerName,
    missingFields,
    validationNonce,
  } = checkout;
  const isDelivery = fulfillmentType === "delivery";

  // Fires on every failed tap of the confirm button (validationNonce is a
  // nonce, not a boolean, precisely so this re-runs each time) -- focuses
  // the FIRST missing field, in the order name -> phone -> dirección.
  //
  // Guarded by handledNonce (not a plain "nonce === 0" check): this panel
  // now mounts/unmounts every time the wizard enters/leaves step 2. Without
  // the guard, a *previous* failed validation (nonce already > 0) would
  // steal focus again on every remount -- e.g. fail validation, tap Volver,
  // tap Continuar, and the phone field grabs focus / pops the mobile
  // keyboard even though the user hasn't touched the confirm button again.
  // Initializing the ref to the CURRENT nonce (not 0) means only a NEW
  // validation request (one that happens after this mount) triggers focus.
  const handledNonce = useRef(validationNonce);
  useEffect(() => {
    if (validationNonce === handledNonce.current) return;
    handledNonce.current = validationNonce;
    const first = missingFields[0];
    if (first) document.getElementById(FIELD_IDS[first])?.focus();
  }, [validationNonce, missingFields]);

  return (
    // Borde dentado (ticket-notched, globals.css) -- carácter de comanda
    // impresa (feedback real). --surface-2 (no --surface-1, el tono de
    // diner-sheet detrás) para que la superficie se note distinta del
    // fondo del drawer; si fueran el mismo tono el recorte sería invisible.
    <div className="ticket-notched relative bg-[var(--surface-2)] p-4 font-body text-[var(--foreground)] selection:bg-[var(--accent-brand)] selection:text-[var(--accent-contrast)]">
      <header>
        {/* font-condensed, no font-display -- tres familias compitiendo en
            una zona chica y densa se sentía como demasiado (feedback real).
            Jerarquía por peso/tracking/tamaño en vez de una tercera
            familia (apple-design §15). */}
        <h3 className="m-0 text-center font-condensed text-[0.95rem] font-bold tracking-[.14em] text-[var(--foreground)] uppercase">
          {BRAND_NAME}
        </h3>
        <p className="mt-[3px] text-center font-condensed text-[0.72rem] tracking-[.16em] text-[var(--muted-foreground)] uppercase">
          Comprobante de pedido
        </p>
      </header>
      <hr className="my-2.5 border-0 border-t border-[var(--hairline)]" />

      <CustomerNameField
        value={customerName}
        onChange={setCustomerName}
        invalid={validationNonce > 0 && missingFields.includes("name")}
      />

      {isDelivery && (
        <>
          <hr className="my-2.5 border-0 border-t border-[var(--hairline)]" />
          <DeliveryDetailsForm
            phone={phone}
            onPhoneChange={setPhone}
            address={address}
            onAddressChange={setAddress}
            notes={notes}
            onNotesChange={setNotes}
            phoneInvalid={validationNonce > 0 && missingFields.includes("phone")}
            addressInvalid={validationNonce > 0 && missingFields.includes("address")}
          />
        </>
      )}

      {/* Subtotal/Envío solo tienen sentido con envío -- con retiro no hay
          nada que mostrar acá, el Total (único monto relevante) vive en el
          footer fijo del drawer, no en el ticket. */}
      {isDelivery && (
        <>
          <hr className="my-2.5 border-0 border-t border-[var(--hairline)]" />
          <div className="space-y-1.5 font-body text-sm text-[var(--foreground)]">
            <div className="flex items-center justify-between">
              <span>Subtotal</span>
              <span className="numeric">{formatArs(cart.subtotal)}</span>
            </div>
            <DeliveryFeeLine deliveryFeeArs={deliveryFeeArs} pending={deliveryFeePending} />
            {deliveryFeePending && (
              <p className="font-body text-[11px] text-[var(--muted-foreground)]">
                Te confirmamos el costo de envío por WhatsApp antes de preparar el pedido.
              </p>
            )}
          </div>
        </>
      )}
    </div>
  );
}
