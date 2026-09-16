import { MessageCircle } from "lucide-react";
import { Button } from "@/components/ui/button";

// Closing section for the page. The REAL order-confirmation -> WhatsApp
// handoff already lives in checkout/confirm-button.tsx (WU5, wired from the
// floating cart button); this component predates that flow and used to be a
// fake button that only logged to the console. Rather than invent a second,
// parallel "message us" flow with guessed copy/number formatting, this is
// now a real navigation back to the menu -- the floating cart button
// (order-builder/cart-drawer.tsx) stays reachable from anywhere on the page
// and is what actually opens WhatsApp once an order is confirmed.
export function WhatsappCta() {
  return (
    <div className="mx-auto max-w-5xl px-6 py-12 text-center">
      <div className="ios-glass mx-auto max-w-md space-y-4 rounded-3xl p-8">
        <MessageCircle className="mx-auto size-8 text-accent-foreground" aria-hidden />
        <p className="text-subheadline text-muted-foreground">
          Cuando termines de armar tu pedido, confirmalo desde el carrito y te
          llevamos directo a WhatsApp.
        </p>
        <Button size="lg" asChild>
          <a href="#menu">
            <MessageCircle />
            Ir al menú
          </a>
        </Button>
      </div>
    </div>
  );
}
