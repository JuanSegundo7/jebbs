import { describe, expect, it } from "vitest";
import { render, screen, fireEvent, within } from "@testing-library/react";
import { ComboPicker } from "@/components/landing/order-builder/combo-picker";
import { useComboSelection } from "@/hooks/use-combo-selection";
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
function Harness({ combos }: { combos: ComboWithSlots[] }) {
  const selection = useComboSelection();
  return (
    <ComboPicker
      combos={combos}
      burgers={[]}
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
