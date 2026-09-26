import Image from "next/image";
import { Instagram, MessageCircle, MapPin } from "lucide-react";
import { COVERAGE_FALLBACK } from "@/lib/catalog/coverage-text";
import { env } from "@/lib/env";
import { BRAND_NAME } from "@/lib/brand";

const INSTAGRAM_URL = "https://www.instagram.com/jebbsburgers/";

// Colores de jebbs-dashboard (naranja/frío en vez de mostaza/carbón). Tres
// columnas planas, sin glass card (igual que antes). El número de WhatsApp
// sale de env.NEXT_PUBLIC_WHATSAPP_NUMBER (config real del proyecto), nunca
// un número hardcodeado copiado del sitio de referencia. Tipografía
// "diner" (font-condensed) restaurada por pedido del dueño.
export function SiteFooter({ coverage = COVERAGE_FALLBACK }: { coverage?: string }) {
  const whatsappHref = `https://wa.me/${env.NEXT_PUBLIC_WHATSAPP_NUMBER}`;

  return (
    <footer className="border-t border-[var(--hairline)] pt-10 pb-[30px]">
      <div className="diner-wrap flex flex-wrap items-start gap-[26px]">
        <Image
          src="/jebbs.png"
          alt={BRAND_NAME}
          width={150}
          height={150}
          sizes="96px"
          className="size-24 shrink-0 object-contain"
        />

        <div className="flex flex-col gap-[3px] text-[0.95rem] text-[var(--muted-foreground)]">
          <b className="mb-1 font-condensed text-[0.82rem] font-bold tracking-[.14em] text-[var(--foreground)] uppercase">
            Pedidos
          </b>
          <a
            href={whatsappHref}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-2 transition-colors hover:text-[var(--foreground)]"
          >
            <MessageCircle className="size-4" aria-hidden />
            WhatsApp
          </a>
        </div>

        <div className="flex flex-col gap-[3px] text-[0.95rem] text-[var(--muted-foreground)]">
          <b className="mb-1 font-condensed text-[0.82rem] font-bold tracking-[.14em] text-[var(--foreground)] uppercase">
            Redes
          </b>
          <a
            href={INSTAGRAM_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-2 transition-colors hover:text-[var(--foreground)]"
          >
            <Instagram className="size-4" aria-hidden />
            @jebbsburgers
          </a>
        </div>

        <div className="flex flex-col gap-[3px] text-[0.95rem] text-[var(--muted-foreground)]">
          <b className="mb-1 font-condensed text-[0.82rem] font-bold tracking-[.14em] text-[var(--foreground)] uppercase">
            Dónde
          </b>
          {/* TODO: copy real -- confirmar ubicación/horario exactos con el dueño */}
          <p className="flex items-start gap-2">
            <MapPin className="mt-0.5 size-4 shrink-0" aria-hidden />
            {coverage} · 20:00 a 00:00 hs
          </p>
        </div>
      </div>

      <p className="diner-wrap mt-10 font-condensed text-[11px] tracking-[.08em] text-[var(--muted-foreground-dim)] uppercase">
        © {new Date().getFullYear()} {BRAND_NAME}
      </p>
    </footer>
  );
}
