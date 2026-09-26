import { describe, expect, it } from "vitest";
import { render, screen, fireEvent, within, waitFor } from "@testing-library/react";
import { ComboPicker } from "@/components/landing/order-builder/combo-picker";
import { useComboSelection } from "@/hooks/use-combo-selection";
import type { Burger, Extra } from "@/lib/types";
import type { ComboSlotWithRules, ComboWithSlots } from "@/lib/types/combo-types";

// No @testing-library/jest-dom in this repo (not a dependency) -- assertions
// below use plain vitest matchers (truthy/falsy presence, not
// toBeInTheDocument) to stay consistent with the rest of the suite.

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
    slots: [makeComboSlot()],
    ...overrides,
  };
}

// Thin harness: ComboPicker takes `selection` as a prop (the return value of
// useComboSelection), so a component is needed to own that hook call and
// re-render when it changes -- the same shape OrderBuilder uses in the app.
function Harness({
  combos,
  burgers = [],
  toppingExtras = [],
}: {
  combos: ComboWithSlots[];
  burgers?: Burger[];
  toppingExtras?: Extra[];
}) {
  const selection = useComboSelection();
  return (
    <ComboPicker
      combos={combos}
      burgers={burgers}
      toppingExtras={toppingExtras}
      drinkExtras={[]}
      sideExtras={[]}
      selection={selection}
    />
  );
}

describe("ComboPicker menu item sheet", () => {
  it("opens the detail sheet when the combo's name/row is tapped", () => {
    render(<Harness combos={[makeCombo()]} />);

    fireEvent.click(screen.getByText("Combo Doble"));

    expect(screen.getByRole("heading", { name: "Combo Doble" })).toBeTruthy();
  });

  it("does not open the detail sheet when the row's + stepper is tapped", () => {
    render(<Harness combos={[makeCombo()]} />);

    fireEvent.click(screen.getByRole("button", { name: "Agregar Combo Doble" }));

    expect(screen.queryByRole("heading", { name: "Combo Doble" })).toBeNull();
  });

  it("increments the count from the sheet's own stepper without closing it", () => {
    render(<Harness combos={[makeCombo()]} />);

    fireEvent.click(screen.getByText("Combo Doble"));
    const heading = screen.getByRole("heading", { name: "Combo Doble" });
    expect(heading).toBeTruthy();
    const sheet = heading.closest('[data-slot="drawer-content"]') as HTMLElement;

    // count === 0 -> the footer shows a single "Agregar al pedido" button
    // (not a stepper yet). Tapping it adds the combo without closing the
    // sheet, so the footer flips to the +/- stepper on the next render.
    fireEvent.click(within(sheet).getByRole("button", { name: "Agregar al pedido" }));
    expect(screen.getByRole("heading", { name: "Combo Doble" })).toBeTruthy();
    expect(within(sheet).getByText("1")).toBeTruthy();

    // Now the sheet's own "+" (distinct from the row's identically-labeled
    // one, hence scoped to `sheet`) increments further without closing it.
    fireEvent.click(within(sheet).getByRole("button", { name: "Agregar Combo Doble" }));
    expect(screen.getByRole("heading", { name: "Combo Doble" })).toBeTruthy();
    expect(within(sheet).getByText("2")).toBeTruthy();
  });

  it("shows the slot breakdown in the sheet even when the combo has no authored description", () => {
    const combo = makeCombo({
      description: null,
      slots: [
        makeComboSlot({ id: "s1", slot_type: "burger", quantity: 1 }),
        makeComboSlot({ id: "s2", slot_type: "drink", quantity: 1 }),
      ],
    });
    render(<Harness combos={[combo]} />);

    fireEvent.click(screen.getByText("Combo Doble"));
    const heading = screen.getByRole("heading", { name: "Combo Doble" });
    const sheet = heading.closest('[data-slot="drawer-content"]') as HTMLElement;

    expect(within(sheet).getByText("1 hamburguesa a elección")).toBeTruthy();
    expect(within(sheet).getByText("1 bebida")).toBeTruthy();
  });
});

