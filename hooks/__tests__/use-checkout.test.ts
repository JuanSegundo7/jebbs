import { act, renderHook } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { useCheckout } from "@/hooks/use-checkout";

// CreateWebOrderSchema (lib/order/cart-request.ts) requires customer.name
// for BOTH pickup and delivery, and payment_method for every order --
// canConfirm must reject an empty name regardless of fulfillment type,
// otherwise the client would let a visitor submit a request the server
// rejects with 400 VALIDATION_ERROR.
describe("useCheckout", () => {
  it("defaults: pickup, empty customerName, payment_method cash, canConfirm false", () => {
    const { result } = renderHook(() => useCheckout());

    expect(result.current.fulfillmentType).toBe("pickup");
    expect(result.current.customerName).toBe("");
    expect(result.current.paymentMethod).toBe("cash");
    expect(result.current.canConfirm).toBe(false);
  });

  it("pickup + customerName filled => canConfirm true", () => {
    const { result } = renderHook(() => useCheckout());

    act(() => result.current.setCustomerName("Juan"));

    expect(result.current.canConfirm).toBe(true);
  });

  it("pickup + blank/whitespace-only customerName => canConfirm false", () => {
    const { result } = renderHook(() => useCheckout());

    act(() => result.current.setCustomerName("   "));

    expect(result.current.canConfirm).toBe(false);
  });

  it("delivery + customerName but no phone/address => canConfirm false", () => {
    const { result } = renderHook(() => useCheckout());

    act(() => {
      result.current.setFulfillmentType("delivery");
      result.current.setCustomerName("Juan");
    });

    expect(result.current.canConfirm).toBe(false);
  });

  it("delivery + customerName + phone + address + zone => canConfirm true", () => {
    const { result } = renderHook(() => useCheckout());

    act(() => {
      result.current.setFulfillmentType("delivery");
      result.current.setCustomerName("Juan");
      result.current.setPhone("3454123456");
      result.current.setAddress("San Martín 123");
      result.current.setDeliveryZoneId("zone-1");
    });

    expect(result.current.canConfirm).toBe(true);
  });

  it("setPaymentMethod switches between cash and transfer", () => {
    const { result } = renderHook(() => useCheckout());

    act(() => result.current.setPaymentMethod("transfer"));

    expect(result.current.paymentMethod).toBe("transfer");
  });

  it("missingFields lists name-only for pickup, zone+name+phone+address for delivery", () => {
    const { result } = renderHook(() => useCheckout());

    expect(result.current.missingFields).toEqual(["name"]);

    act(() => result.current.setFulfillmentType("delivery"));
    expect(result.current.missingFields).toEqual(["zone", "name", "phone", "address"]);

    act(() => {
      result.current.setDeliveryZoneId("zone-1");
      result.current.setCustomerName("Juan");
      result.current.setPhone("3454123456");
    });
    expect(result.current.missingFields).toEqual(["address"]);
  });

  it("requestValidation returns false and bumps validationNonce while incomplete", () => {
    const { result } = renderHook(() => useCheckout());
    const initialNonce = result.current.validationNonce;

    let outcome: boolean | undefined;
    act(() => {
      outcome = result.current.requestValidation();
    });

    expect(outcome).toBe(false);
    expect(result.current.validationNonce).toBe(initialNonce + 1);

    // Every failed tap bumps the nonce again -- the owner wants the field
    // to re-focus on each press, not just the first one.
    act(() => {
      result.current.requestValidation();
    });
    expect(result.current.validationNonce).toBe(initialNonce + 2);
  });

  it("zone is missing only for delivery when neither a zone nor 'no encuentro mi zona' was chosen", () => {
    const { result } = renderHook(() => useCheckout());

    // Pickup never requires it, even before any zone-related setter is called.
    expect(result.current.missingFields).not.toContain("zone");

    act(() => result.current.setFulfillmentType("delivery"));
    expect(result.current.missingFields).toEqual(["zone", "name", "phone", "address"]);

    act(() => result.current.setDeliveryZoneId("zone-1"));
    expect(result.current.missingFields).not.toContain("zone");
  });

  it("choosing zoneNotListed satisfies the zone requirement without a deliveryZoneId", () => {
    const { result } = renderHook(() => useCheckout());

    act(() => result.current.setFulfillmentType("delivery"));
    act(() => result.current.setZoneNotListed(true));

    expect(result.current.zoneNotListed).toBe(true);
    expect(result.current.deliveryZoneId).toBeNull();
    expect(result.current.missingFields).not.toContain("zone");
  });

  it("setDeliveryZoneId and setZoneNotListed are mutually exclusive", () => {
    const { result } = renderHook(() => useCheckout());

    act(() => {
      result.current.setFulfillmentType("delivery");
      result.current.setZoneNotListed(true);
    });
    expect(result.current.zoneNotListed).toBe(true);

    act(() => result.current.setDeliveryZoneId("zone-1"));
    expect(result.current.deliveryZoneId).toBe("zone-1");
    expect(result.current.zoneNotListed).toBe(false);

    act(() => result.current.setZoneNotListed(true));
    expect(result.current.zoneNotListed).toBe(true);
    expect(result.current.deliveryZoneId).toBeNull();
  });

  it("switching to pickup never requires a zone, even mid-selection", () => {
    const { result } = renderHook(() => useCheckout());

    act(() => result.current.setFulfillmentType("delivery"));
    expect(result.current.missingFields).toContain("zone");

    act(() => result.current.setFulfillmentType("pickup"));
    expect(result.current.missingFields).not.toContain("zone");
  });

  it("requestValidation returns true and does not bump the nonce once complete", () => {
    const { result } = renderHook(() => useCheckout());

    act(() => result.current.setCustomerName("Juan"));
    const nonceBefore = result.current.validationNonce;

    let outcome: boolean | undefined;
    act(() => {
      outcome = result.current.requestValidation();
    });

    expect(outcome).toBe(true);
    expect(result.current.validationNonce).toBe(nonceBefore);
  });
});
