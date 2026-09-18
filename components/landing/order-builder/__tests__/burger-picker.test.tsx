import { describe, expect, it } from "vitest";
import { render, screen, fireEvent, within } from "@testing-library/react";
import { BurgerPicker } from "@/components/landing/order-builder/burger-picker";
import { useBurgerSelection } from "@/hooks/use-burger-selection";
import type { Burger } from "@/lib/types";

// No @testing-library/jest-dom in this repo (not a dependency) -- assertions
// below use plain vitest matchers (truthy/falsy presence, not
// toBeInTheDocument) to stay consistent with the rest of the suite.

function makeBurger(overrides: Partial<Burger> = {}): Burger {
  return {
    id: "burger-1",
    name: "Clásica",
    description: null,
    base_price: 5000,
    ingredients: ["Carne", "Cheddar"],
    is_available: true,
    image_url: null,
    default_meat_quantity: 1,
    default_fries_quantity: 1,
    created_at: "2024-01-01",
    ...overrides,
  };
}

// Thin harness: BurgerPicker takes `selection` as a prop (the return value of
// useBurgerSelection), so a component is needed to own that hook call and
// re-render when it changes -- the same shape OrderBuilder uses in the app.
function Harness({ burgers }: { burgers: Burger[] }) {
  const selection = useBurgerSelection();
  return <BurgerPicker burgers={burgers} toppingExtras={[]} selection={selection} />;
}

describe("BurgerPicker menu item sheet", () => {
  it("opens the detail sheet when the burger's name/row is tapped", () => {
    render(<Harness burgers={[makeBurger()]} />);

    // Click the name text itself -- it bubbles up to the row's wrapping
    // button, same as a real tap anywhere on the thumb/name/price/description
    // block would. Targeting by aria-label would be ambiguous: the +/-
    // stepper buttons are also labeled "Agregar/Quitar Clásica".
    fireEvent.click(screen.getByText("Clásica"));

    expect(screen.getByRole("heading", { name: "Clásica" })).toBeTruthy();
  });

  it("does not open the detail sheet when the row's + stepper is tapped", () => {
    render(<Harness burgers={[makeBurger()]} />);

    fireEvent.click(screen.getByRole("button", { name: "Agregar Clásica" }));

    expect(screen.queryByRole("heading", { name: "Clásica" })).toBeNull();
  });

  it("increments the count from the sheet's own stepper without closing it", () => {
    render(<Harness burgers={[makeBurger()]} />);

    fireEvent.click(screen.getByText("Clásica"));
    const heading = screen.getByRole("heading", { name: "Clásica" });
    expect(heading).toBeTruthy();
    const sheet = heading.closest('[data-slot="drawer-content"]') as HTMLElement;

    // count === 0 -> the footer shows a single "Agregar al pedido" button
    // (not a stepper yet). Tapping it adds the burger without closing the
    // sheet, so the footer flips to the +/- stepper on the next render.
    fireEvent.click(within(sheet).getByRole("button", { name: "Agregar al pedido" }));
    expect(screen.getByRole("heading", { name: "Clásica" })).toBeTruthy();
    expect(within(sheet).getByText("1")).toBeTruthy();

    // Now the sheet's own "+" (distinct from the row's identically-labeled
    // one, hence scoped to `sheet`) increments further without closing it.
    fireEvent.click(within(sheet).getByRole("button", { name: "Agregar Clásica" }));
    expect(screen.getByRole("heading", { name: "Clásica" })).toBeTruthy();
    expect(within(sheet).getByText("2")).toBeTruthy();
  });
});
