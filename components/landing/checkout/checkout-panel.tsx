"use client";

import { Button } from "@/components/ui/button";
import type { UseCheckoutState } from "@/hooks/use-checkout";
import { useSingleFlight } from "@/hooks/use-single-flight";
import { DeliveryDetailsForm } from "./delivery-details-form";
import { DeliveryFeeLine } from "./delivery-fee-line";
import { FulfillmentToggle } from "./fulfillment-toggle";

interface CheckoutPanelProps {
  checkout: UseCheckoutState;
  deliveryFeeArs: number;
  /**
   * WU4 (R14 mitigation): wired through useSingleFlight below, so a
   * double-tap while a previous call is in flight is a no-op and the
   * button disables itself for the duration. Optional and a no-op by
   * default -- WU5's confirm-button.tsx (tasks.md 7.4) is expected to pass
   * the real POST /api/orders + WhatsApp-redirect handler in here once
   * lib/utils/format-order-whatsapp.ts exists; there is no customer-name or
   * payment-method UI field yet to build that request body from, so this
   * lot does not invent one.
   */
  onConfirm?: () => void | Promise<void>;
}

// WU3b (tasks.md Phase 5): pickup/delivery toggle + conditional delivery
// form + fee line + the client-side guard on "Confirmar pedido". This is
// the UI half of spec.md's Domain 3 rejection scenario -- WU4's zod
// .refine (PHONE_REQUIRED_FOR_DELIVERY) and the R11 insert invariant are
// the real enforcement; this only disables the button so a visitor can't
// even attempt to submit an incomplete delivery request. WU5's
// confirm-button.tsx (tasks.md 7.4) replaces this bare <Button> with the
// real single-flight POST /api/orders + WhatsApp handoff -- WU4 adds the
// single-flight/disabled-while-in-flight MECHANISM (R14) via
// useSingleFlight, ready for that handler to plug into `onConfirm`.
export function CheckoutPanel({ checkout, deliveryFeeArs, onConfirm }: CheckoutPanelProps) {
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

  const { run, isPending } = useSingleFlight(async () => {
    await onConfirm?.();
  });

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

      <Button className="w-full" disabled={!canConfirm || isPending} onClick={() => run()}>
        Confirmar pedido
      </Button>
    </div>
  );
}
