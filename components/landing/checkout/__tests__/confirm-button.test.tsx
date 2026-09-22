import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { useCart } from "@/hooks/use-cart";
import { useCheckout } from "@/hooks/use-checkout";
import { useEffect } from "react";
import { ConfirmButton } from "@/components/landing/checkout/confirm-button";

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

// canConfirm requires a non-empty customerName (design.md's customer.name
// is mandatory for every order) -- the harness fills it via an effect so
// the confirm button starts enabled, matching a real checkout where the
// visitor already typed their name.
function Harness() {
  const checkout = useCheckout();
  const cart = useCart({ meatExtra: MEAT_EXTRA, friesExtra: FRIES_EXTRA });

  useEffect(() => {
    checkout.setCustomerName("Juan");
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return <ConfirmButton cart={cart} checkout={checkout} />;
}

describe("ConfirmButton", () => {
  const assignMock = vi.fn();

  beforeEach(() => {
    vi.stubGlobal("fetch", vi.fn());
    assignMock.mockClear();
    // jsdom's window.location.assign is not directly spy-able/redefinable
    // (throws "Cannot redefine property") -- replacing the whole `location`
    // object is the documented workaround.
    Object.defineProperty(window, "location", {
      value: { ...window.location, assign: assignMock },
      writable: true,
      configurable: true,
    });
  });

  it("disables the confirm button while the request is in flight", async () => {
    let resolveFetch!: (value: Response) => void;
    (global.fetch as ReturnType<typeof vi.fn>).mockReturnValue(
      new Promise((resolve) => {
        resolveFetch = resolve;
      }),
    );

    render(<Harness />);
    const button = await screen.findByRole("button", { name: /enviar pedido por whatsapp/i });
    expect(button.hasAttribute("disabled")).toBe(false);

    fireEvent.click(button);
    expect(button.hasAttribute("disabled")).toBe(true);

    resolveFetch({
      ok: true,
      json: async () => ({ whatsapp_url: "https://wa.me/5493454123456?text=abc" }),
    } as Response);

    await waitFor(() => expect(button.hasAttribute("disabled")).toBe(false));
  });

  it("renders the fallback anchor with the correct href once the API responds", async () => {
    (global.fetch as ReturnType<typeof vi.fn>).mockResolvedValue({
      ok: true,
      json: async () => ({
        whatsapp_url: "https://wa.me/5493454123456?text=hola",
      }),
    } as Response);

    render(<Harness />);
    const button = await screen.findByRole("button", { name: /enviar pedido por whatsapp/i });
    fireEvent.click(button);

    const link = await screen.findByRole("link");
    expect(link.getAttribute("href")).toBe(
      "https://wa.me/5493454123456?text=hola",
    );
    expect(assignMock).toHaveBeenCalledWith(
      "https://wa.me/5493454123456?text=hola",
    );
  });
});
