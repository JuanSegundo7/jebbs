import { useEffect } from "react";
import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { useCart } from "@/hooks/use-cart";
import { useCheckout } from "@/hooks/use-checkout";
import type { FulfillmentType } from "@/hooks/use-checkout";
import { CustomerDetailsPanel } from "@/components/landing/checkout/customer-details-panel";
import type { Burger } from "@/lib/types";

const MEAT_EXTRA = {
  id: "meat-1",
  name: "Medallón",
  category: "extra" as const,
  price: 800,
  is_available: true,
  created_at: "2024-01-01",
};
const FRIES_EXTRA = {
  id: "fries-1",
  name: "Papas fritas chicas",
  category: "fries" as const,
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

const ZONE_FEE = 2000;

// The fulfillment toggle moved to order-preferences.tsx (step 1 of the
// wizard) -- this harness drives fulfillmentType by prop instead of
// clicking a tab that no longer lives in this component.
function Harness({
  fulfillment = "pickup",
  seedCart = false,
  deliveryFeePending = false,
}: {
  fulfillment?: FulfillmentType;
  seedCart?: boolean;
  deliveryFeePending?: boolean;
}) {
  const checkout = useCheckout();
  const isDelivery = checkout.fulfillmentType === "delivery";
  useEffect(() => {
    checkout.setFulfillmentType(fulfillment);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [fulfillment]);
  // Mirrors order-builder.tsx's real wiring: useCart only sees the fee once
  // fulfillmentType is actually "delivery" -- a harness that skips this
  // hides bugs where the view does its own fee math on top of a
  // `cart.total` that already includes it.
  const cart = useCart({
    meatExtra: MEAT_EXTRA,
    friesExtra: FRIES_EXTRA,
    deliveryType: checkout.fulfillmentType,
    deliveryFee: isDelivery && !deliveryFeePending ? ZONE_FEE : 0,
  });
  useEffect(() => {
    if (seedCart) cart.burgers.addBurger(BURGER);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [seedCart]);
  return (
    <CustomerDetailsPanel
      cart={cart}
      checkout={checkout}
      deliveryFeeArs={deliveryFeePending ? 0 : ZONE_FEE}
      deliveryFeePending={deliveryFeePending}
    />
  );
}

describe("CustomerDetailsPanel", () => {
  it("pickup: no fee line, no address form", () => {
    render(<Harness />);

    expect(screen.queryByTestId("delivery-fee-line")).toBeNull();
    expect(screen.queryByTestId("delivery-address-form")).toBeNull();
  });

  it("delivery reveals the fee line and the address form", () => {
    render(<Harness fulfillment="delivery" />);

    expect(screen.getByTestId("delivery-fee-line")).not.toBeNull();
    expect(screen.getByTestId("delivery-address-form")).not.toBeNull();
  });

  it("switching back to pickup hides the fee line and address form again", () => {
    const { rerender } = render(<Harness fulfillment="delivery" />);
    expect(screen.getByTestId("delivery-fee-line")).not.toBeNull();

    rerender(<Harness fulfillment="pickup" />);

    expect(screen.queryByTestId("delivery-fee-line")).toBeNull();
    expect(screen.queryByTestId("delivery-address-form")).toBeNull();
  });

  it("pickup shows no Subtotal/Envío at all -- the grand Total lives in the drawer's footer now", () => {
    render(<Harness seedCart />);

    expect(screen.queryByText("Subtotal")).toBeNull();
    expect(screen.queryByText("Envío")).toBeNull();
  });

  it("delivery shows Subtotal and Envío without double-counting the fee", () => {
    // Regression test for the P0 bug: Subtotal used to read a `cart.total`
    // that already included the fee -- see hooks/__tests__/use-cart.test.ts
    // for the underlying subtotal-vs-total coverage.
    render(<Harness seedCart fulfillment="delivery" />);

    expect(screen.getByText("Subtotal").nextSibling?.textContent).toBe("$ 5.000");
    expect(screen.getByText("Envío").nextSibling?.textContent).toBe("$ 2.000");
  });

  it("delivery + fee pending: shows 'A confirmar' instead of a $0 fee, plus the WhatsApp-confirmation sentence", () => {
    render(<Harness seedCart fulfillment="delivery" deliveryFeePending />);

    expect(screen.getByText("Envío").nextSibling?.textContent).toBe("A confirmar");
    expect(
      screen.getByText(/te confirmamos el costo de env.o por whatsapp/i),
    ).not.toBeNull();
  });

  it("delivery + fee resolved: no pending sentence", () => {
    render(<Harness seedCart fulfillment="delivery" />);

    expect(
      screen.queryByText(/te confirmamos el costo de env.o por whatsapp/i),
    ).toBeNull();
  });
});
