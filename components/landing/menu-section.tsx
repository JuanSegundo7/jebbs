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
    <section id="menu" className="mx-auto max-w-5xl scroll-mt-20 px-6 py-12">
      <div className="mb-6 space-y-1 text-center sm:text-left">
        <h2 className="text-title1 font-semibold text-foreground">
          Elegí tu pedido
        </h2>
        <p className="text-subheadline text-muted-foreground">
          Hamburguesas, combos y acompañamientos -- armá el pedido y confirmalo
          por WhatsApp.
        </p>
      </div>
      <OrderBuilder catalog={catalog} deliveryFeeArs={deliveryFeeArs} />
    </section>
  );
}
