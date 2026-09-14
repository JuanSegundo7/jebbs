import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { useCheckout } from "@/hooks/use-checkout";
import { CheckoutPanel } from "@/components/landing/checkout/checkout-panel";

// Radix Tabs activates on pointer-down (mousedown), not on the synthetic
// "click" event -- see @radix-ui/react-tabs' TabsTrigger onMouseDown
// handler. fireEvent.click alone never fires it.
function selectTab(name: RegExp) {
  fireEvent.mouseDown(screen.getByRole("tab", { name }));
}

function Harness() {
  const checkout = useCheckout();
  return <CheckoutPanel checkout={checkout} deliveryFeeArs={2000} />;
}

describe("CheckoutPanel", () => {
  it("defaults to pickup: no fee line, no address form, confirm enabled", () => {
    render(<Harness />);

    expect(screen.queryByTestId("delivery-fee-line")).toBeNull();
    expect(screen.queryByTestId("delivery-address-form")).toBeNull();
    expect(
      screen.getByRole("button", { name: /confirmar pedido/i }).hasAttribute(
        "disabled",
      ),
    ).toBe(false);
  });

  it("selecting delivery reveals the fee line and the address form", () => {
    render(<Harness />);

    selectTab(/envío a domicilio/i);

    expect(screen.getByTestId("delivery-fee-line")).not.toBeNull();
    expect(screen.getByTestId("delivery-address-form")).not.toBeNull();
  });

  it("disables 'Confirmar pedido' for delivery until phone and address are both filled", () => {
    render(<Harness />);

    selectTab(/envío a domicilio/i);
    const confirmButton = screen.getByRole("button", {
      name: /confirmar pedido/i,
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
