"use client";

import { useMemo, useState } from "react";

export type FulfillmentType = "pickup" | "delivery";

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
   * UI-only presence guard mirroring spec.md's Domain 3 rejection scenario
   * ("Delivery cannot be confirmed without phone and address"). This is a
   * simple presence check, not business validation -- the server (WU4) is
   * the real enforcement boundary (design.md's R11 invariant + the
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

  const canConfirm = useMemo(() => {
    if (fulfillmentType === "pickup") return true;
    return phone.trim().length > 0 && address.trim().length > 0;
  }, [fulfillmentType, phone, address]);

  return {
    fulfillmentType,
    setFulfillmentType,
    phone,
    setPhone,
    address,
    setAddress,
    notes,
    setNotes,
    canConfirm,
  };
}
