"use client";

import { useState } from "react";
import { Loader2, MessageCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useSingleFlight } from "@/hooks/use-single-flight";
import {
  buildCreateWebOrderRequest,
  type CartSelectionInput,
  type CheckoutSelectionInput,
} from "@/lib/order/build-cart-request";

interface ConfirmButtonProps {
  cart: CartSelectionInput;
  checkout: CheckoutSelectionInput & { canConfirm: boolean };
}

interface OrderConfirmationResponse {
  whatsapp_url: string;
}

interface OrderErrorResponse {
  error?: { message?: string };
}

// WU5 (tasks.md 7.4, design.md DD1): single-flight POST /api/orders, then
// same-tab navigation to the returned wa.me URL. window.open() after an
// await loses the user-gesture grant that triggered this handler and gets
// blocked as a popup on iOS Safari -- window.location.assign() in the same
// tab is never blocked. The rendered <a href> below is the visible fallback
// for the rare case location.assign doesn't navigate (or simply as a
// backup the customer can tap).
export function ConfirmButton({ cart, checkout }: ConfirmButtonProps) {
  const [whatsappUrl, setWhatsappUrl] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const { run, isPending } = useSingleFlight(async () => {
    setError(null);
    setWhatsappUrl(null);

    const body = buildCreateWebOrderRequest(cart, checkout);

    let response: Response;
    try {
      response = await fetch("/api/orders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
    } catch {
      setError("No pudimos conectar con el servidor. Probá de nuevo.");
      return;
    }

    if (!response.ok) {
      const payload = (await response.json().catch(() => null)) as OrderErrorResponse | null;
      setError(payload?.error?.message ?? "No se pudo confirmar el pedido.");
      return;
    }

    const data = (await response.json()) as OrderConfirmationResponse;
    setWhatsappUrl(data.whatsapp_url);
    window.location.assign(data.whatsapp_url);
  });

  return (
    <div className="space-y-2">
      <Button
        size="lg"
        className="w-full"
        disabled={!checkout.canConfirm || isPending}
        onClick={() => run()}
      >
        {isPending ? (
          <Loader2 className="size-4 animate-spin" aria-hidden />
        ) : (
          <MessageCircle className="size-4" aria-hidden />
        )}
        Confirmar pedido
      </Button>

      {error && (
        <p className="text-destructive text-footnote" role="alert">
          {error}
        </p>
      )}

      {whatsappUrl && (
        <a
          href={whatsappUrl}
          className="block text-center text-footnote text-primary underline underline-offset-2"
        >
          Si no te redirigió, tocá acá para abrir WhatsApp
        </a>
      )}
    </div>
  );
}