describe("ComboPicker fixed-burger slot", () => {
  const triple: Burger = {
    id: "burger-triple",
    name: "Triple con queso",
    description: null,
    base_price: 9000,
    ingredients: [],
    is_available: true,
    image_url: null,
    default_meat_quantity: 3,
    default_fries_quantity: 1,
    created_at: "2024-01-01",
  };
  const doble: Burger = { ...triple, id: "burger-doble", name: "Doble" };
  const fixedCombo = makeCombo({
    name: "Combo Triples",
    slots: [
      makeComboSlot({
        quantity: 2,
        rules: { min_quantity: 2, max_quantity: 2, fixed_burger_id: triple.id },
      }),
    ],
  });

  it("shows the included burger without a remove button or other-burger chips", () => {
    render(<Harness combos={[fixedCombo]} burgers={[triple, doble]} />);

    fireEvent.click(screen.getByRole("button", { name: "Agregar Combo Triples" }));

    expect(screen.getByText("Incluida en el combo")).toBeTruthy();
    expect(screen.getAllByText("Triple con queso")).toHaveLength(2);
    expect(screen.getAllByText("Incluida")).toHaveLength(2);
    expect(
      screen.queryByRole("button", { name: "Quitar hamburguesa del combo", hidden: true }),
    ).toBeNull();
    // No chips offering other burgers.
    expect(screen.queryByText("Doble")).toBeNull();
  });

  it("keeps the normal remove button and chips for a non-fixed slot", () => {
    render(<Harness combos={[makeCombo()]} burgers={[doble]} />);

    fireEvent.click(screen.getByRole("button", { name: "Agregar Combo Doble" }));
    fireEvent.click(screen.getByRole("button", { name: "Doble" }));

    expect(
      screen.getByRole("button", { name: "Quitar hamburguesa del combo", hidden: true }),
    ).toBeTruthy();
    expect(screen.queryByText("Incluida en el combo")).toBeNull();
  });
});

describe("ComboPicker unit cards placement", () => {
  const other = makeCombo({ id: "combo-2", name: "Combo Simple" });
  const combos = [makeCombo(), other];

  const rowOf = (name: string) =>
    screen.getByRole("button", { name: `Agregar ${name}` }).closest("[data-combo-row]") as HTMLElement;

  it("renders each unit card under its own combo row, not another's", () => {
    render(<Harness combos={combos} />);

    const add = screen.getByRole("button", { name: "Agregar Combo Doble" });
    fireEvent.click(add);
    fireEvent.click(add);

    const group = within(rowOf("Combo Doble")).getByRole("group", {
      name: "Personalización de Combo Doble",
    });
    expect(within(group).getAllByRole("button", { name: "Eliminar combo" })).toHaveLength(2);
    expect(
      within(rowOf("Combo Simple")).queryByRole("group", { name: /Personalización/ }),
    ).toBeNull();
  });

  it("no longer renders unit cards in a separate section after the list", () => {
    render(<Harness combos={combos} />);
    fireEvent.click(screen.getByRole("button", { name: "Agregar Combo Simple" }));

    for (const btn of screen.getAllByRole("button", { name: "Eliminar combo" })) {
      expect(btn.closest("[data-combo-row]")).toBeTruthy();
    }
  });

  it("keeps a removed unit as an inert aria-hidden ghost until the exit finishes", async () => {
    render(<Harness combos={combos} />);
    fireEvent.click(screen.getByRole("button", { name: "Agregar Combo Doble" }));
    expect(screen.getByRole("group", { name: "Personalización de Combo Doble" })).toBeTruthy();

    fireEvent.click(screen.getByRole("button", { name: "Quitar Combo Doble" }));

    expect(screen.queryByRole("group", { name: "Personalización de Combo Doble" })).toBeNull();
    const ghost = () =>
      document.querySelector('[role="group"][aria-label="Personalización de Combo Doble"]');
    expect(ghost()).toBeTruthy();
    expect(ghost()?.hasAttribute("inert")).toBe(true);
    expect(ghost()?.getAttribute("aria-hidden")).toBe("true");

    await waitFor(() => expect(ghost()).toBeNull());
  });
});

