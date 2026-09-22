import type { Catalog } from "@/lib/catalog/get-catalog";
import type { DeliveryZone } from "@/lib/types";
import { OrderBuilder } from "@/components/landing/order-builder/order-builder";

interface MenuSectionProps {
  catalog: Catalog;
  deliveryZones: DeliveryZone[];
  minDeliveryFeeArs: number | null;
}

export function MenuSection({ catalog, deliveryZones, minDeliveryFeeArs }: MenuSectionProps) {
  return (
    <section id="menu" className="diner-section scroll-mt-20">
      <div className="diner-wrap">
        <div className="diner-sechead">
          <div>
            {/* diner-eyebrow/diner-sechead-title/diner-sechead-note son
                utilities globales compartidas con secciones fuera de
                alcance (info-section, delivery-zone-map, reviews-section) --
                no se tocan en globals.css, se reemplazan acá por sus
                valores literales, tipografía "diner" restaurada por pedido
                del dueño (mismo criterio que diner-btn-primary en
                hero.tsx/site-header.tsx). */}
            <p className="font-condensed text-[0.82rem] font-bold tracking-[0.18em] text-[var(--accent-brand)] uppercase">La carta</p>
            <h2 className="mt-2.5 font-display text-[clamp(1.7rem,3.6vw,2.5rem)] leading-none tracking-[-0.024em] text-[var(--foreground)]">
              Elegí lo tuyo
            </h2>
            <p className="mt-2 max-w-[52ch] text-[var(--muted-foreground)]">
              Tocá el + para sumar al pedido. Abajo de todo se te va armando
              el ticket.
            </p>
          </div>
          <span className="rounded-full border border-[var(--accent-brand)]/50 px-2.5 py-0.5 font-condensed text-[0.72rem] font-bold tracking-[0.14em] text-[var(--accent-brand)] uppercase">
            Precios a confirmar
          </span>
        </div>
        <OrderBuilder
          catalog={catalog}
          deliveryZones={deliveryZones}
          minDeliveryFeeArs={minDeliveryFeeArs}
        />
      </div>
    </section>
  );
}
