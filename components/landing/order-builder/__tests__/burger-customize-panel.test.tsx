import { describe, expect, it, vi } from "vitest";
import { fireEvent, render, screen } from "@testing-library/react";
import { BurgerCustomizePanel } from "@/components/landing/order-builder/burger-customize-panel";
import type { Burger, Extra } from "@/lib/types";
import type { SelectedBurger } from "@/lib/types/combo-types";

const burger: Burger = {
  id: "b1",
  name: "Clásica",
  description: null,
  base_price: 5000,
  ingredients: [],
  is_available: true,
  image_url: null,
  default_meat_quantity: 2,
  default_fries_quantity: 1,
  created_at: "2024-01-01",
};

const bacon: Extra = {
  id: "e1",
  name: "Bacon",
  category: "extra",
  price: 500,
  is_available: true,
  created_at: "2024-01-01",
};

const item: SelectedBurger = {
  id: "sb1",
  burger,
  quantity: 1,
  meatCount: 3,
  friesQuantity: 0,
  removedIngredients: [],
  selectedExtras: [],
  meatPriceAdjustment: 0,
};

const handlers = {
  onMeatChange: vi.fn(),
  onFriesChange: vi.fn(),
  onToggleVeggie: vi.fn(),
  onToggleExtra: vi.fn(),
  onExtraQuantityChange: vi.fn(),
};

describe("BurgerCustomizePanel", () => {
  it("shows meat and fries controls by default", () => {
    render(<BurgerCustomizePanel item={item} toppingExtras={[bacon]} {...handlers} />);

    expect(screen.getByRole("button", { name: "Más carne" })).toBeTruthy();
    expect(screen.getByRole("button", { name: "Más papas" })).toBeTruthy();
  });

  it("hides meat controls when showMeat is false", () => {
    render(
      <BurgerCustomizePanel item={item} toppingExtras={[bacon]} showMeat={false} {...handlers} />,
    );

    expect(screen.queryByRole("button", { name: "Más carne" })).toBeNull();
    expect(screen.getByRole("button", { name: "Más papas" })).toBeTruthy();
  });

  it("hides fries controls when showFries is false", () => {
    render(
      <BurgerCustomizePanel item={item} toppingExtras={[bacon]} showFries={false} {...handlers} />,
    );

    expect(screen.queryByRole("button", { name: "Más papas" })).toBeNull();
    expect(screen.getByRole("button", { name: "Más carne" })).toBeTruthy();
  });

  it("uses the summary override when provided, including null -> 'Sin modificar'", () => {
    const { rerender } = render(
      <BurgerCustomizePanel item={item} toppingExtras={[]} summary={null} {...handlers} />,
    );
    expect(screen.getByText("Sin modificar")).toBeTruthy();

    rerender(
      <BurgerCustomizePanel item={item} toppingExtras={[]} summary="+ Bacon" {...handlers} />,
    );
    expect(screen.getByText("+ Bacon")).toBeTruthy();
  });

  it("still exposes veggie and extras when meat and fries are hidden", () => {
    render(
      <BurgerCustomizePanel
        item={item}
        toppingExtras={[bacon]}
        showMeat={false}
        showFries={false}
        {...handlers}
      />,
    );

    fireEvent.click(screen.getByRole("switch"));
    expect(handlers.onToggleVeggie).toHaveBeenCalled();
    fireEvent.click(screen.getByRole("button", { name: /Ver los 1 extras/ }));
    fireEvent.click(screen.getByRole("button", { name: "Agregar Bacon" }));
    expect(handlers.onToggleExtra).toHaveBeenCalledWith(bacon);
  });
});
