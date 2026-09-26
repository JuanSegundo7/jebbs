import type { DeliveryZone } from "@/lib/types";

export const COVERAGE_FALLBACK = "Consultá las zonas de entrega";

/**
 * Human-readable list of the delivery zones passed in ("A", "A y B",
 * "A, B y C"), in the given order. Callers pass only active zones.
 */
export function coverageLabel(zones: ReadonlyArray<Pick<DeliveryZone, "name">>): string {
  const names = zones.map((zone) => zone.name);
  if (names.length === 0) return COVERAGE_FALLBACK;
  if (names.length === 1) return names[0];
  return `${names.slice(0, -1).join(", ")} y ${names[names.length - 1]}`;
}
