"use client";

import { useState } from "react";
import { Loader2, MessageCircle } from "lucide-react";
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

  const missingFieldsMessage =
    checkout.fulfillmentType === "delivery"
      ? "Completá nombre, teléfono y dirección para confirmar"
      : "Completá tu nombre para confirmar";

  return (
    <div className="space-y-2">
      {/* Botón primario -- mismo tratamiento que diner-btn-primary/
          diner-cta-glow (el CTA "Ver pedido" del rail), con el glow
          permanente propio que ya tenía diner-send. Native <button>, no
          el Button de shadcn: ese primitivo trae sombras/ring del sistema
          iOS/glass que no pertenecen a esta identidad -- mismo motivo que
          los inputs nativos en customer-name-field.tsx/
          delivery-details-form.tsx. */}
      <button
        type="button"
        className="mt-3 flex w-full cursor-pointer items-center justify-center gap-2 rounded-[10px] bg-[var(--accent-brand)] px-3 py-3 font-sans text-[1.05rem] font-semibold text-[var(--accent-contrast)] shadow-[0_0_32px_-8px_rgba(255,159,10,.35)] transition-[background-color,transform,box-shadow] duration-200 [transition-timing-function:cubic-bezier(0.16,1,0.3,1)] enabled:hover:-translate-y-0.5 enabled:hover:bg-[var(--accent-hover)] enabled:hover:shadow-[var(--shadow-md),0_0_40px_-6px_rgba(255,159,10,.45)] enabled:active:scale-[0.98] enabled:active:shadow-[var(--shadow-sm),0_0_26px_-6px_rgba(255,159,10,.4)] disabled:cursor-not-allowed disabled:bg-[var(--surface-2)] disabled:text-[var(--muted-foreground-dim)] disabled:shadow-none"
        disabled={!checkout.canConfirm || isPending}
        onClick={() => run()}
      >
        {isPending ? (
          <Loader2 className="size-4 animate-spin" aria-hidden />
        ) : (
          <MessageCircle className="size-4" aria-hidden />
        )}
        Confirmar pedido
      </button>

      {!checkout.canConfirm && !isPending && (
        <p className="text-center font-sans text-xs text-[var(--muted-foreground)]">
          {missingFieldsMessage}
        </p>
      )}

      {error && (
        <p className="font-sans text-xs text-[var(--destructive)]" role="alert">
          {error}
        </p>
      )}

      {whatsappUrl && (
        <a
          href={whatsappUrl}
          className="block text-center font-sans text-xs text-[var(--accent-brand)] underline underline-offset-2"
        >
          Si no te redirigió, tocá acá para abrir WhatsApp
        </a>
      )}
    </div>
  );
}
