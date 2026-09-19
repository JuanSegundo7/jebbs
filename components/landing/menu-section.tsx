import type { Catalog } from "@/lib/catalog/get-catalog";
import { OrderBuilder } from "@/components/landing/order-builder/order-builder";

interface MenuSectionProps {
  catalog: Catalog;
  /** Passed through to OrderBuilder for its advisory total (WU3b wires the
   * actual pickup/delivery toggle that decides whether this fee applies). */
  deliveryFeeArs: number;
}

export function MenuSection({ catalog, deliveryFeeArs }: MenuSectionProps) {
  return (
    <section id="menu" className="diner-section scroll-mt-20">
      <div className="diner-wrap">
        <div className="diner-sechead">
          <div>
            {/* diner-eyebrow/diner-sechead-title/diner-sechead-note son
                utilities globales compartidas con secciones fuera de
                alcance (info-section, delivery-zone-map, reviews-section) --
                no se tocan en globals.css, se reemplazan acá por sus
                valores literales ya retinteados (mismo criterio que
                diner-btn-primary en hero.tsx/site-header.tsx). text-overline
                es el token de overline real del dashboard (ver
                historial/page.tsx, order-column.tsx). */}
            <p className="text-overline text-[var(--accent-brand)] uppercase">La carta</p>
            <h2 className="mt-2.5 font-sans text-[clamp(1.7rem,3.6vw,2.5rem)] leading-none font-bold tracking-[-0.024em] text-[var(--foreground)]">
              Elegí lo tuyo
            </h2>
            <p className="mt-2 max-w-[52ch] text-[var(--muted-foreground)]">
              Tocá el + para sumar al pedido. Abajo de todo se te va armando
              el ticket.
            </p>
          </div>
          <span className="rounded-full border border-[var(--accent-brand)]/50 px-2.5 py-0.5 text-xs font-semibold text-[var(--accent-brand)]">
            Precios a confirmar
          </span>
        </div>
        <OrderBuilder catalog={catalog} deliveryFeeArs={deliveryFeeArs} />
      </div>
    </section>
  );
}
