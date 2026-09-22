import type { DeliveryZone } from "@/lib/types";

// Server-stamped delivery fee resolution (replaces the flat
// env.DELIVERY_FEE_ARS at app/api/orders/route.ts step 6). Pure function
// over a catalog's already-fetched zones -- no I/O of its own, so both the
// route handler and the client's advisory total (order-builder.tsx) can
// share this single source of truth.
export interface ResolvedDeliveryFee {
  deliveryFee: number;
  deliveryZoneId: string | null;
  deliveryZoneName: string | null;
  deliveryFeePending: boolean;
}

// Thrown for an unknown or inactive zone id -- never silently falls back to
// pending, since that would turn a stale zone id from an old page load into
// an unintended discount (the customer picked a real, priced zone; the
// server just can't currently confirm it, so it must fail loudly).
export class DeliveryZoneUnavailableError extends Error {}

// `zones` must already be filtered to is_active = true (getCatalog's
// fetchActiveDeliveryZones) -- the `z.is_active` check below is a second,
// defensive guard in case a caller passes an unfiltered list.
export function resolveDeliveryFee(
  zones: DeliveryZone[],
  zoneId: string | null,
): ResolvedDeliveryFee {
  if (zoneId === null) {
    // "No encuentro mi zona" (or not chosen yet, client-side) -- delivery_fee
    // must never be null (hard invariant relied on downstream), so this is
    // 0, not null, with delivery_fee_pending = true.
    return {
      deliveryFee: 0,
      deliveryZoneId: null,
      deliveryZoneName: null,
      deliveryFeePending: true,
    };
  }

  const zone = zones.find((z) => z.id === zoneId && z.is_active);
  if (!zone) {
    throw new DeliveryZoneUnavailableError(
      `Zone ${zoneId} is unknown or inactive`,
    );
  }

  return {
    deliveryFee: zone.fee,
    deliveryZoneId: zone.id,
    deliveryZoneName: zone.name,
    deliveryFeePending: false,
  };
}
