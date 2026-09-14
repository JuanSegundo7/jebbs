"use client";

import { Button } from "@/components/ui/button";
import type { UseCheckoutState } from "@/hooks/use-checkout";
import { DeliveryDetailsForm } from "./delivery-details-form";
import { DeliveryFeeLine } from "./delivery-fee-line";
import { FulfillmentToggle } from "./fulfillment-toggle";

interface CheckoutPanelProps {
  checkout: UseCheckoutState;
  deliveryFeeArs: number;
}

// WU3b (tasks.md Phase 5): pickup/delivery toggle + conditional delivery
// form + fee line + the client-side guard on "Confirmar pedido". This is
// the UI half of spec.md's Domain 3 rejection scenario -- WU4's zod
// .refine (PHONE_REQUIRED_FOR_DELIVERY) and the R11 insert invariant are
// the real enforcement; this only disables the button so a visitor can't
// even attempt to submit an incomplete delivery request. WU5's
// confirm-button.tsx (tasks.md 7.4) replaces this bare <Button> with the
// real single-flight POST /api/orders + WhatsApp handoff.
export function CheckoutPanel({ checkout, deliveryFeeArs }: CheckoutPanelProps) {
  const {
    fulfillmentType,
    setFulfillmentType,
    phone,
    setPhone,
    address,
    setAddress,
    notes,
    setNotes,
    canConfirm,
  } = checkout;
  const isDelivery = fulfillmentType === "delivery";

  return (
    <div className="ios-glass space-y-4 rounded-2xl p-4">
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

      <Button className="w-full" disabled={!canConfirm}>
        Confirmar pedido
      </Button>
    </div>
  );
}
