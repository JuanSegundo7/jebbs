import Image from "next/image";
import { COVERAGE_FALLBACK } from "@/lib/catalog/coverage-text";
import type { Burger } from "@/lib/types";
import { BurgerIllustration } from "./burger-illustration";

interface HeroProps {
  /** Best-effort "hero shot" for the page -- the first available burger with
   * an image_url, chosen by the caller (app/page.tsx). null/undefined falls
   * back to the BurgerIllustration SVG instead of a broken <img>. */
  featuredBurger?: Burger | null;
  /** Coverage label built from the active delivery zones (coverageLabel). */
  coverage?: string;
}

// Colores de la identidad de jebbs-dashboard (naranja/frío sobre negro
// azulado) + tipografía "diner" restaurada por pedido del dueño
// (font-display/font-condensed en vez de font-sans, valores exactos de
// diner-eyebrow/diner-shot-caption en globals.css). Estructura/JSX/textos/
// imagen/props idénticos al pase anterior. Foto: ios-shadow-lg (la sombra
// "hero" real del dashboard, Card depth="hero") en vez de la sombra a mano
// diner-hero-shot.
export function Hero({ featuredBurger, coverage = COVERAGE_FALLBACK }: HeroProps) {
  return (
    <header id="top" className="relative scroll-mt-20 overflow-hidden border-b border-[var(--hairline)]">
      {/* Marca de agua decorativa: la ilustración real de ref-burger.svg
          siempre está presente en el hero (no solo como fallback de foto
          faltante) -- el catálogo real ya tiene fotos subidas, así que el
          "no hay foto" nunca ocurre en prod. aria-hidden porque es
          puramente decorativa; el nombre del producto ya lo dice el <h1>. */}
      <Image
        src="/jebbs.png"
        alt=""
        aria-hidden
        width={150}
        height={150}
        sizes="320px"
        className="pointer-events-none absolute top-6 right-6 hidden h-72 w-72 object-contain opacity-[0.08] md:block"
      />
      <div className="diner-wrap relative grid gap-9 py-14 sm:py-20 md:grid-cols-[1.05fr_0.95fr] md:items-center md:gap-11 md:py-[56px]">
        <div>
          {/* TODO: confirmar con el dueño la ubicación real (barrio/zona) que va acá */}
          <p className="text-center font-condensed text-[0.82rem] font-bold tracking-[0.18em] text-[var(--accent-brand)] uppercase md:text-left">
            Delivery y take away · {coverage}
          </p>

          {/* TODO: copy real a confirmar con el dueño. tracking-[-0.032em]
              se mantiene: es el texto más grande del sitio (clamp hasta
              4.2rem/67px), tiene que llevar el tracking más negativo (§15). */}
          <h1 className="mt-3.5 text-center font-display text-[clamp(2.5rem,6.2vw,4.2rem)] leading-[0.94] tracking-[-0.032em] text-[var(--foreground)] md:text-left">
            Doble cheddar,
            <br />
            <span className="text-[var(--accent-brand)]">sin vueltas.</span>
          </h1>

          <p className="mx-auto mt-[18px] max-w-[44ch] text-center font-body text-[1.09rem] leading-relaxed text-[var(--muted-foreground)] md:mx-0 md:text-left">
            Armá tu pedido y confirmalo por WhatsApp. Sin cuentas, sin apps —
            elegí, confirmá y listo.
          </p>

          <div className="mt-[26px] flex flex-wrap justify-center gap-3 md:justify-start">
            {/* Glow ambiente permanente (apple-design §16.6): CTA principal
                de toda la página, sombra en 2 capas + halo de acento
                siempre visible, no solo al hover. */}
            <a
              href="#menu"
              className="inline-flex items-center gap-1.5 rounded-lg bg-[var(--accent-brand)] px-[22px] py-[13px] font-condensed text-[1.06rem] font-bold tracking-[0.08em] text-[var(--accent-contrast)] uppercase shadow-[var(--shadow-md),0_0_32px_-8px_rgba(255,159,10,.35)] transition-[background-color,box-shadow,transform] duration-150 hover:bg-[var(--accent-hover)] active:scale-[0.97]"
            >
              Armar mi pedido
            </a>
            <a
              href="#opiniones"
              className="inline-flex items-center gap-1.5 rounded-lg border border-[var(--hairline-strong)] px-[22px] py-[13px] font-condensed text-[1.06rem] font-bold tracking-[0.08em] text-[var(--foreground)] uppercase transition-colors duration-150 hover:bg-[var(--accent-tint-08)] hover:border-[var(--accent-brand)] active:scale-[0.97]"
            >
              Ver opiniones
            </a>
          </div>
        </div>

        <figure className="relative mx-auto mb-3 w-full max-w-sm md:mb-0">
          {/* ios-shadow-lg + border-top especular: la pieza más elevada de
              la página (apple-design §12, "bigger surfaces read thicker"),
              mismo tratamiento que Card depth="hero" del dashboard. */}
          <div className="ios-shadow-lg relative aspect-square w-full overflow-hidden rounded-2xl border border-[var(--hairline)] [border-top-color:var(--specular-strong)] bg-[var(--surface-1)]">
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
          <figcaption className="absolute bottom-[-13px] left-0 bg-[var(--accent-brand)] px-2.5 py-1 font-condensed text-[0.78rem] font-bold tracking-[0.12em] text-[var(--accent-contrast)] uppercase">
            {featuredBurger?.name ?? "Doble cheddar"}
          </figcaption>
        </figure>
      </div>
    </header>
  );
}
