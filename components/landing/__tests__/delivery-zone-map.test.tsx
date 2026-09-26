import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { cleanup, render, screen, waitFor } from "@testing-library/react";
import { DeliveryZoneMap } from "../delivery-zone-map";
import type { DeliveryZone } from "@/lib/types";

const SVG = `<svg viewBox="0 0 1654 966">
  <path data-zone="z1" d="M0 0"/>
  <path data-zone="z2" d="M0 0"/>
</svg>`;

function zone(overrides: Partial<DeliveryZone>): DeliveryZone {
  return {
    id: "id",
    name: "Zone",
    description: null,
    fee: 1000,
    is_active: true,
    sort_order: 0,
    map_zone_key: null,
    map_polygon: null,
    ...overrides,
  };
}

describe("DeliveryZoneMap", () => {
  beforeEach(() => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({ text: () => Promise.resolve(SVG) }),
    );
  });
  afterEach(() => {
    cleanup();
    vi.unstubAllGlobals();
  });

  it("greys out legacy map regions with no matching zone (.zone-off)", async () => {
    const { container } = render(
      <DeliveryZoneMap zones={[zone({ id: "a", name: "Gonnet", map_zone_key: "z1" })]} />,
    );
    await waitFor(() =>
      expect(container.querySelector('[data-zone="z2"]')).not.toBeNull(),
    );
    await waitFor(() =>
      expect(container.querySelector('[data-zone="z2"]')?.classList.contains("zone-off")).toBe(true),
    );
    expect(container.querySelector('[data-zone="z1"]')?.classList.contains("zone-off")).toBe(false);
  });

  it("draws a valid polygon", () => {
    const { container } = render(
      <DeliveryZoneMap
        zones={[zone({ id: "a", name: "A", map_polygon: [[0, 0], [10, 0], [5, 8]] })]}
      />,
    );
    expect(container.querySelectorAll("polygon")).toHaveLength(1);
  });

  it("ignores an invalid polygon but keeps the zone in the list", () => {
    const bad = [[0, 0], [1, 1]] as unknown as [number, number][];
    const { container } = render(
      <DeliveryZoneMap
        zones={[
          zone({ id: "a", name: "Buena", map_polygon: [[0, 0], [10, 0], [5, 8]] }),
          zone({ id: "b", name: "Rota", sort_order: 1, map_polygon: bad }),
        ]}
      />,
    );
    expect(container.querySelectorAll("polygon")).toHaveLength(1);
    expect(screen.getByText("Rota")).toBeTruthy();
    expect(screen.getByText("Buena")).toBeTruthy();
  });

  it("does not crash when map_polygon is not an array", () => {
    const bad = "oops" as unknown as [number, number][];
    const { container } = render(
      <DeliveryZoneMap zones={[zone({ id: "b", name: "Rota", map_polygon: bad })]} />,
    );
    expect(container.querySelectorAll("polygon")).toHaveLength(0);
    expect(screen.getByText("Rota")).toBeTruthy();
  });

  it("colors polygons with the 4-color dashboard palette by position", () => {
    const tri: [number, number][] = [[0, 0], [10, 0], [5, 8]];
    const zones = [1, 2, 3, 4, 5].map((n) =>
      zone({ id: `p${n}`, name: `P${n}`, sort_order: n, map_polygon: tri }),
    );
    const { container } = render(<DeliveryZoneMap zones={zones} />);
    const fills = [...container.querySelectorAll("polygon")].map((p) => p.getAttribute("fill"));
    expect(fills).toEqual([
      "var(--chart-1)", "var(--chart-2)", "var(--chart-3)", "var(--chart-4)", "var(--chart-1)",
    ]);
  });
});
