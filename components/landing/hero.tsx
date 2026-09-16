import Image from "next/image";
import { Beef, Store, Truck } from "lucide-react";
import type { Burger } from "@/lib/types";

interface HeroProps {
  /** Best-effort "hero shot" for the page -- the first available burger with
   * an image_url, chosen by the caller (app/page.tsx). null/undefined falls
   * back to a design-system placeholder tile, never a broken <img>. */
  featuredBurger?: Burger | null;
}

export function Hero({ featuredBurger }: HeroProps) {
  return (
    <section id="top" className="mx-auto max-w-5xl scroll-mt-20 px-6 pt-8 pb-12 sm:pt-12">
      <div className="material-regular grid gap-8 overflow-hidden rounded-3xl p-6 sm:p-10 md:grid-cols-[1.05fr_0.95fr] md:items-center">
        <div className="space-y-5 text-center md:text-left">
          <div className="flex flex-wrap justify-center gap-2 md:justify-start">
            <span className="inline-flex items-center gap-1.5 rounded-full border border-border bg-accent px-3 py-1 text-caption font-medium text-accent-foreground">
              <Store className="size-3.5" aria-hidden />
              Retiro en el local
            </span>
            <span className="inline-flex items-center gap-1.5 rounded-full border border-border bg-accent px-3 py-1 text-caption font-medium text-accent-foreground">
              <Truck className="size-3.5" aria-hidden />
              Envío a domicilio
            </span>
          </div>

          {/* font-brand (Pacifico, wired in globals.css/layout.tsx but unused
              until now) is the reserved wordmark treatment -- exactly what a
              burger-place name wants instead of the generic bold sans. */}
          <h1 className="font-brand text-display text-foreground">
            Jebbs Burger&apos;s
          </h1>

          {/* TODO: copy real -- a short marketing tagline belongs here once
              the shop provides one. The line below is the original,
              accurate functional copy (kept, not replaced) describing how
              ordering actually works. */}
          <p className="mx-auto max-w-xl text-body text-muted-foreground md:mx-0">
            Armá tu pedido y confirmalo por WhatsApp. Sin cuentas, sin apps -- elegí,
            confirmá y listo.
          </p>
        </div>

        <div className="relative mx-auto aspect-square w-full max-w-sm overflow-hidden rounded-3xl ios-glass">
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
            <div className="flex h-full w-full items-center justify-center bg-[var(--accent-tint-08)]">
              <Beef
                className="size-20 text-muted-foreground"
                strokeWidth={1.25}
                aria-hidden
              />
            </div>
          )}
        </div>
      </div>
    </section>
  );
}
