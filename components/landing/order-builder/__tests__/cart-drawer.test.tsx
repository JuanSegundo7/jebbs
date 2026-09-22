import { useEffect } from "react";
import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { useCart } from "@/hooks/use-cart";
import { useCheckout } from "@/hooks/use-checkout";
import { CartDrawer } from "@/components/landing/order-builder/cart-drawer";
import type { Burger, DeliveryZone, Extra } from "@/lib/types";

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

const SIDE: Extra = {
  id: "side-1",
  name: "Papas",
  category: "sides",
  price: 2000,
  is_available: true,
  created_at: "2024-01-01",
};

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

function Harness() {
  const checkout = useCheckout();
  const isDelivery = checkout.fulfillmentType === "delivery";
  const deliveryFeePending = isDelivery && !checkout.deliveryZoneId;
  const resolvedFee = isDelivery && checkout.deliveryZoneId ? ZONE_FEE : 0;
  // Mirrors order-builder.tsx's real wiring -- see the same note in
  // customer-details-panel.test.tsx's Harness.
  const cart = useCart({
    meatExtra: MEAT_EXTRA,
    friesExtra: FRIES_EXTRA,
    deliveryType: checkout.fulfillmentType,
    deliveryFee: resolvedFee,
  });
  useEffect(() => {
    cart.burgers.addBurger(BURGER);
    cart.sides.addSide(SIDE);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  return (
    <CartDrawer
      cart={cart}
      checkout={checkout}
      deliveryFeeArs={resolvedFee}
      deliveryFeePending={deliveryFeePending}
      deliveryZones={[DELIVERY_ZONE]}
      minDeliveryFeeArs={ZONE_FEE}
      meatExtra={MEAT_EXTRA}
      friesExtra={FRIES_EXTRA}
      toppingExtras={[]}
      upsellExtras={[]}
    />
  );
}

function openDrawer() {
  fireEvent.click(screen.getByRole("button", { name: /ver pedido/i }));
}

function selectDeliveryTab() {
  fireEvent.mouseDown(screen.getByRole("tab", { name: /envío a domicilio/i }));
}

// Native <select>, not a Radix control -- a plain fireEvent.change is
// correct here (unlike selectDeliveryTab's mousedown above).
function selectZone() {
  fireEvent.change(screen.getByLabelText(/zona de envío/i), {
    target: { value: DELIVERY_ZONE.id },
  });
}

// Anchored /^continuar$/i -- the ChevronRight icon is aria-hidden, so the
// accessible name is just "Continuar"; an unanchored regex risks matching
// future copy. This is a real <button onClick>, not a Radix Tab, so
// fireEvent.click (not mousedown) is correct here.
function goToStep2() {
  fireEvent.click(screen.getByRole("button", { name: /^continuar$/i }));
}
function goBackToStep1() {
  fireEvent.click(screen.getByRole("button", { name: /volver/i }));
}

describe("CartDrawer -- editing items (step 1)", () => {
  it("increments and decrements a burger's quantity from the cart row", () => {
    render(<Harness />);
    openDrawer();

    fireEvent.click(screen.getByRole("button", { name: "Agregar uno de Clásica" }));

    expect(screen.getByText(/2x Clásica/i)).not.toBeNull();
  });

  it("removes a side from the cart and returns to the empty state once it's the last item", () => {
    render(<Harness />);
    openDrawer();

    const removeBurger = screen.getByRole("button", { name: "Eliminar Clásica" });
    fireEvent.click(removeBurger);
    const removeSide = screen.getByRole("button", { name: "Eliminar Papas" });
    fireEvent.click(removeSide);

    expect(screen.getByText(/todavia no agregaste nada/i)).not.toBeNull();
  });

  it("'Editar' toggles BurgerCustomizePanel for a burger already in the cart", () => {
    render(<Harness />);
    openDrawer();

    // addBurger auto-expands the newly added item (same as the picker's
    // "Personalizá tu pedido" list), so the panel starts open here.
    expect(screen.getByText(/versión veggie/i)).not.toBeNull();

    fireEvent.click(screen.getByRole("button", { name: /editar/i }));
    expect(screen.queryByText(/versión veggie/i)).toBeNull();

    fireEvent.click(screen.getByRole("button", { name: /editar/i }));
    expect(screen.getByText(/versión veggie/i)).not.toBeNull();
  });

  it("sides have no 'Editar' affordance (no customization panel exists for them yet)", () => {
    render(<Harness />);
    openDrawer();

    // "Editar" only appears once, for the burger row -- sides render a
    // stepper + trash but no expand toggle.
    expect(screen.getAllByRole("button", { name: /editar/i })).toHaveLength(1);
  });
});

describe("CartDrawer -- step 2 (Tus datos): validation + footer Total", () => {
  it("shows the grand Total in the footer and updates it once delivery adds its fee", () => {
    render(<Harness />);
    openDrawer();

    // Clásica (5000) + Papas (2000), pickup -- no fee yet. RTL's default
    // text normalizer collapses formatArs' NBSP to a plain space, so match
    // loosely on the digits rather than the exact separator character.
    expect(screen.getByText(/Total.*7\.000/)).not.toBeNull();

    selectDeliveryTab();
    selectZone();

    expect(screen.getByText(/Total.*9\.000/)).not.toBeNull();
  });

  it("confirm button is always enabled; an incomplete tap focuses and flags the name field instead of doing nothing", () => {
    const fetchSpy = vi.spyOn(globalThis, "fetch");
    render(<Harness />);
    openDrawer();
    goToStep2();

    const confirmButton = screen.getByRole("button", { name: /enviar pedido por whatsapp/i });
    expect(confirmButton.hasAttribute("disabled")).toBe(false);

    const nameInput = screen.getByLabelText(/^nombre$/i);
    fireEvent.click(confirmButton);

    expect(document.activeElement).toBe(nameInput);
    expect(nameInput.getAttribute("aria-invalid")).toBe("true");
    expect(fetchSpy).not.toHaveBeenCalled();

    fireEvent.change(nameInput, { target: { value: "Juan" } });
    expect(nameInput.getAttribute("aria-invalid")).toBe("false");

    fetchSpy.mockRestore();
  });

  it("delivery: an incomplete tap walks the focus through name -> phone -> dirección as each is filled", () => {
    const fetchSpy = vi.spyOn(globalThis, "fetch");
    render(<Harness />);
    openDrawer();
    selectDeliveryTab();
    selectZone();
    goToStep2();

    const confirmButton = screen.getByRole("button", { name: /enviar pedido por whatsapp/i });
    const nameInput = screen.getByLabelText(/^nombre$/i);
    const phoneInput = screen.getByLabelText(/teléfono/i);
    const addressInput = screen.getByLabelText(/dirección/i);

    fireEvent.click(confirmButton);
    expect(document.activeElement).toBe(nameInput);

    fireEvent.change(nameInput, { target: { value: "Juan" } });
    fireEvent.click(confirmButton);
    expect(document.activeElement).toBe(phoneInput);

    fireEvent.change(phoneInput, { target: { value: "3454123456" } });
    fireEvent.click(confirmButton);
    expect(document.activeElement).toBe(addressInput);

    expect(fetchSpy).not.toHaveBeenCalled();

    fireEvent.change(addressInput, { target: { value: "San Martín 123" } });
    expect(addressInput.getAttribute("aria-invalid")).toBe("false");

    fetchSpy.mockRestore();
  });

  it("delivery: 'Continuar' with no zone chosen never leaves step 1 -- flags the zone picker instead", () => {
    const fetchSpy = vi.spyOn(globalThis, "fetch");
    render(<Harness />);
    openDrawer();
    selectDeliveryTab();
    // No selectZone() -- this is the whole point of the test. Clicking
    // "Continuar" here is the SAME button goToStep2() clicks -- it must
    // refuse to advance, not silently land on step 2 showing "Envío: A
    // confirmar" as if the customer had chosen that on purpose
    // (resolveDeliveryFee treats "never touched the picker" identically to
    // "picked no encuentro mi zona" -- both are deliveryZoneId === null).
    goToStep2();

    const zonePicker = screen.getByLabelText(/zona de envío/i);
    expect(screen.getByText(/paso 1 de 2/i)).not.toBeNull();
    expect(screen.queryByLabelText(/^nombre$/i)).toBeNull();
    expect(zonePicker.getAttribute("aria-invalid")).toBe("true");
    expect(document.activeElement).toBe(zonePicker);
    expect(fetchSpy).not.toHaveBeenCalled();

    // Choosing a zone now and retrying actually advances.
    selectZone();
    goToStep2();
    expect(screen.getByText(/paso 2 de 2/i)).not.toBeNull();

    fetchSpy.mockRestore();
  });

  // Defense in depth: order-preferences.tsx (step 1) is the only place the
  // zone picker renders, and "Continuar" (above) already refuses to leave
  // step 1 without a zone, so this path is unreachable through normal
  // interaction today. ConfirmButton's requestValidation is still wrapped
  // in cart-drawer.tsx to bounce back to step 1 if it ever fires with
  // "zone" missing regardless -- cheap insurance against a future
  // navigation path (e.g. a deep link) reaching step 2 some other way.
  // Not covered by an interaction test since there is currently no way to
  // *reach* step 2 in that state to exercise it.
});

describe("CartDrawer -- wizard navigation", () => {
  it("step 1 has no name field and no confirm button", () => {
    render(<Harness />);
    openDrawer();

    expect(screen.queryByLabelText(/^nombre$/i)).toBeNull();
    expect(screen.queryByRole("button", { name: /enviar pedido por whatsapp/i })).toBeNull();
  });

  it("goToStep2 reveals the name field + confirm button and hides the item steppers/'Seguir eligiendo'", () => {
    render(<Harness />);
    openDrawer();
    goToStep2();

    expect(screen.getByLabelText(/^nombre$/i)).not.toBeNull();
    expect(screen.getByRole("button", { name: /enviar pedido por whatsapp/i })).not.toBeNull();
    expect(screen.queryByRole("button", { name: "Agregar uno de Clásica" })).toBeNull();
    expect(screen.queryByRole("button", { name: /seguir eligiendo/i })).toBeNull();
  });

  it("goBackToStep1 restores the item list and preserves what was already entered", () => {
    render(<Harness />);
    openDrawer();
    selectDeliveryTab();
    selectZone();
    goToStep2();
    fireEvent.change(screen.getByLabelText(/^nombre$/i), { target: { value: "Juan" } });

    goBackToStep1();
    expect(screen.getByRole("button", { name: "Agregar uno de Clásica" })).not.toBeNull();
    expect(screen.getByRole("tab", { name: /envío a domicilio/i }).getAttribute("aria-selected")).toBe(
      "true",
    );

    goToStep2();
    expect((screen.getByLabelText(/^nombre$/i) as HTMLInputElement).value).toBe("Juan");
  });

  it("'Continuar' is disabled once the cart is emptied", () => {
    render(<Harness />);
    openDrawer();

    fireEvent.click(screen.getByRole("button", { name: "Eliminar Clásica" }));
    fireEvent.click(screen.getByRole("button", { name: "Eliminar Papas" }));

    expect(screen.getByRole("button", { name: /^continuar$/i }).hasAttribute("disabled")).toBe(true);
  });

  it("closing on step 2 and reopening lands back on step 1", () => {
    render(<Harness />);
    openDrawer();
    goToStep2();

    fireEvent.click(screen.getByRole("button", { name: /cerrar/i }));
    // Radix's Presence keeps the outgoing dialog mounted -- and the rest of
    // the page marked aria-hidden via its "hide others" side effect -- until
    // a real `animationend` fires on the content node. tw-animate-css ships
    // actual @keyframes, so jsdom's getComputedStyle reports a real
    // animationName and Presence waits for that event; jsdom never dispatches
    // it, so this state never resolves here (no amount of waitFor helps).
    // `hidden: true` bypasses the ARIA-visibility filter -- it's still the
    // same trigger button and click handler, just reachable synchronously in
    // this environment. data-state has already flipped to "closed" by this
    // point, so the click re-opens a fresh drawer as expected.
    fireEvent.click(screen.getByRole("button", { name: /ver pedido/i, hidden: true }));

    expect(screen.getByRole("button", { name: "Agregar uno de Clásica" })).not.toBeNull();
    expect(screen.queryByLabelText(/^nombre$/i)).toBeNull();
  });

  it("Total is present and correct on step 2 too", () => {
    render(<Harness />);
    openDrawer();
    goToStep2();

    expect(screen.getByText(/Total.*7\.000/)).not.toBeNull();
  });
});
