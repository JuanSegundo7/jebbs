import { MessageCircle } from "lucide-react";

// Sticky translucent chrome (apple-design §12: floating material, content
// scrolls underneath -- never an opaque fixed strip). Pure navigation: the
// anchors jump to sections rendered lower on this same single-page
// storefront, there is no client routing here.
export function SiteHeader() {
  return (
    <header className="material-regular sticky top-0 z-30">
      <div className="mx-auto flex max-w-5xl items-center justify-between gap-4 px-6 py-3">
        <span className="font-brand text-title2 text-foreground">
          Jebbs Burger&apos;s
        </span>

        <nav className="hidden items-center gap-6 text-subheadline text-muted-foreground sm:flex">
          <a href="#menu" className="transition-colors hover:text-foreground">
            Menú
          </a>
          <a href="#info" className="transition-colors hover:text-foreground">
            Info
          </a>
        </nav>

        <a
          href="#menu"
          className="inline-flex items-center gap-1.5 rounded-2xl bg-primary px-4 py-2 text-caption font-medium text-primary-foreground ios-shadow-sm transition-[background-color,box-shadow,transform] duration-150 hover:bg-[var(--accent-hover)] hover:ios-shadow-md active:scale-[0.97] active:duration-75"
        >
          <MessageCircle className="size-3.5" aria-hidden />
          Pedir
        </a>
      </div>
    </header>
  );
}
