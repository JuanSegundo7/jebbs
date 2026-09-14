"use client";

import { MessageCircle } from "lucide-react";
import { Button } from "@/components/ui/button";

// Visual placeholder only (WU3, tasks.md 4.6). The real flow -- building the
// WhatsApp message from a confirmed order and redirecting to wa.me -- is
// WU5, wired to POST /api/orders' response (WU4). This CTA intentionally
// does nothing yet beyond a console note, so it isn't mistaken for a dead
// link once the page is live before WU5 lands.
export function WhatsappCta() {
  return (
    <div className="mx-auto max-w-5xl px-6 py-8 text-center">
      <Button
        size="lg"
        onClick={() => {
          console.log("[whatsapp-cta] placeholder -- real flow lands in WU5");
        }}
      >
        <MessageCircle />
        Pedir por WhatsApp
      </Button>
    </div>
  );
}
