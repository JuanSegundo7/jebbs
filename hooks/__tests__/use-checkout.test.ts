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

  it("delivery + customerName + phone + address => canConfirm true", () => {
    const { result } = renderHook(() => useCheckout());

    act(() => {
      result.current.setFulfillmentType("delivery");
      result.current.setCustomerName("Juan");
      result.current.setPhone("3454123456");
      result.current.setAddress("San Martín 123");
    });

    expect(result.current.canConfirm).toBe(true);
  });

  it("setPaymentMethod switches between cash and transfer", () => {
    const { result } = renderHook(() => useCheckout());

    act(() => result.current.setPaymentMethod("transfer"));

    expect(result.current.paymentMethod).toBe("transfer");
  });
});
