import { MessageCircle } from "lucide-react";

// Sticky translucent chrome (apple-design §12: floating material, content
// scrolls underneath -- never an opaque fixed strip). Pure navigation: the
// anchors jump to sections rendered lower on this same single-page
// storefront, there is no client routing here.
//
// Restyled a la identidad "diner" con los valores reales de ref-style.css
// (.nav/.wrap/.navlinks, líneas 42-52): wrap de 1080px/92vw en vez de
// max-w-5xl, tracking y tamaño de los navlinks (1rem, .1em) en vez de la
// aproximación anterior (13px, .1em).
export function SiteHeader() {
  return (
    <header className="diner-nav">
      <div className="diner-wrap flex items-center gap-[18px] py-[11px]">
        <span className="font-display text-base tracking-[.02em] text-[var(--cream)]">
          Jebbs Burger&apos;s
        </span>

        <nav className="hidden items-center gap-[22px] font-condensed text-base font-semibold tracking-[.1em] text-[var(--ash)] uppercase sm:flex">
          <a href="#menu" className="transition-colors hover:text-[var(--cream)]">
            Menú
          </a>
          <a href="#info" className="transition-colors hover:text-[var(--cream)]">
            Info
          </a>
          <a href="#zonas" className="transition-colors hover:text-[var(--cream)]">
            Zonas
          </a>
          <a href="#opiniones" className="transition-colors hover:text-[var(--cream)]">
            Opiniones
          </a>
        </nav>

        <a
          href="#menu"
          className="ml-auto inline-flex shrink-0 items-center gap-1.5 rounded-[3px] bg-[var(--cheddar)] px-4 py-2 font-condensed text-[12px] font-bold tracking-[.08em] text-[var(--coal)] uppercase transition-colors duration-150 hover:bg-[#FFC634] active:scale-[0.97]"
        >
          <MessageCircle className="size-3.5" aria-hidden />
          Pedir
        </a>
      </div>
    </header>
  );
}
