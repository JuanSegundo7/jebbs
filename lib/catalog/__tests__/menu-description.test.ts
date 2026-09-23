import { describe, expect, it } from "vitest";
import {
  burgerDescriptionText,
  comboDescriptionText,
  describeComboSlot,
  describeComboSlots,
  summarizeComboSlots,
} from "@/lib/catalog/menu-description";
import type { Burger } from "@/lib/types";
import type { ComboSlotWithRules, ComboWithSlots } from "@/lib/types/combo-types";

function makeBurger(overrides: Partial<Burger> = {}): Burger {
  return {
    id: "burger-1",
    name: "Clásica",
    description: null,
    base_price: 5000,
    ingredients: [],
    is_available: true,
    image_url: null,
    default_meat_quantity: 1,
    default_fries_quantity: 1,
    created_at: "2024-01-01",
    ...overrides,
  };
}

function makeComboSlot(overrides: Partial<ComboSlotWithRules> = {}): ComboSlotWithRules {
  return {
    id: "slot-1",
    combo_id: "combo-1",
    slot_type: "burger",
    quantity: 1,
    required: true,
    default_meat_quantity: null,
    created_at: "2024-01-01",
    rules: { min_quantity: 0, max_quantity: 1 },
    ...overrides,
  };
}

function makeCombo(overrides: Partial<ComboWithSlots> = {}): ComboWithSlots {
  return {
    id: "combo-1",
    name: "Combo Doble",
    description: null,
    price: 12000,
    is_available: true,
    created_at: "2024-01-01",
    slots: [],
    ...overrides,
  };
}

describe("burgerDescriptionText", () => {
  it("prefers an authored description", () => {
    const burger = makeBurger({ description: "Doble carne con cheddar", ingredients: ["Carne", "Cheddar"] });
    expect(burgerDescriptionText(burger)).toBe("Doble carne con cheddar");
  });

  it("falls back to ingredients when description is only whitespace", () => {
    const burger = makeBurger({ description: "   ", ingredients: ["Carne", "Cheddar"] });
    expect(burgerDescriptionText(burger)).toBe("Carne · Cheddar");
  });

  it("joins ingredients with ' · '", () => {
    const burger = makeBurger({ ingredients: ["Carne", "Lechuga", "Tomate"] });
    expect(burgerDescriptionText(burger)).toBe("Carne · Lechuga · Tomate");
  });

  it("filters blank ingredient entries", () => {
    const burger = makeBurger({ ingredients: ["Carne", "  ", "Cheddar"] });
    expect(burgerDescriptionText(burger)).toBe("Carne · Cheddar");
  });

  it("returns null when every ingredient is blank", () => {
    const burger = makeBurger({ ingredients: ["  ", " "] });
    expect(burgerDescriptionText(burger)).toBeNull();
  });

  it("returns null when there is neither description nor ingredients", () => {
    expect(burgerDescriptionText(makeBurger())).toBeNull();
  });
});

describe("describeComboSlot", () => {
  it("uses singular wording for count 1", () => {
    const slot = makeComboSlot({ slot_type: "burger", quantity: 1, rules: { min_quantity: 0, max_quantity: 1 } });
    expect(describeComboSlot(slot)).toBe("1 hamburguesa a elección");
  });

  it("uses plural wording for count > 1", () => {
    const slot = makeComboSlot({ slot_type: "burger", quantity: 2, rules: { min_quantity: 0, max_quantity: 2 } });
    expect(describeComboSlot(slot)).toBe("2 hamburguesas a elección");
  });

  it("maps drink slots", () => {
    const slot = makeComboSlot({ slot_type: "drink", quantity: 1, rules: { min_quantity: 0, max_quantity: 1 } });
    expect(describeComboSlot(slot)).toBe("1 bebida");
  });

  it("maps side slots", () => {
    const slot = makeComboSlot({ slot_type: "side", quantity: 2, rules: { min_quantity: 0, max_quantity: 2 } });
    expect(describeComboSlot(slot)).toBe("2 acompañamientos");
  });

  it("maps nuggets slots", () => {
    const slot = makeComboSlot({ slot_type: "nuggets", quantity: 1, rules: { min_quantity: 0, max_quantity: 1 } });
    expect(describeComboSlot(slot)).toBe("1 porción de nuggets");
  });

  it("falls back to the raw slot_type for an unrecognized value instead of disappearing", () => {
    const slot = makeComboSlot({ slot_type: "postre", quantity: 1, rules: { min_quantity: 0, max_quantity: 1 } });
    expect(describeComboSlot(slot)).toBe("1 postre");
  });

  it("reports a range when 0 < min_quantity < quantity", () => {
    const slot = makeComboSlot({
      slot_type: "burger",
      quantity: 2,
      rules: { min_quantity: 1, max_quantity: 2 },
    });
    expect(describeComboSlot(slot)).toBe("entre 1 y 2 hamburguesas a elección");
  });

  it("uses the flat form when min_quantity is 0", () => {
    const slot = makeComboSlot({
      slot_type: "burger",
      quantity: 2,
      rules: { min_quantity: 0, max_quantity: 2 },
    });
    expect(describeComboSlot(slot)).toBe("2 hamburguesas a elección");
  });

  it("never produces an inverted range when min_quantity >= quantity (inconsistent config)", () => {
    const slot = makeComboSlot({
      slot_type: "burger",
      quantity: 2,
      rules: { min_quantity: 3, max_quantity: 2 },
    });
    expect(describeComboSlot(slot)).toBe("2 hamburguesas a elección");
  });

  it("omits the slot when quantity is 0", () => {
    const slot = makeComboSlot({ quantity: 0 });
    expect(describeComboSlot(slot)).toBeNull();
  });
});

