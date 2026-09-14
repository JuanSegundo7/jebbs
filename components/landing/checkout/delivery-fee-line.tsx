import { formatArs } from "@/components/landing/order-builder/currency";

interface DeliveryFeeLineProps {
  deliveryFeeArs: number;
}

// Rendered only while fulfillmentType === "delivery" (WU3b, tasks.md 5.1).
// deliveryFeeArs comes from lib/env.ts (DD3) -- display only, the server
// stamps the authoritative delivery_fee itself (WU4).
export function DeliveryFeeLine({ deliveryFeeArs }: DeliveryFeeLineProps) {
  return (
    <div
      className="flex items-center justify-between text-subheadline"
      data-testid="delivery-fee-line"
    >
      <span>Costo de envío</span>
      <span>{formatArs(deliveryFeeArs)}</span>
    </div>
  );
}
