import { describe, expect, it } from "vitest";
import { splitStorefrontExtras } from "@/lib/catalog/storefront-extras";
import type { Extra } from "@/lib/types";

function makeExtra(overrides: Partial<Extra> = {}): Extra {
  return {
    id: "extra-1",
    name: "Cheddar extra",
    category: "extra",
    price: 800,
    is_available: true,
    created_at: "2024-01-01",
    ...overrides,
  };
}

describe("splitStorefrontExtras", () => {
  it("excludes meatExtra from toppings even though it has category 'extra'", () => {
    const meatExtra = makeExtra({ id: "meat-1", name: "Medallón", category: "extra" });
    const friesExtra = makeExtra({ id: "fries-1", name: "Papas fritas chicas", category: "sides" });
    const cheddar = makeExtra({ id: "cheddar-1", name: "Cheddar extra" });

    const result = splitStorefrontExtras({
      extras: [meatExtra, friesExtra, cheddar],
      meatExtra,
      friesExtra,
    });

    expect(result.toppings.map((e) => e.id)).toEqual(["cheddar-1"]);
    expect(result.toppings.map((e) => e.id)).not.toContain("meat-1");
  });

  it("excludes friesExtra from toppings even though it has category 'extra'", () => {
    const meatExtra = makeExtra({ id: "meat-1", name: "Medallón", category: "extra" });
    const friesExtra = makeExtra({ id: "fries-1", name: "Papas fritas chicas", category: "extra" });
    const bacon = makeExtra({ id: "bacon-1", name: "Bacon" });

    const result = splitStorefrontExtras({
      extras: [meatExtra, friesExtra, bacon],
      meatExtra,
      friesExtra,
    });

    expect(result.toppings.map((e) => e.id)).toEqual(["bacon-1"]);
    expect(result.toppings.map((e) => e.id)).not.toContain("fries-1");
  });

  it("does not mutate the original catalog.extras array/rows", () => {
    const meatExtra = makeExtra({ id: "meat-1", name: "Medallón", category: "extra" });
    const friesExtra = makeExtra({ id: "fries-1", name: "Papas fritas chicas", category: "extra" });
    const bacon = makeExtra({ id: "bacon-1", name: "Bacon" });
    const extras = [meatExtra, friesExtra, bacon];

    splitStorefrontExtras({ extras, meatExtra, friesExtra });

    // The server-side availability validation reads catalog.extras directly
    // and must still see every sellable row, including the two dedicated ones.
    expect(extras).toHaveLength(3);
    expect(extras).toContain(meatExtra);
    expect(extras).toContain(friesExtra);
  });

  it("partitions drinks and sides the same way the previous inline filters did", () => {
    const meatExtra = makeExtra({ id: "meat-1", name: "Medallón", category: "extra" });
    const friesExtra = makeExtra({ id: "fries-1", name: "Papas fritas chicas", category: "sides" });
    const cola = makeExtra({ id: "cola-1", name: "Coca-Cola", category: "drink" });
    const papas = makeExtra({ id: "papas-1", name: "Papas grandes", category: "sides" });

    const result = splitStorefrontExtras({
      extras: [meatExtra, friesExtra, cola, papas],
      meatExtra,
      friesExtra,
    });

    expect(result.drinks.map((e) => e.id)).toEqual(["cola-1"]);
    expect(result.sides.map((e) => e.id)).toEqual(["fries-1", "papas-1"]);
  });
});
