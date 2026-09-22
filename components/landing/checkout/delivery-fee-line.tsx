import { formatArs } from "@/components/landing/order-builder/currency";

interface DeliveryFeeLineProps {
  deliveryFeeArs: number;
  /** True when the customer hasn't picked a real zone yet (no selection,
   * or explicit "no encuentro mi zona") -- resolveDeliveryFee's
   * deliveryFeePending. deliveryFeeArs is 0 in that case, never shown as
   * "$ 0". */
  pending?: boolean;
}

// Rendered only while fulfillmentType === "delivery" (WU3b, tasks.md 5.1).
// deliveryFeeArs is resolved client-side from the chosen zone (real prices
// now vary by zone, see delivery-zones addendum) -- display only, the
// server stamps the authoritative delivery_fee itself (WU4).
//
// No border of its own anymore -- it's one row inside the totals block
// checkout-panel.tsx builds (Subtotal / Envío / Total), which owns the
// diner-rule separator above the whole block.
export function DeliveryFeeLine({ deliveryFeeArs, pending = false }: DeliveryFeeLineProps) {
  return (
    <div className="flex items-center justify-between" data-testid="delivery-fee-line">
      <span>Envío</span>
      <span className="numeric">{pending ? "A confirmar" : formatArs(deliveryFeeArs)}</span>
    </div>
  );
}
