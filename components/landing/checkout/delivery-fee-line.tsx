import { formatArs } from "@/components/landing/order-builder/currency";

interface DeliveryFeeLineProps {
  deliveryFeeArs: number;
}

// Rendered only while fulfillmentType === "delivery" (WU3b, tasks.md 5.1).
// deliveryFeeArs comes from lib/env.ts (DD3) -- display only, the server
// stamps the authoritative delivery_fee itself (WU4).
//
// No border of its own anymore -- it's one row inside the totals block
// checkout-panel.tsx builds (Subtotal / Envío / Total), which owns the
// diner-rule separator above the whole block.
export function DeliveryFeeLine({ deliveryFeeArs }: DeliveryFeeLineProps) {
  return (
    <div className="flex items-center justify-between" data-testid="delivery-fee-line">
      <span>Envío</span>
      <span className="numeric">{formatArs(deliveryFeeArs)}</span>
    </div>
  );
}
