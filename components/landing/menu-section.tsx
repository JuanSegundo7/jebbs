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
    <section id="menu" className="scroll-mt-20 bg-[var(--coal)] px-6 py-16">
      <div className="mx-auto max-w-5xl">
        <div className="mb-8 space-y-1 text-center sm:text-left">
          <h2 className="font-display text-3xl text-[var(--cream)] sm:text-4xl">
            Elegí tu pedido
          </h2>
          <p className="font-body text-[15px] text-[var(--ash)]">
            Hamburguesas, combos y acompañamientos -- armá el pedido y confirmalo
            por WhatsApp.
          </p>
        </div>
        <OrderBuilder catalog={catalog} deliveryFeeArs={deliveryFeeArs} />
      </div>
    </section>
  );
}
