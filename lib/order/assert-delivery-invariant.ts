// R11 (design.md), hard invariant: `deliveryType === "delivery"` if-and
// -only-if a real, non-null `customerAddressId` exists. The dashboard
// silently coerces a null-address delivery down to pickup while still
// charging the fee (use-order-wizard.ts:250-255) -- this route refuses to
// persist that inconsistent state at all rather than silently "fixing" it.
// Call this immediately before the orders insert (app/api/orders/route.ts),
// never after -- the whole point is to abort BEFORE any row is written.
export class OrderPersistInvariantError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "OrderPersistInvariantError";
  }
}

export function assertDeliveryAddressInvariant(
  deliveryType: "pickup" | "delivery",
  customerAddressId: string | null,
): void {
  const isDelivery = deliveryType === "delivery";
  const hasAddress = customerAddressId !== null;

  if (isDelivery !== hasAddress) {
    throw new OrderPersistInvariantError(
      `R11 invariant violated: deliveryType=${deliveryType} but customerAddressId=${customerAddressId === null ? "null" : "<set>"}`,
    );
  }
}
