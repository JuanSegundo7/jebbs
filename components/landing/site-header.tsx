import { MessageCircle } from "lucide-react";

// Sticky translucent chrome (apple-design §12: floating material, content
// scrolls underneath -- never an opaque fixed strip). Pure navigation: the
// anchors jump to sections rendered lower on this same single-page
// storefront, there is no client routing here.
//
// Re-estilo a la identidad REAL de jebbs-dashboard (naranja/frío sobre
// negro azulado, ver .atl plan de re-estilo): material-regular (blur+tinte
// real, ya compilado en globals.css desde WU1) en vez del diner-nav
// carbón/mostaza; wordmark en font-brand (Pacifico) con el glow que ya usa
// el logo del sidebar del dashboard; nav en font-sans normal (no condensada
// en mayúscula); CTA en --accent-brand. Estructura/JSX/textos/links
// idénticos -- solo cambian className y el style inline del glow.
export function SiteHeader() {
  return (
    <header className="material-regular sticky top-0 z-40 border-b border-[var(--hairline)]">
      <div className="diner-wrap flex items-center gap-[18px] py-[11px]">
        <span
          className="font-brand text-xl text-[var(--jebbs)]"
          style={{ textShadow: "0 0 12px color-mix(in srgb, var(--jebbs) 55%, transparent)" }}
        >
          Jebbs Burger&apos;s
        </span>

        <nav className="hidden items-center gap-[22px] font-sans text-sm font-medium text-[var(--muted-foreground)] sm:flex">
          <a href="#menu" className="transition-colors hover:text-[var(--foreground)]">
            Menú
          </a>
          <a href="#info" className="transition-colors hover:text-[var(--foreground)]">
            Info
          </a>
          <a href="#zonas" className="transition-colors hover:text-[var(--foreground)]">
            Zonas
          </a>
          <a href="#opiniones" className="transition-colors hover:text-[var(--foreground)]">
            Opiniones
          </a>
        </nav>

        <a
          href="#menu"
          className="ml-auto inline-flex shrink-0 items-center gap-1.5 rounded-lg bg-[var(--accent-brand)] px-4 py-2 font-sans text-sm font-semibold text-[var(--accent-contrast)] shadow-[var(--shadow-sm)] transition-[background-color,box-shadow,transform] duration-150 hover:bg-[var(--accent-hover)] hover:shadow-[var(--shadow-md)] active:scale-[0.97]"
        >
          <MessageCircle className="size-3.5" aria-hidden />
          Pedir
        </a>
      </div>
    </header>
  );
}
