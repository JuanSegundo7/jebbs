import { Instagram, MessageCircle, MapPin } from "lucide-react";
import { env } from "@/lib/env";

const INSTAGRAM_URL = "https://www.instagram.com/jebbsburgers/";

// Closing footer (reference site: jebbs-burgers.vercel.app) -- three plain
// columns instead of a floating glass card. The WhatsApp number comes from
// env.NEXT_PUBLIC_WHATSAPP_NUMBER (real project config), never a hardcoded
// number copied from the reference site.
export function SiteFooter() {
  const whatsappHref = `https://wa.me/${env.NEXT_PUBLIC_WHATSAPP_NUMBER}`;

  return (
    <footer className="border-t border-[var(--line)] bg-[var(--coal)] px-6 py-12">
      <div className="mx-auto grid max-w-5xl gap-8 sm:grid-cols-3">
        <div className="space-y-3">
          <h3 className="font-condensed text-xs font-bold tracking-[.14em] text-[var(--cheddar)] uppercase">
            Pedidos
          </h3>
          <a
            href={whatsappHref}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-2 font-body text-sm text-[var(--ash)] transition-colors hover:text-[var(--cream)]"
          >
            <MessageCircle className="size-4" aria-hidden />
            WhatsApp
          </a>
        </div>

        <div className="space-y-3">
          <h3 className="font-condensed text-xs font-bold tracking-[.14em] text-[var(--cheddar)] uppercase">
            Redes
          </h3>
          <a
            href={INSTAGRAM_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-2 font-body text-sm text-[var(--ash)] transition-colors hover:text-[var(--cream)]"
          >
            <Instagram className="size-4" aria-hidden />
            @jebbsburgers
          </a>
        </div>

        <div className="space-y-3">
          <h3 className="font-condensed text-xs font-bold tracking-[.14em] text-[var(--cheddar)] uppercase">
            Dónde
          </h3>
          {/* TODO: copy real -- confirmar ubicación/horario exactos con el dueño */}
          <p className="flex items-start gap-2 font-body text-sm text-[var(--ash)]">
            <MapPin className="mt-0.5 size-4 shrink-0" aria-hidden />
            Gonnet y City Bell · 20:00 a 00:00 hs
          </p>
        </div>
      </div>

      <p className="mx-auto mt-10 max-w-5xl font-condensed text-[11px] tracking-[.08em] text-[var(--ash-dim)] uppercase">
        © {new Date().getFullYear()} Jebbs Burger&apos;s
      </p>
    </footer>
  );
}
