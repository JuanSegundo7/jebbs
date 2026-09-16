import { describe, expect, it } from "vitest";
import {
  assertDeliveryAddressInvariant,
  OrderPersistInvariantError,
} from "@/lib/order/assert-delivery-invariant";

describe("assertDeliveryAddressInvariant()", () => {
  it("does not throw for a delivery order with a real address id", () => {
    expect(() =>
      assertDeliveryAddressInvariant("delivery", "addr-1"),
    ).not.toThrow();
  });

  it("does not throw for a pickup order with a null address id", () => {
    expect(() => assertDeliveryAddressInvariant("pickup", null)).not.toThrow();
  });

  it("throws when a delivery order's address resolution failed or was skipped (null address id)", () => {
    expect(() => assertDeliveryAddressInvariant("delivery", null)).toThrow(
      OrderPersistInvariantError,
    );
  });

  it("throws for a pickup order that somehow carries a non-null address id", () => {
    expect(() => assertDeliveryAddressInvariant("pickup", "addr-1")).toThrow(
      OrderPersistInvariantError,
    );
  });
});
