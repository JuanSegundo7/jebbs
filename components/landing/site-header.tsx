import { MessageCircle } from "lucide-react";
import { BRAND_NAME } from "@/lib/brand";

// Sticky translucent chrome (apple-design §12: floating material, content
// scrolls underneath -- never an opaque fixed strip). Pure navigation: the
// anchors jump to sections rendered lower on this same single-page
// storefront, there is no client routing here.
//
// Re-estilo a la identidad de jebbs-dashboard (naranja/frío sobre negro
// azulado, ver .atl plan de re-estilo): material-regular (blur+tinte real,
// ya compilado en globals.css desde WU1) en vez del diner-nav
// carbón/mostaza; --accent-brand en vez de --cheddar. Tipografía "diner"
// (font-display/font-condensed) restaurada por pedido del dueño: wordmark
// en font-display igual que el sitio original, nav y CTA en font-condensed
// uppercase con tracking. Estructura/JSX/textos/links idénticos -- solo
// cambia className.
export function SiteHeader() {
  return (
    <header className="material-regular sticky top-0 z-40 border-b border-[var(--hairline)]">
      <div className="diner-wrap flex items-center gap-[18px] py-[11px]">
        <span className="font-display text-base tracking-[.02em] text-[var(--foreground)]">
          {BRAND_NAME}
        </span>

        <nav className="hidden items-center gap-[22px] font-condensed text-base font-semibold tracking-[.1em] text-[var(--muted-foreground)] uppercase sm:flex">
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
          className="ml-auto inline-flex shrink-0 items-center gap-1.5 rounded-lg bg-[var(--accent-brand)] px-4 py-2 font-condensed text-[12px] font-bold tracking-[.08em] text-[var(--accent-contrast)] uppercase shadow-[var(--shadow-sm)] transition-[background-color,box-shadow,transform] duration-150 hover:bg-[var(--accent-hover)] hover:shadow-[var(--shadow-md)] active:scale-[0.97]"
        >
          <MessageCircle className="size-3.5" aria-hidden />
          Pedir
        </a>
      </div>
    </header>
  );
}
