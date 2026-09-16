import Image from "next/image";
import { Beef } from "lucide-react";
import type { Burger } from "@/lib/types";

interface HeroProps {
  /** Best-effort "hero shot" for the page -- the first available burger with
   * an image_url, chosen by the caller (app/page.tsx). null/undefined falls
   * back to a design-system placeholder tile, never a broken <img>. */
  featuredBurger?: Burger | null;
}

// "Diner" hero (reference site: jebbs-burgers.vercel.app): eyebrow in
// cheddar, Archivo Black display headline with an italic second line,
// descriptive copy in Barlow, CTA into the menu. Replaces the previous
// glass card + Pacifico wordmark treatment.
export function Hero({ featuredBurger }: HeroProps) {
  return (
    <section id="top" className="scroll-mt-20 bg-[var(--coal)] px-6 pt-14 pb-16 sm:pt-20">
      <div className="mx-auto grid max-w-5xl gap-10 md:grid-cols-[1.05fr_0.95fr] md:items-center">
        <div className="space-y-6 text-center md:text-left">
          {/* TODO: confirmar con el dueño la ubicación real (barrio/zona) que va acá */}
          <p className="font-condensed text-[13px] font-bold tracking-[.18em] text-[var(--cheddar)] uppercase">
            Delivery y take away · Gonnet y City Bell
          </p>

          {/* TODO: copy real a confirmar con el dueño -- este es un punto de
              partida fiel al tono del sitio de referencia (Archivo Black +
              segunda línea en itálica), no el texto final. */}
          <h1 className="font-display text-[2.75rem] leading-[0.95] text-[var(--cream)] sm:text-[3.75rem]">
            Doble cheddar,
            <br />
            <em className="font-body italic text-[var(--ember)]">
              sin vueltas.
            </em>
          </h1>

          <p className="mx-auto max-w-xl font-body text-[15px] leading-relaxed text-[var(--ash)] md:mx-0">
            Armá tu pedido y confirmalo por WhatsApp. Sin cuentas, sin apps —
            elegí, confirmá y listo.
          </p>

          <div className="flex justify-center md:justify-start">
            <a
              href="#menu"
              className="inline-flex items-center gap-2 rounded-full bg-[var(--cheddar)] px-7 py-3 font-condensed text-sm font-bold tracking-[.08em] text-[var(--coal)] uppercase transition-colors hover:bg-[var(--cheddar-dim)] active:scale-[0.97]"
            >
              Ver el menú
            </a>
          </div>
        </div>

        <div className="relative mx-auto aspect-square w-full max-w-sm overflow-hidden rounded-3xl border border-[var(--line)] bg-[var(--soot)]">
          {featuredBurger?.image_url ? (
            <Image
              src={featuredBurger.image_url}
              alt={featuredBurger.name}
              fill
              sizes="(min-width: 768px) 24rem, 80vw"
              className="object-cover"
              priority
            />
          ) : (
            <div className="flex h-full w-full items-center justify-center">
              <Beef className="size-20 text-[var(--ash-dim)]" strokeWidth={1.25} aria-hidden />
            </div>
          )}
        </div>
      </div>
    </section>
  );
}
