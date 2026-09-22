import { describe, expect, it } from "vitest";
import {
  DeliveryZoneUnavailableError,
  resolveDeliveryFee,
} from "@/lib/order/resolve-delivery-fee";
import type { DeliveryZone } from "@/lib/types";

const ACTIVE_ZONE: DeliveryZone = {
  id: "zone-1",
  name: "City Bell",
  description: "Casco y alrededores",
  fee: 1500,
  is_active: true,
  sort_order: 1,
  map_zone_key: "z1",
  map_polygon: null,
};

const INACTIVE_ZONE: DeliveryZone = {
  id: "zone-2",
  name: "Zona vieja",
  description: null,
  fee: 900,
  is_active: false,
  sort_order: 2,
  map_zone_key: null,
  map_polygon: null,
};

const ZONES = [ACTIVE_ZONE, INACTIVE_ZONE];

describe("resolveDeliveryFee", () => {
  it("returns the zone's fee/name for an active zone id", () => {
    const result = resolveDeliveryFee(ZONES, ACTIVE_ZONE.id);

    expect(result).toEqual({
      deliveryFee: 1500,
      deliveryZoneId: "zone-1",
      deliveryZoneName: "City Bell",
      deliveryFeePending: false,
    });
  });

  it("throws DeliveryZoneUnavailableError for an inactive zone id", () => {
    expect(() => resolveDeliveryFee(ZONES, INACTIVE_ZONE.id)).toThrow(
      DeliveryZoneUnavailableError,
    );
  });

  it("throws DeliveryZoneUnavailableError for an unknown uuid", () => {
    expect(() =>
      resolveDeliveryFee(ZONES, "00000000-0000-0000-0000-000000000000"),
    ).toThrow(DeliveryZoneUnavailableError);
  });

  it("null zone id resolves to pending with fee 0 (never null)", () => {
    const result = resolveDeliveryFee(ZONES, null);

    expect(result).toEqual({
      deliveryFee: 0,
      deliveryZoneId: null,
      deliveryZoneName: null,
      deliveryFeePending: true,
    });
  });
});
