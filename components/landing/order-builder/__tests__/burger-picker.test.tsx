import { describe, expect, it } from "vitest";
import { render, screen, fireEvent, within } from "@testing-library/react";
import { BurgerPicker } from "@/components/landing/order-builder/burger-picker";
import { useBurgerSelection } from "@/hooks/use-burger-selection";
import type { Burger, Extra } from "@/lib/types";

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

// Name deliberately distinct from any fixture burger's name -- the row's
// stepper aria-labels are `Agregar/Quitar ${name}`, so an extra sharing a
// burger's name would make getByRole ambiguous.
function makeExtra(overrides: Partial<Extra> = {}): Extra {
  return {
    id: "extra-1",
    name: "Bacon",
    category: "extra",
    price: 800,
    is_available: true,
    created_at: "2024-01-01",
    ...overrides,
  };
}

// Thin harness: BurgerPicker takes `selection` as a prop (the return value of
// useBurgerSelection), so a component is needed to own that hook call and
// re-render when it changes -- the same shape OrderBuilder uses in the app.
function Harness({
  burgers,
  toppingExtras = [],
}: {
  burgers: Burger[];
  toppingExtras?: Extra[];
}) {
  const selection = useBurgerSelection();
  return (
    <BurgerPicker burgers={burgers} toppingExtras={toppingExtras} selection={selection} />
  );
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

describe("BurgerPicker customize panel -- extras with quantity", () => {
  it("increases an extra's quantity via the row stepper and reflects it in the summary", () => {
    const bacon = makeExtra();
    render(<Harness burgers={[makeBurger()]} toppingExtras={[bacon]} />);

    // addBurger auto-expands the new instance's customize panel.
    fireEvent.click(screen.getByRole("button", { name: "Agregar Clásica" }));

    // Default progressive disclosure hides an extra at quantity 0 -- reveal
    // it via "Ver los N extras" before it can be added.
    fireEvent.click(screen.getByRole("button", { name: /Ver los \d+ extras/ }));

    const addBaconBtn = () => screen.getByRole("button", { name: "Agregar Bacon" });
    fireEvent.click(addBaconBtn());
    fireEvent.click(addBaconBtn());

    // Re-estilo visual (identidad jebbs-dashboard): la fila del extra ya no
    // lleva la clase `menu-row-compact` (composite utility retirada de este
    // componente, ver AGENTS.md del re-estilo) -- se sube por estructura
    // (name -> su wrapper -> la fila entera) en vez de por className, así
    // el test no depende de una clase de presentación.
    const row = screen.getByText("Bacon").closest("div")
      ?.parentElement as HTMLElement;
    expect(within(row).getByText("2")).toBeTruthy();

    // Query the header toggle while still expanded (its accessible name is
    // just the burger name only in this state -- collapsed, it also
    // includes the truncated summary text, which would make this query
    // return a different match).
    const headerToggle = screen.getByRole("button", { name: "Clásica" });
    fireEvent.click(headerToggle);
    expect(screen.getByText("+ 2x Bacon")).toBeTruthy();
  });

  it("decreases an extra back to 0, disabling its '-' and clearing it from the summary", () => {
    const bacon = makeExtra();
    render(<Harness burgers={[makeBurger()]} toppingExtras={[bacon]} />);

    fireEvent.click(screen.getByRole("button", { name: "Agregar Clásica" }));
    fireEvent.click(screen.getByRole("button", { name: /Ver los \d+ extras/ }));
    fireEvent.click(screen.getByRole("button", { name: "Agregar Bacon" }));
    fireEvent.click(screen.getByRole("button", { name: "Quitar Bacon" }));

    const removeBtn = screen.getByRole("button", {
      name: "Quitar Bacon",
    }) as HTMLButtonElement;
    expect(removeBtn.disabled).toBe(true);

    const headerToggle = screen.getByRole("button", { name: "Clásica" });
    fireEvent.click(headerToggle);
    expect(screen.queryByText(/Bacon/)).toBeNull();
  });

  it("shows the untruncated summary inside the panel while it's still expanded", () => {
    const bacon = makeExtra();
    render(<Harness burgers={[makeBurger()]} toppingExtras={[bacon]} />);

    fireEvent.click(screen.getByRole("button", { name: "Agregar Clásica" }));
    fireEvent.click(screen.getByRole("button", { name: /Ver los \d+ extras/ }));
    fireEvent.click(screen.getByRole("button", { name: "Agregar Bacon" }));

    // Panel is never collapsed in this test -- before this change, the
    // summary was only rendered in the collapsed header.
    expect(screen.getByText("+ Bacon")).toBeTruthy();
  });
});

describe("BurgerPicker customize panel -- veggie toggle", () => {
  it("starts unchecked and flips to checked when tapped", () => {
    render(<Harness burgers={[makeBurger()]} />);

    fireEvent.click(screen.getByRole("button", { name: "Agregar Clásica" }));

    const veggieSwitch = screen.getByRole("switch", { name: /veggie/i });
    expect(veggieSwitch.getAttribute("aria-checked")).toBe("false");

    fireEvent.click(veggieSwitch);
    expect(veggieSwitch.getAttribute("aria-checked")).toBe("true");
  });
});
