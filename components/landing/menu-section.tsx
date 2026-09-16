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
            <p className="diner-eyebrow">La carta</p>
            <h2 className="diner-sechead-title">Elegí lo tuyo</h2>
            <p className="diner-sechead-note">
              Tocá el + para sumar al pedido. Abajo de todo se te va armando
              el ticket.
            </p>
          </div>
          <span className="diner-chip diner-chip-hollow">Precios a confirmar</span>
        </div>
        <OrderBuilder catalog={catalog} deliveryFeeArs={deliveryFeeArs} />
      </div>
    </section>
  );
}
