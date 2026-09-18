"use client";

import type { useCart } from "@/hooks/use-cart";
import type { UseCheckoutState } from "@/hooks/use-checkout";
import { formatArs } from "@/components/landing/order-builder/currency";
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
// Checkout card in the same dark/cheddar identity as the rest of the
// page (2nd revision -- the light "paper ticket" faithful to the
// reference site read as a jarring white rectangle against the coal
// background regardless of exact tone, per real feedback). The totals
// block (Subtotal/Envío/Total) lives INSIDE the card -- it used to live
// in cart-drawer.tsx's DrawerFooter, which read as two competing totals
// in two different visual systems. None of the selection/validation
// logic moved.
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
  const fee = isDelivery ? deliveryFeeArs : 0;

  return (
    <div className="diner-ticket">
      <header>
        <h3 className="diner-ticket-title">Jebb&apos;s Burger&apos;s</h3>
        <p className="diner-ticket-sub">Comprobante de pedido</p>
      </header>
      <hr className="diner-rule" />

      <CustomerNameField value={customerName} onChange={setCustomerName} />

      <div className="diner-field">
        <FulfillmentToggle value={fulfillmentType} onChange={setFulfillmentType} />
      </div>

      {isDelivery && (
        <>
          <hr className="diner-rule" />
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

      <hr className="diner-rule" />
      <div className="space-y-1.5 font-body text-sm text-[var(--cream)]">
        <div className="flex items-center justify-between">
          <span>Subtotal</span>
          <span className="numeric">{formatArs(cart.total)}</span>
        </div>
        {isDelivery && <DeliveryFeeLine deliveryFeeArs={deliveryFeeArs} />}
        <div className="diner-ttot pt-1">
          <span>Total</span>
          <span className="numeric">{formatArs(cart.total + fee)}</span>
        </div>
      </div>

      <ConfirmButton cart={cart} checkout={checkout} />
    </div>
  );
}
