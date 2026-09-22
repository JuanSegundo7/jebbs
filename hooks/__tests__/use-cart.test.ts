import { act, renderHook } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { useCart } from "@/hooks/use-cart";
import type { Burger, Extra } from "@/lib/types";

const MEAT_EXTRA: Extra = {
  id: "meat-1",
  name: "Medallón",
  category: "extra",
  price: 800,
  is_available: true,
  created_at: "2024-01-01",
};

const FRIES_EXTRA: Extra = {
  id: "fries-1",
  name: "Papas fritas chicas",
  category: "fries",
  price: 500,
  is_available: true,
  created_at: "2024-01-01",
};

const BURGER: Burger = {
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
};

describe("useCart", () => {
  it("starts empty", () => {
    const { result } = renderHook(() =>
      useCart({ meatExtra: MEAT_EXTRA, friesExtra: FRIES_EXTRA }),
    );

    expect(result.current.isEmpty).toBe(true);
    expect(result.current.itemCount).toBe(0);
    expect(result.current.total).toBe(0);
  });

  it("counts items across burgers, combos and sides", () => {
    const { result } = renderHook(() =>
      useCart({ meatExtra: MEAT_EXTRA, friesExtra: FRIES_EXTRA }),
    );

    act(() => {
      result.current.burgers.addBurger(BURGER);
    });
    act(() => {
      result.current.sides.addSide({
        id: "side-1",
        name: "Papas",
        category: "sides",
        price: 2000,
        is_available: true,
        created_at: "2024-01-01",
      });
    });

    expect(result.current.isEmpty).toBe(false);
    expect(result.current.itemCount).toBe(2);
  });

  it("derives a display total from the selected burgers via OrderPriceCalculator", () => {
    const { result } = renderHook(() =>
      useCart({ meatExtra: MEAT_EXTRA, friesExtra: FRIES_EXTRA }),
    );

    act(() => {
      result.current.burgers.addBurger(BURGER);
    });

    expect(result.current.total).toBe(5000);
  });

  it("adds the delivery fee to the total only when deliveryType is 'delivery'", () => {
    const { result, rerender } = renderHook(
      (props: { deliveryType: "pickup" | "delivery" }) =>
        useCart({
          meatExtra: MEAT_EXTRA,
          friesExtra: FRIES_EXTRA,
          deliveryType: props.deliveryType,
          deliveryFee: 2000,
        }),
      { initialProps: { deliveryType: "pickup" } },
    );

    act(() => {
      result.current.burgers.addBurger(BURGER);
    });
    expect(result.current.total).toBe(5000);

    rerender({ deliveryType: "delivery" });
    expect(result.current.total).toBe(7000);
  });

  it("subtotal never includes the delivery fee, unlike total", () => {
    // Regression test: checkout-panel.tsx used to read `total` (already
    // fee-inclusive) into its "Subtotal" row and then add the fee again for
    // "Total", double-charging delivery on screen.
    const { result, rerender } = renderHook(
      (props: { deliveryType: "pickup" | "delivery" }) =>
        useCart({
          meatExtra: MEAT_EXTRA,
          friesExtra: FRIES_EXTRA,
          deliveryType: props.deliveryType,
          deliveryFee: 2000,
        }),
      { initialProps: { deliveryType: "pickup" } },
    );

    act(() => {
      result.current.burgers.addBurger(BURGER);
    });
    expect(result.current.subtotal).toBe(5000);
    expect(result.current.total).toBe(5000);

    rerender({ deliveryType: "delivery" });
    expect(result.current.subtotal).toBe(5000);
    expect(result.current.total).toBe(7000);
  });

  it("reset() clears burgers, combos and sides together", () => {
    const { result } = renderHook(() =>
      useCart({ meatExtra: MEAT_EXTRA, friesExtra: FRIES_EXTRA }),
    );

    act(() => {
      result.current.burgers.addBurger(BURGER);
    });
    act(() => {
      result.current.sides.addSide({
        id: "side-1",
        name: "Papas",
        category: "sides",
        price: 2000,
        is_available: true,
        created_at: "2024-01-01",
      });
    });
    expect(result.current.isEmpty).toBe(false);

    act(() => {
      result.current.reset();
    });

    expect(result.current.isEmpty).toBe(true);
    expect(result.current.itemCount).toBe(0);
    expect(result.current.burgers.selectedBurgers).toEqual([]);
    expect(result.current.sides.selectedSides).toEqual([]);
  });
});
