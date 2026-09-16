import Image from "next/image";
import type { Burger } from "@/lib/types";
import { BurgerIllustration } from "./burger-illustration";

interface HeroProps {
  /** Best-effort "hero shot" for the page -- the first available burger with
   * an image_url, chosen by the caller (app/page.tsx). null/undefined falls
   * back to the BurgerIllustration SVG instead of a broken <img>. */
  featuredBurger?: Burger | null;
}

// "Diner" hero -- transcripción fiel de ref-style.css:54-71 (.hero/.wrap/
// h1/.lede/.cta/.btn/.shot): grid 1.05fr/.95fr con gap 44px, h1 en
// clamp(2.5rem,6.2vw,4.2rem) leading .94, lede a 44ch, dos CTAs
// (btn-primary + btn-ghost) y la foto con el badge ember flotando en el
// borde inferior. Reemplaza el grid genérico max-w-5xl/md:grid-cols
// anterior.
export function Hero({ featuredBurger }: HeroProps) {
  return (
    <header id="top" className="relative scroll-mt-20 overflow-hidden border-b border-[var(--line)]">
      {/* Marca de agua decorativa: la ilustración real de ref-burger.svg
          siempre está presente en el hero (no solo como fallback de foto
          faltante) -- el catálogo real ya tiene fotos subidas, así que el
          "no hay foto" nunca ocurre en prod. aria-hidden porque es
          puramente decorativa; el nombre del producto ya lo dice el <h1>. */}
      <BurgerIllustration
        aria-hidden
        className="pointer-events-none absolute -top-16 -right-16 hidden h-80 w-80 opacity-[0.12] md:block"
      />
      <div className="diner-wrap relative grid gap-9 py-14 sm:py-20 md:grid-cols-[1.05fr_0.95fr] md:items-center md:gap-11 md:py-[56px]">
        <div>
          {/* TODO: confirmar con el dueño la ubicación real (barrio/zona) que va acá */}
          <p className="diner-eyebrow text-center md:text-left">
            Delivery y take away · Gonnet y City Bell
          </p>

          {/* TODO: copy real a confirmar con el dueño -- este es un punto de
              partida fiel al tono del sitio de referencia (Archivo Black +
              segunda línea en cheddar), no el texto final. */}
          <h1 className="mt-3.5 text-center font-display text-[clamp(2.5rem,6.2vw,4.2rem)] leading-[0.94] tracking-[-0.015em] text-[var(--cream)] md:text-left">
            Doble cheddar,
            <br />
            <span className="text-[var(--cheddar)]">sin vueltas.</span>
          </h1>

          <p className="mx-auto mt-[18px] max-w-[44ch] text-center font-body text-[1.09rem] leading-relaxed text-[var(--ash)] md:mx-0 md:text-left">
            Armá tu pedido y confirmalo por WhatsApp. Sin cuentas, sin apps —
            elegí, confirmá y listo.
          </p>

          <div className="mt-[26px] flex flex-wrap justify-center gap-3 md:justify-start">
            <a href="#menu" className="diner-btn diner-btn-primary">
              Armar mi pedido
            </a>
            <a
              href="#opiniones"
              className="diner-btn diner-btn-ghost"
            >
              Ver opiniones
            </a>
          </div>
        </div>

        <figure className="relative mx-auto mb-3 w-full max-w-sm md:mb-0">
          <div className="relative aspect-square w-full overflow-hidden rounded-[4px] border border-[var(--line)] bg-[var(--soot)]">
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
              <div className="flex h-full w-full items-center justify-center p-8">
                <BurgerIllustration className="h-full w-full" />
              </div>
            )}
          </div>
          <figcaption className="diner-shot-caption">
            {featuredBurger?.name ?? "Doble cheddar"}
          </figcaption>
        </figure>
      </div>
    </header>
  );
}
