import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { useCart } from "@/hooks/use-cart";
import { useCheckout } from "@/hooks/use-checkout";
import { CheckoutPanel } from "@/components/landing/checkout/checkout-panel";

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

// Radix Tabs activates on pointer-down (mousedown), not on the synthetic
// "click" event -- see @radix-ui/react-tabs' TabsTrigger onMouseDown
// handler. fireEvent.click alone never fires it.
function selectTab(name: RegExp) {
  fireEvent.mouseDown(screen.getByRole("tab", { name }));
}

function Harness() {
  const checkout = useCheckout();
  const cart = useCart({ meatExtra: MEAT_EXTRA, friesExtra: FRIES_EXTRA });
  return <CheckoutPanel cart={cart} checkout={checkout} deliveryFeeArs={2000} />;
}

describe("CheckoutPanel", () => {
  it("defaults to pickup, no fee line, no address form, confirm disabled until name is filled", () => {
    render(<Harness />);

    expect(screen.queryByTestId("delivery-fee-line")).toBeNull();
    expect(screen.queryByTestId("delivery-address-form")).toBeNull();
    const confirmButton = screen.getByRole("button", { name: /confirmar pedido/i });
    expect(confirmButton.hasAttribute("disabled")).toBe(true);

    fireEvent.change(screen.getByLabelText(/^nombre$/i), {
      target: { value: "Juan" },
    });
    expect(confirmButton.hasAttribute("disabled")).toBe(false);
  });

  it("selecting delivery reveals the fee line and the address form", () => {
    render(<Harness />);

    selectTab(/envío a domicilio/i);

    expect(screen.getByTestId("delivery-fee-line")).not.toBeNull();
    expect(screen.getByTestId("delivery-address-form")).not.toBeNull();
  });

  it("disables 'Confirmar pedido' for delivery until name, phone and address are all filled", () => {
    render(<Harness />);

    selectTab(/envío a domicilio/i);
    const confirmButton = screen.getByRole("button", {
      name: /confirmar pedido/i,
    });
    expect(confirmButton.hasAttribute("disabled")).toBe(true);

    fireEvent.change(screen.getByLabelText(/^nombre$/i), {
      target: { value: "Juan" },
    });
    expect(confirmButton.hasAttribute("disabled")).toBe(true);

    fireEvent.change(screen.getByLabelText(/teléfono/i), {
      target: { value: "3454123456" },
    });
    expect(confirmButton.hasAttribute("disabled")).toBe(true);

    fireEvent.change(screen.getByLabelText(/dirección/i), {
      target: { value: "San Martín 123" },
    });
    expect(confirmButton.hasAttribute("disabled")).toBe(false);
  });

  it("switching back to pickup hides the fee line and address form again", () => {
    render(<Harness />);

    selectTab(/envío a domicilio/i);
    expect(screen.getByTestId("delivery-fee-line")).not.toBeNull();

    selectTab(/retiro en el local/i);

    expect(screen.queryByTestId("delivery-fee-line")).toBeNull();
    expect(screen.queryByTestId("delivery-address-form")).toBeNull();
  });
});