describe("ComboPicker burger customization", () => {
  const doble: Burger = {
    id: "burger-doble",
    name: "Doble",
    description: null,
    base_price: 9000,
    ingredients: [],
    is_available: true,
    image_url: null,
    default_meat_quantity: 2,
    default_fries_quantity: 1,
    created_at: "2024-01-01",
  };
  const bacon: Extra = {
    id: "extra-bacon",
    name: "Bacon",
    category: "extra",
    price: 500,
    is_available: true,
    created_at: "2024-01-01",
  };
  const oneBurgerCombo = makeCombo({
    slots: [makeComboSlot({ rules: { min_quantity: 1, max_quantity: 1 } })],
  });
  const renderAdded = () => {
    render(<Harness combos={[oneBurgerCombo]} burgers={[doble]} toppingExtras={[bacon]} />);
    fireEvent.click(screen.getByRole("button", { name: "Agregar Combo Doble" }));
  };

  it("shows the pre-selected only-candidate burger with its edit affordance", () => {
    renderAdded();

    expect(screen.getByRole("button", { name: /Doble.*tocá para personalizar/ })).toBeTruthy();
    expect(screen.getByRole("button", { name: "Quitar hamburguesa del combo" })).toBeTruthy();
    // Already selected: no chip offering it again.
    expect(screen.queryByText("Hamburguesas (1 disponibles)")).toBeNull();
    expect(screen.getByText("Hamburguesas (0 disponibles)")).toBeTruthy();
  });

  it("expands the panel without meat or fries controls", () => {
    renderAdded();

    fireEvent.click(screen.getByRole("button", { name: /Doble.*tocá para personalizar/ }));

    expect(screen.getByText("Sin modificar")).toBeTruthy();
    expect(screen.getByRole("switch")).toBeTruthy();
    expect(screen.queryByRole("button", { name: "Más carne" })).toBeNull();
    expect(screen.queryByRole("button", { name: "Más papas" })).toBeNull();
  });

  it("adding an extra updates the summary shown on the collapsed row", () => {
    renderAdded();
    const header = () => screen.getByRole("button", { name: /^Doble/ });

    fireEvent.click(header());
    fireEvent.click(screen.getByRole("button", { name: /Ver los 1 extras/ }));
    fireEvent.click(screen.getByRole("button", { name: "Agregar Bacon" }));
    fireEvent.click(header());

    expect(screen.getByText("+ Bacon")).toBeTruthy();
  });

  it("removing the pre-selected burger offers the chip again", () => {
    renderAdded();

    fireEvent.click(screen.getByRole("button", { name: "Quitar hamburguesa del combo" }));

    expect(screen.getByText("Hamburguesas (1 disponibles)")).toBeTruthy();
    expect(screen.getByRole("button", { name: "Doble" })).toBeTruthy();
  });

  it("lets a locked burger be customized too", () => {
    const fixed = makeCombo({
      slots: [
        makeComboSlot({
          rules: { min_quantity: 1, max_quantity: 1, fixed_burger_id: doble.id },
        }),
      ],
    });
    render(<Harness combos={[fixed]} burgers={[doble]} toppingExtras={[bacon]} />);
    fireEvent.click(screen.getByRole("button", { name: "Agregar Combo Doble" }));

    expect(screen.getByText("Incluida")).toBeTruthy();
    fireEvent.click(screen.getByRole("button", { name: /^Doble/ }));
    expect(screen.getByRole("switch")).toBeTruthy();
  });
});
