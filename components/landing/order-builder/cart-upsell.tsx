import { Plus } from "lucide-react";
import type { Extra } from "@/lib/types";
import { formatArs } from "./currency";

interface CartUpsellProps {
  /** Drinks/sides not already in the cart (OrderBuilder filters this against
   * cart.sides.selectedSides before passing it down). */
  extras: Extra[];
  /** cart.sides.addSide -- already dedupes/increments by extra.id, so a
   * tap here is a single call, no new mutation needed. */
  onAdd: (extra: Extra) => void;
}

const MAX_UPSELL_ITEMS = 6;

// Fills the dead space real feedback pointed at (empty left column with a
// single item in the desktop layout) with an upsell instead of just capping
// the modal's width -- the owner's own theory is that space could be
// raising the average ticket. Capped at MAX_UPSELL_ITEMS so this can never
// grow taller than the item list above it and invert the visual hierarchy.
export function CartUpsell({ extras, onAdd }: CartUpsellProps) {
  const candidates = extras.slice(0, MAX_UPSELL_ITEMS);
  if (candidates.length === 0) return null;

  return (
    <div className="mt-4">
      <p className="mb-2 font-condensed text-xs font-bold tracking-[.16em] text-[var(--muted-foreground)] uppercase">
        ¿Le sumás algo?
      </p>
      <div className="-mx-4 flex snap-x gap-2 overflow-x-auto px-4 md:mx-0 md:grid md:grid-cols-2 md:overflow-visible md:px-0">
        {candidates.map((extra) => (
          <button
            key={extra.id}
            type="button"
            onClick={() => onAdd(extra)}
            className="flex w-[9.5rem] shrink-0 snap-start items-center justify-between gap-2 rounded-lg border border-[var(--hairline)] bg-[var(--surface-2)] px-3 py-2 text-left transition-colors hover:border-[var(--accent-brand)] md:w-auto md:shrink"
          >
            <span className="min-w-0">
              <span className="block truncate font-condensed text-[0.85rem] font-semibold text-[var(--foreground)]">
                {extra.name}
              </span>
              <span className="numeric block text-[0.78rem] text-[var(--accent-brand)]">
                {formatArs(extra.price)}
              </span>
            </span>
            <span
              className="inline-flex size-6 shrink-0 items-center justify-center rounded-full bg-[var(--accent-brand)] text-[var(--accent-contrast)]"
              aria-hidden
            >
              <Plus className="size-3.5" />
            </span>
            <span className="sr-only">Agregar {extra.name}</span>
          </button>
        ))}
      </div>
    </div>
  );
}
