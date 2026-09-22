import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { useCheckout } from "@/hooks/use-checkout";
import { OrderPreferences } from "@/components/landing/checkout/order-preferences";
import type { DeliveryZone } from "@/lib/types";

// Radix Tabs activates on pointer-down (mousedown), not on the synthetic
// "click" event -- see @radix-ui/react-tabs' TabsTrigger onMouseDown
// handler. fireEvent.click alone never fires it.
function selectTab(name: RegExp) {
  fireEvent.mouseDown(screen.getByRole("tab", { name }));
}

const ZONE_FEE = 2000;

const DELIVERY_ZONE: DeliveryZone = {
  id: "zone-1",
  name: "City Bell",
  description: "Casco y alrededores",
  fee: ZONE_FEE,
  is_active: true,
  sort_order: 1,
  map_zone_key: "z1",
  map_polygon: null,
};

// No cart needed here -- OrderPreferences (step 1 of the cart wizard) only
// touches the fulfillment/payment toggles, not the item selection.
function Harness() {
  const checkout = useCheckout();
  return (
    <OrderPreferences
      checkout={checkout}
      deliveryZones={[DELIVERY_ZONE]}
      minDeliveryFeeArs={ZONE_FEE}
    />
  );
}

describe("OrderPreferences", () => {
  it("shows the delivery fee on the fulfillment toggle itself", () => {
    render(<Harness />);

    expect(screen.getByRole("tab", { name: /envío a domicilio/i })).not.toBeNull();
    expect(screen.getByText("Sin cargo")).not.toBeNull();
    // formatArs uses NBSP, which RTL's default text normalizer collapses to
    // a plain space -- match loosely on the digits rather than the exact
    // separator character (same pattern used across this test suite).
    expect(screen.getByText(/2\.000/)).not.toBeNull();
  });

  it("shows a payment method selector, defaulting to Efectivo, always visible", () => {
    render(<Harness />);

    const cashTab = screen.getByRole("tab", { name: /efectivo/i });
    const transferTab = screen.getByRole("tab", { name: /transferencia/i });
    expect(cashTab.getAttribute("aria-selected")).toBe("true");
    expect(transferTab.getAttribute("aria-selected")).toBe("false");

    // Not gated on fulfillment type -- still visible for pickup, and
    // switching to delivery doesn't hide or reset it.
    selectTab(/envío a domicilio/i);
    expect(screen.getByRole("tab", { name: /efectivo/i })).not.toBeNull();

    fireEvent.mouseDown(transferTab);
    expect(screen.getByRole("tab", { name: /transferencia/i }).getAttribute("aria-selected")).toBe(
      "true",
    );
  });

  it("shows the delivery zone picker only while fulfillmentType === 'delivery'", () => {
    render(<Harness />);

    expect(screen.queryByLabelText(/zona de envío/i)).toBeNull();

    selectTab(/envío a domicilio/i);
    expect(screen.getByLabelText(/zona de envío/i)).not.toBeNull();
    expect(screen.getByText(/city bell/i)).not.toBeNull();

    selectTab(/retiro en el local/i);
    expect(screen.queryByLabelText(/zona de envío/i)).toBeNull();
  });
});
