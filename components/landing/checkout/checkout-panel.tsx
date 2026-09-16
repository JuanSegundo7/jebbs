"use client";

import type { useCart } from "@/hooks/use-cart";
import type { UseCheckoutState } from "@/hooks/use-checkout";
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
    <div className="ios-glass space-y-4 rounded-2xl p-4">
      <CustomerNameField value={customerName} onChange={setCustomerName} />

      <FulfillmentToggle value={fulfillmentType} onChange={setFulfillmentType} />

      {isDelivery && (
        <DeliveryDetailsForm
          phone={phone}
          onPhoneChange={setPhone}
          address={address}
          onAddressChange={setAddress}
          notes={notes}
          onNotesChange={setNotes}
        />
      )}

      {isDelivery && <DeliveryFeeLine deliveryFeeArs={deliveryFeeArs} />}

      <ConfirmButton cart={cart} checkout={checkout} />
    </div>
  );
}
