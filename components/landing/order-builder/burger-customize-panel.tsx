"use client";

import { useState } from "react";
import { Minus, Plus } from "lucide-react";
import { cn } from "@/lib/utils";
import type { Extra } from "@/lib/types";
import type { SelectedBurger } from "@/lib/types/combo-types";
import { summarizeBurger } from "@/lib/order/customization-summary";
import { formatArs } from "./currency";

// lib/order/cart-request.ts ExtraRefSchema.quantity: max 20.
const MAX_EXTRA_QUANTITY = 20;

interface BurgerCustomizePanelProps {
  item: SelectedBurger;
  toppingExtras: Extra[];
  onMeatChange: (delta: number) => void;
  onFriesChange: (delta: number) => void;
  onToggleVeggie: () => void;
  onToggleExtra: (extra: Extra) => void;
  onExtraQuantityChange: (extraId: string, delta: number) => void;
}

// Originally extracted verbatim from burger-picker.tsx's `{expanded &&
// (...)}` block (pure move, no behavior change). Handlers are bound to
// `item.id` at the call site (burger-picker.tsx) instead of threading
// `item.id` + the raw hook setters down here separately.
export function BurgerCustomizePanel({
  item,
  toppingExtras,
  onMeatChange,
  onFriesChange,
  onToggleVeggie,
  onToggleExtra,
  onExtraQuantityChange,
}: BurgerCustomizePanelProps) {
  // Progressive disclosure: by default only extras already chosen show up,
  // plus a "Ver los N extras" button to reveal the rest. One instance of
  // this state per rendered panel (one per selected burger), matching the
  // once-per-instance render of this component.
  const [showAllExtras, setShowAllExtras] = useState(false);

  const qtyOf = (extraId: string) =>
    item.selectedExtras.find((e) => e.extra.id === extraId)?.quantity ?? 0;
  const visibleExtras = showAllExtras
    ? toppingExtras
    : toppingExtras.filter((e) => qtyOf(e.id) > 0);
  const hiddenCount = toppingExtras.length - visibleExtras.length;
  const selectedExtrasCount = item.selectedExtras.length;

  return (
    <div className="space-y-3 border-t border-[var(--hairline)] pt-3">
      <p className="font-sans text-xs leading-[1.5] text-[var(--muted-foreground)]">
        {summarizeBurger(item) ?? "Sin modificar"}
      </p>

      <div className="flex items-center justify-between">
        <span className="text-overline text-[var(--muted-foreground)] uppercase">
          Carne
        </span>
        <div className="flex items-center gap-1">
          <button
            type="button"
            className="inline-flex h-7 w-7 shrink-0 items-center justify-center rounded-full border border-[var(--hairline-strong)] bg-[var(--surface-2)] text-[var(--accent-brand)] transition-[border-color,transform] duration-150 hover:border-[var(--accent-brand)] active:scale-[0.92] [&_svg]:h-3.5 [&_svg]:w-3.5"
            onClick={() => onMeatChange(-1)}
            aria-label="Menos carne"
          >
            <Minus />
          </button>
          <span className="numeric w-6 text-center text-sm text-[var(--foreground)]">
            {item.meatCount}
          </span>
          <button
            type="button"
            className="inline-flex h-7 w-7 shrink-0 items-center justify-center rounded-full border border-[var(--hairline-strong)] bg-[var(--surface-2)] text-[var(--accent-brand)] transition-[border-color,transform] duration-150 hover:border-[var(--accent-brand)] active:scale-[0.92] [&_svg]:h-3.5 [&_svg]:w-3.5"
            onClick={() => onMeatChange(1)}
            aria-label="Más carne"
          >
            <Plus />
          </button>
        </div>
      </div>

      <button
        type="button"
        role="switch"
        aria-checked={item.isVeggie ?? false}
        onClick={onToggleVeggie}
        // El único uso interactivo real del chip (el resto son badges, sin
        // hover) -- se le suma el movimiento de diner-interactive en
        // valores sueltos (no la clase, para no pelear el `transition`
        // shorthand que ya trae la fila): acá se anima solo transform/
        // box-shadow, dejando intacta la transición de borde/fondo propia.
        className="flex w-full items-center gap-[10px] py-2 text-left transition-[transform,box-shadow] duration-200 [transition-timing-function:cubic-bezier(0.16,1,0.3,1)] hover:-translate-y-0.5 hover:shadow-[var(--shadow-md)] active:scale-[0.985] active:bg-[color-mix(in_srgb,var(--foreground)_3%,transparent)] active:shadow-[var(--shadow-sm)]"
      >
        <span className="font-sans text-[0.98rem] font-bold text-[var(--foreground)]">
          Versión veggie
        </span>
        <span
          className="mb-[0.3em] min-w-[1rem] flex-1 self-end border-b border-dotted border-[var(--muted-foreground-dim)]"
          aria-hidden
        />
        <span
          className={cn(
            "shrink-0 rounded-full px-2.5 py-0.5 text-xs font-semibold",
            item.isVeggie
              ? "bg-[var(--accent-brand)] text-[var(--accent-contrast)]"
              : "border border-[var(--accent-brand)]/50 text-[var(--accent-brand)]",
          )}
        >
          {item.isVeggie ? "Sí" : "No"}
        </span>
      </button>

      <div className="flex items-center justify-between">
        <span className="text-overline text-[var(--muted-foreground)] uppercase">
          Papas
        </span>
        <div className="flex items-center gap-1">
          <button
            type="button"
            className="inline-flex h-7 w-7 shrink-0 items-center justify-center rounded-full border border-[var(--hairline-strong)] bg-[var(--surface-2)] text-[var(--accent-brand)] transition-[border-color,transform] duration-150 hover:border-[var(--accent-brand)] active:scale-[0.92] [&_svg]:h-3.5 [&_svg]:w-3.5"
            onClick={() => onFriesChange(-1)}
            aria-label="Menos papas"
          >
            <Minus />
          </button>
          <span className="numeric w-6 text-center text-sm text-[var(--foreground)]">
            {item.friesQuantity}
          </span>
          <button
            type="button"
            className="inline-flex h-7 w-7 shrink-0 items-center justify-center rounded-full border border-[var(--hairline-strong)] bg-[var(--surface-2)] text-[var(--accent-brand)] transition-[border-color,transform] duration-150 hover:border-[var(--accent-brand)] active:scale-[0.92] [&_svg]:h-3.5 [&_svg]:w-3.5"
            onClick={() => onFriesChange(1)}
            aria-label="Más papas"
          >
            <Plus />
          </button>
        </div>
      </div>

      {toppingExtras.length > 0 && (
        <div>
          <div className="flex items-baseline justify-between">
            <span className="text-overline text-[var(--muted-foreground)] uppercase">
              Extras
            </span>
            {selectedExtrasCount > 0 && (
              <span className="numeric font-sans text-xs text-[var(--muted-foreground-dim)]">
                {selectedExtrasCount} agregado{selectedExtrasCount === 1 ? "" : "s"}
              </span>
            )}
          </div>

          {visibleExtras.map((extra) => {
            const qty = qtyOf(extra.id);
            return (
              <div
                key={extra.id}
                className={cn(
                  "flex items-center gap-[10px] border-b border-dashed border-[var(--hairline-strong)] py-2 transition-[border-color,background-color,transform] duration-200 ease-[cubic-bezier(0.16,1,0.3,1)] last:border-b-0 hover:border-[var(--foreground)] hover:bg-[color-mix(in_srgb,var(--foreground)_3%,transparent)] active:scale-[0.99]",
                  qty > 0 && "bg-[linear-gradient(90deg,var(--accent-tint-16),transparent_60%)]",
                )}
              >
                <div className="flex min-w-0 flex-1 items-baseline">
                  <span className="truncate font-sans text-[0.98rem] font-bold text-[var(--foreground)]">
                    {extra.name}
                  </span>
                  <span
                    className="mb-[0.3em] min-w-[1rem] flex-1 self-end border-b border-dotted border-[var(--muted-foreground-dim)]"
                    aria-hidden
                  />
                  <span className="numeric shrink-0 font-sans text-[0.98rem] font-bold text-[var(--accent-brand)]">
                    +{formatArs(extra.price)}
                  </span>
                </div>
                <div className="flex shrink-0 items-center gap-0.5 rounded-[3px] border border-[var(--hairline)] bg-[var(--surface-2)]">
                  <button
                    type="button"
                    className="inline-flex h-9 w-9 items-center justify-center text-[var(--foreground)] transition-[color,transform] duration-150 [transition-timing-function:cubic-bezier(0.16,1,0.3,1)] hover:text-[var(--accent-brand)] active:scale-90 disabled:pointer-events-none disabled:opacity-40 [&_svg]:h-3.5 [&_svg]:w-3.5"
                    disabled={qty === 0}
                    onClick={() => onExtraQuantityChange(extra.id, -1)}
                    aria-label={`Quitar ${extra.name}`}
                  >
                    <Minus />
                  </button>
                  <output className="numeric w-[26px] text-center font-sans text-[1.1rem] font-bold text-[var(--muted-foreground)]">
                    {qty}
                  </output>
                  <button
                    type="button"
                    className="inline-flex h-9 w-9 items-center justify-center text-[var(--foreground)] transition-[color,transform] duration-150 [transition-timing-function:cubic-bezier(0.16,1,0.3,1)] hover:text-[var(--accent-brand)] active:scale-90 disabled:pointer-events-none disabled:opacity-40 [&_svg]:h-3.5 [&_svg]:w-3.5"
                    disabled={qty >= MAX_EXTRA_QUANTITY}
                    onClick={() =>
                      qty === 0 ? onToggleExtra(extra) : onExtraQuantityChange(extra.id, 1)
                    }
                    aria-label={`Agregar ${extra.name}`}
                  >
                    <Plus />
                  </button>
                </div>
              </div>
            );
          })}

          {(hiddenCount > 0 || showAllExtras) && (
            <button
              type="button"
              aria-expanded={showAllExtras}
              onClick={() => setShowAllExtras((v) => !v)}
              className="w-full py-2 text-center text-overline text-[var(--accent-brand)] uppercase"
            >
              {showAllExtras ? "Ver menos" : `Ver los ${toppingExtras.length} extras`}
            </button>
          )}
        </div>
      )}
    </div>
  );
}
