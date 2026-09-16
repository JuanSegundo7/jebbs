"use client";

import { useMemo, useState } from "react";

export type FulfillmentType = "pickup" | "delivery";
export type PaymentMethod = "cash" | "transfer";

export interface UseCheckoutState {
  fulfillmentType: FulfillmentType;
  setFulfillmentType: (type: FulfillmentType) => void;
  phone: string;
  setPhone: (value: string) => void;
  address: string;
  setAddress: (value: string) => void;
  notes: string;
  setNotes: (value: string) => void;
  /**
   * Required by CreateWebOrderSchema's `customer.name` for BOTH pickup and
   * delivery (lib/order/cart-request.ts) -- unlike phone/address, this is
   * not delivery-specific.
   */
  customerName: string;
  setCustomerName: (value: string) => void;
  paymentMethod: PaymentMethod;
  setPaymentMethod: (value: PaymentMethod) => void;
  /**
   * UI-only presence guard mirroring spec.md's Domain 3 rejection scenario
   * ("Delivery cannot be confirmed without phone and address") plus the
   * schema's unconditional `customer.name` requirement. This is a simple
   * presence check, not business validation -- the server (WU4) is the real
   * enforcement boundary (design.md's R11 invariant + the
   * `PHONE_REQUIRED_FOR_DELIVERY` zod refinement). Do not duplicate that
   * logic here.
   */
  canConfirm: boolean;
}

/**
 * Holds the checkout state (fulfillment type, delivery address/phone/notes)
 * so the parent order-builder can both render the checkout UI (WU3b) and
 * later feed it into `POST /api/orders` (WU4) and the WhatsApp handoff
 * (WU5) without re-plumbing new state through props.
 */
export function useCheckout(): UseCheckoutState {
  const [fulfillmentType, setFulfillmentType] =
    useState<FulfillmentType>("pickup");
  const [phone, setPhone] = useState("");
  const [address, setAddress] = useState("");
  const [notes, setNotes] = useState("");
  const [customerName, setCustomerName] = useState("");
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>("cash");

  const canConfirm = useMemo(() => {
    if (customerName.trim().length === 0) return false;
    if (fulfillmentType === "pickup") return true;
    return phone.trim().length > 0 && address.trim().length > 0;
  }, [customerName, fulfillmentType, phone, address]);

  return {
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
    paymentMethod,
    setPaymentMethod,
    canConfirm,
  };
}
