"use client";

import type { UseCheckoutState } from "@/hooks/use-checkout";
import type { DeliveryZone } from "@/lib/types";
import { DeliveryZonePicker } from "./delivery-zone-picker";
import { FulfillmentToggle } from "./fulfillment-toggle";
import { PaymentMethodToggle } from "./payment-method-toggle";

interface OrderPreferencesProps {
  checkout: UseCheckoutState;
  deliveryZones: DeliveryZone[];
  minDeliveryFeeArs: number | null;
}

// Step 1 of the cart wizard ("Tu pedido"): the two toggles that change the
// total shown (fulfillment fee, payment method) -- deliberately kept out of
// the "identity" step (customer-details-panel.tsx) so they're visible
// before the customer commits to typing personal details, and out of the
// receipt-shaped ticket surface entirely: two toggles with no name/address/
// total underneath them isn't a "comprobante", it'd be a false metaphor
// (apple-design §16.4, honor the metaphor's physics). Plain card instead.
export function OrderPreferences({ checkout, deliveryZones, minDeliveryFeeArs }: OrderPreferencesProps) {
  const {
    fulfillmentType,
    setFulfillmentType,
    paymentMethod,
    setPaymentMethod,
    deliveryZoneId,
    setDeliveryZoneId,
    zoneNotListed,
    setZoneNotListed,
    validationNonce,
    missingFields,
  } = checkout;
  const isDelivery = fulfillmentType === "delivery";

  return (
    <div className="diner-elevated space-y-4 rounded-[10px] bg-[var(--surface-1)] p-4">
      <p className="font-condensed text-xs font-bold tracking-[.16em] text-[var(--muted-foreground)] uppercase">
        ¿Cómo lo querés?
      </p>
      <div className="diner-field">
        <FulfillmentToggle
          value={fulfillmentType}
          onChange={setFulfillmentType}
          minDeliveryFeeArs={minDeliveryFeeArs}
        />
      </div>
      {/* Debajo del toggle de fulfillment, solo con envío -- cambia el
          Total mostrado, por eso vive acá (paso 1) y no en el paso 2 junto
          al resto de los datos de entrega (mismo criterio que los dos
          toggles de arriba). */}
      {isDelivery && (
        <DeliveryZonePicker
          zones={deliveryZones}
          value={deliveryZoneId}
          zoneNotListed={zoneNotListed}
          onChange={(zoneId, notListed) => {
            if (notListed) {
              setZoneNotListed(true);
            } else {
              setDeliveryZoneId(zoneId);
            }
          }}
          invalid={validationNonce > 0 && missingFields.includes("zone")}
        />
      )}
      {/* Sin gatear a isDelivery -- efectivo/transferencia aplica también a
          retiro, no solo a envío (aunque el pedido original lo mencionara
          junto con la dirección). */}
      <div className="diner-field">
        <PaymentMethodToggle value={paymentMethod} onChange={setPaymentMethod} />
      </div>
    </div>
  );
}