describe("describeComboSlots / summarizeComboSlots", () => {
  it("returns null from summarizeComboSlots when there are no slots", () => {
    expect(summarizeComboSlots(makeCombo({ slots: [] }))).toBeNull();
  });

  it("preserves slot order", () => {
    const combo = makeCombo({
      slots: [
        makeComboSlot({ id: "s1", slot_type: "drink", quantity: 1 }),
        makeComboSlot({ id: "s2", slot_type: "burger", quantity: 1 }),
        makeComboSlot({ id: "s3", slot_type: "side", quantity: 1 }),
      ],
    });
    expect(describeComboSlots(combo)).toEqual(["1 bebida", "1 hamburguesa a elección", "1 acompañamiento"]);
  });

  it("builds an 'Incluye: ...' summary joined with ' · '", () => {
    const combo = makeCombo({
      slots: [
        makeComboSlot({ id: "s1", slot_type: "burger", quantity: 1 }),
        makeComboSlot({ id: "s2", slot_type: "drink", quantity: 1 }),
      ],
    });
    expect(summarizeComboSlots(combo)).toBe("Incluye: 1 hamburguesa a elección · 1 bebida");
  });
});

describe("combos con hamburguesa fija (fixed_burger_id)", () => {
  const tripleQueso = makeBurger({ id: "burger-triple", name: "Triple con queso" });
  const fixedSlot = (quantity = 2) =>
    makeComboSlot({
      slot_type: "burger",
      quantity,
      rules: { min_quantity: quantity, max_quantity: quantity, fixed_burger_id: "burger-triple" },
    });

  it("nombra la hamburguesa fija en vez de decir 'a elección'", () => {
    expect(describeComboSlot(fixedSlot(2), [tripleQueso])).toBe("2 Triple con queso");
  });

  it("usa singular/plural solo por cantidad: 1 sola hamburguesa fija", () => {
    expect(describeComboSlot(fixedSlot(1), [tripleQueso])).toBe("1 Triple con queso");
  });

  it("cae a 'a elección' si la burger fija no está en la lista (no inventa un nombre)", () => {
    expect(describeComboSlot(fixedSlot(2), [makeBurger({ id: "otra" })])).toBe(
      "2 hamburguesas a elección",
    );
    expect(describeComboSlot(fixedSlot(2))).toBe("2 hamburguesas a elección");
  });

  it("no toca los slots que no son de hamburguesa aunque tengan la regla", () => {
    const drink = makeComboSlot({
      slot_type: "drink",
      quantity: 1,
      rules: { min_quantity: 0, max_quantity: 1, fixed_burger_id: "burger-triple" },
    });
    expect(describeComboSlot(drink, [tripleQueso])).toBe("1 bebida");
  });

  it("se propaga a describeComboSlots / summarizeComboSlots / comboDescriptionText", () => {
    const combo = makeCombo({
      slots: [
        fixedSlot(2),
        makeComboSlot({ id: "s2", slot_type: "drink", quantity: 1 }),
      ],
    });
    expect(describeComboSlots(combo, [tripleQueso])).toEqual(["2 Triple con queso", "1 bebida"]);
    expect(summarizeComboSlots(combo, [tripleQueso])).toBe("Incluye: 2 Triple con queso · 1 bebida");
    expect(comboDescriptionText(combo, [tripleQueso])).toBe("Incluye: 2 Triple con queso · 1 bebida");
  });
});

describe("comboDescriptionText", () => {
  it("returns the authored description verbatim without appending the synthesis", () => {
    const combo = makeCombo({
      description: "Nuestro combo insignia",
      slots: [makeComboSlot({ slot_type: "burger", quantity: 1 })],
    });
    expect(comboDescriptionText(combo)).toBe("Nuestro combo insignia");
  });

  it("falls back to 'Incluye: ...' when description is null", () => {
    const combo = makeCombo({
      description: null,
      slots: [makeComboSlot({ slot_type: "burger", quantity: 1 })],
    });
    expect(comboDescriptionText(combo)).toBe("Incluye: 1 hamburguesa a elección");
  });

  it("returns null when there is neither an authored description nor any describable slot", () => {
    const combo = makeCombo({ description: null, slots: [] });
    expect(comboDescriptionText(combo)).toBeNull();
  });
});
