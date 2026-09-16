import { Instagram, MessageCircle, MapPin } from "lucide-react";
import { env } from "@/lib/env";

const INSTAGRAM_URL = "https://www.instagram.com/jebbsburgers/";

// Closing footer -- transcripción de ref-style.css:234-239 (footer/.fcol):
// padding 40px 0 30px, wrap real (no max-w-5xl), .fcol a .95rem/label
// .82rem tracking .14em. Tres columnas planas, sin glass card. El número
// de WhatsApp sale de env.NEXT_PUBLIC_WHATSAPP_NUMBER (config real del
// proyecto), nunca un número hardcodeado copiado del sitio de referencia.
export function SiteFooter() {
  const whatsappHref = `https://wa.me/${env.NEXT_PUBLIC_WHATSAPP_NUMBER}`;

  return (
    <footer className="border-t border-[var(--line)] pt-10 pb-[30px]">
      <div className="diner-wrap flex flex-wrap items-start gap-[26px]">
        <div className="flex flex-col gap-[3px] text-[0.95rem] text-[var(--ash)]">
          <b className="mb-1 font-condensed text-[0.82rem] font-bold tracking-[.14em] text-[var(--cream)] uppercase">
            Pedidos
          </b>
          <a
            href={whatsappHref}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-2 transition-colors hover:text-[var(--cream)]"
          >
            <MessageCircle className="size-4" aria-hidden />
            WhatsApp
          </a>
        </div>

        <div className="flex flex-col gap-[3px] text-[0.95rem] text-[var(--ash)]">
          <b className="mb-1 font-condensed text-[0.82rem] font-bold tracking-[.14em] text-[var(--cream)] uppercase">
            Redes
          </b>
          <a
            href={INSTAGRAM_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-2 transition-colors hover:text-[var(--cream)]"
          >
            <Instagram className="size-4" aria-hidden />
            @jebbsburgers
          </a>
        </div>

        <div className="flex flex-col gap-[3px] text-[0.95rem] text-[var(--ash)]">
          <b className="mb-1 font-condensed text-[0.82rem] font-bold tracking-[.14em] text-[var(--cream)] uppercase">
            Dónde
          </b>
          {/* TODO: copy real -- confirmar ubicación/horario exactos con el dueño */}
          <p className="flex items-start gap-2">
            <MapPin className="mt-0.5 size-4 shrink-0" aria-hidden />
            Gonnet y City Bell · 20:00 a 00:00 hs
          </p>
        </div>
      </div>

      <p className="diner-wrap mt-10 font-condensed text-[11px] tracking-[.08em] text-[var(--ash-dim)] uppercase">
        © {new Date().getFullYear()} Jebbs Burger&apos;s
      </p>
    </footer>
  );
}
