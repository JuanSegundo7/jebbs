"use client";

import type { useCart } from "@/hooks/use-cart";
import type { UseCheckoutState } from "@/hooks/use-checkout";
import { Separator } from "@/components/ui/separator";
import { ConfirmButton } from "./confirm-button";
import { CustomerNameField } from "./customer-name-field";
import { DeliveryDetailsForm } from "./delivery-details-form";
import { DeliveryFeeLine } from "./delivery-fee-line";
import { FulfillmentToggle } from "./fulfillment-toggle";

interface CheckoutPanelProps {
  cart: ReturnType<typeof useCart>;
  checkout: UseCheckoutState;
  deliveryFeeArs: number;
}

// WU3b (tasks.md Phase 5) built the pickup/delivery toggle + conditional
// delivery form + fee line. WU5 (tasks.md 7.4/7.8) replaces the bare
// placeholder <Button> that WU4 wired here (a local useSingleFlight() with
// an optional onConfirm callback and no real request body -- there was no
// customer-name field yet) with confirm-button.tsx: the real single-flight
// POST /api/orders + WhatsApp handoff, built from `cart` + `checkout`
// directly via lib/order/build-cart-request.ts.
//
// Restyled as a paper ticket (reference site: jebbs-burgers.vercel.app,
// checkout section): --paper background, Courier Prime, no glass/blur.
// Every child below only changed classes/styles -- none of the
// selection/validation logic moved.
export function CheckoutPanel({ cart, checkout, deliveryFeeArs }: CheckoutPanelProps) {
  const {
    fulfillmentType,
    setFulfillmentType,
    phone,
    setPhone,
    address,
    setAddress,
    notes,
    setNotes,
    customerName,
    setCustomerName,
  } = checkout;
  const isDelivery = fulfillmentType === "delivery";

  return (
    // ref-style.css:199-200 .ticket -- padding real 26px 24px 18px, sin
    // radio (el efecto "boleta" viene del .tear/box-shadow, no de un radio).
    <div className="diner-ticket space-y-4 px-6 pt-[26px] pb-[18px] shadow-[0_26px_60px_rgba(0,0,0,.6)]">
      <CustomerNameField value={customerName} onChange={setCustomerName} />

      <FulfillmentToggle value={fulfillmentType} onChange={setFulfillmentType} />

      {isDelivery && (
        <>
          <Separator className="bg-[var(--paper-line)]" />
          <DeliveryDetailsForm
            phone={phone}
            onPhoneChange={setPhone}
            address={address}
            onAddressChange={setAddress}
            notes={notes}
            onNotesChange={setNotes}
          />
        </>
      )}

      {isDelivery && <DeliveryFeeLine deliveryFeeArs={deliveryFeeArs} />}

      <Separator className="bg-[var(--paper-line)]" />

      <ConfirmButton cart={cart} checkout={checkout} />
    </div>
  );
}
