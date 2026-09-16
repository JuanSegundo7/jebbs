import { MessageCircle } from "lucide-react";

// Sticky translucent chrome (apple-design §12: floating material, content
// scrolls underneath -- never an opaque fixed strip). Pure navigation: the
// anchors jump to sections rendered lower on this same single-page
// storefront, there is no client routing here.
//
// Restyled to the "diner" identity (reference site: jebbs-burgers.vercel.app):
// a near-black translucent strip instead of the generic light iOS material,
// nav links in Barlow Condensed uppercase with wide tracking.
export function SiteHeader() {
  return (
    <header
      className="sticky top-0 z-30 border-b border-[var(--line)] backdrop-blur-[10px]"
      style={{ backgroundColor: "rgba(11, 10, 8, 0.88)" }}
    >
      <div className="mx-auto flex max-w-5xl items-center justify-between gap-4 px-6 py-3">
        <span className="font-display text-lg tracking-[.02em] text-[var(--cream)]">
          Jebbs Burger&apos;s
        </span>

        <nav className="hidden items-center gap-6 font-condensed text-[13px] font-bold tracking-[.1em] text-[var(--ash)] uppercase sm:flex">
          <a href="#menu" className="transition-colors hover:text-[var(--cheddar)]">
            Menú
          </a>
          <a href="#info" className="transition-colors hover:text-[var(--cheddar)]">
            Info
          </a>
          <a href="#opiniones" className="transition-colors hover:text-[var(--cheddar)]">
            Opiniones
          </a>
        </nav>

        <a
          href="#menu"
          className="inline-flex items-center gap-1.5 rounded-full bg-[var(--cheddar)] px-4 py-2 font-condensed text-[12px] font-bold tracking-[.08em] text-[var(--coal)] uppercase transition-colors duration-150 hover:bg-[var(--cheddar-dim)] active:scale-[0.97]"
        >
          <MessageCircle className="size-3.5" aria-hidden />
          Pedir
        </a>
      </div>
    </header>
  );
}
