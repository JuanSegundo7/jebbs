"use client";

import { useMemo, useState } from "react";

export type FulfillmentType = "pickup" | "delivery";
export type PaymentMethod = "cash" | "transfer";
export type CheckoutField = "zone" | "name" | "phone" | "address";

export interface UseCheckoutState {
  fulfillmentType: FulfillmentType;
  setFulfillmentType: (type: FulfillmentType) => void;
  phone: string;
  setPhone: (value: string) => void;
  address: string;
  setAddress: (value: string) => void;
  notes: string;
  setNotes: (value: string) => void;
  /** null = not chosen yet. Setting a real id clears zoneNotListed (the two
   * are mutually exclusive -- see setZoneNotListed below). */
  deliveryZoneId: string | null;
  setDeliveryZoneId: (id: string | null) => void;
  /** True only when the customer explicitly picked "no encuentro mi zona"
   * in DeliveryZonePicker. Setting this to true clears deliveryZoneId. */
  zoneNotListed: boolean;
  setZoneNotListed: (value: boolean) => void;
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
  /** Fields currently missing/invalid for the active fulfillment type, in
   * the order they should be focused. Empty once canConfirm is true. */
  missingFields: CheckoutField[];
  /** Bumps every time requestValidation() finds something missing -- a
   * nonce, not a boolean, so a checkout-panel effect fires on EVERY failed
   * tap (the owner wants the button to re-focus the field each time it's
   * pressed while still invalid, not just the first time). */
  validationNonce: number;
  /** Call from the confirm button's onClick. Returns true (proceed) when
   * complete; otherwise bumps validationNonce and returns false. */
  requestValidation: () => boolean;
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
  const [deliveryZoneId, setDeliveryZoneIdState] = useState<string | null>(null);
  const [zoneNotListed, setZoneNotListedState] = useState(false);

  // Mutually exclusive by construction, not by convention at each call
  // site: picking a real zone always clears "no encuentro mi zona" and
  // vice versa, regardless of which setter the picker calls.
  const setDeliveryZoneId = (id: string | null) => {
    setDeliveryZoneIdState(id);
    if (id !== null) setZoneNotListedState(false);
  };
  const setZoneNotListed = (value: boolean) => {
    setZoneNotListedState(value);
    if (value) setDeliveryZoneIdState(null);
  };

  const missingFields = useMemo<CheckoutField[]>(() => {
    const missing: CheckoutField[] = [];
    // First -- it's the first thing the customer sees in step 1 of the
    // cart wizard (order-preferences.tsx), and requestValidation's focus
    // walk (customer-details-panel.tsx) focuses missingFields[0].
    if (fulfillmentType === "delivery" && !deliveryZoneId && !zoneNotListed) {
      missing.push("zone");
    }
    if (customerName.trim().length === 0) missing.push("name");
    if (fulfillmentType === "delivery") {
      if (phone.trim().length === 0) missing.push("phone");
      if (address.trim().length === 0) missing.push("address");
    }
    return missing;
  }, [customerName, fulfillmentType, phone, address, deliveryZoneId, zoneNotListed]);

  const canConfirm = missingFields.length === 0;

  const [validationNonce, setValidationNonce] = useState(0);

  const requestValidation = () => {
    if (missingFields.length === 0) return true;
    setValidationNonce((n) => n + 1);
    return false;
  };

  return {
    fulfillmentType,
    setFulfillmentType,
    phone,
    setPhone,
    address,
    setAddress,
    notes,
    setNotes,
    deliveryZoneId,
    setDeliveryZoneId,
    zoneNotListed,
    setZoneNotListed,
    customerName,
    setCustomerName,
    paymentMethod,
    setPaymentMethod,
    canConfirm,
    missingFields,
    validationNonce,
    requestValidation,
  };
}
