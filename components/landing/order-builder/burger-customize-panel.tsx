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
  // Only used while the matching section is shown (showMeat/showFries).
  onMeatChange?: (delta: number) => void;
  onFriesChange?: (delta: number) => void;
  // Hide sections that don't apply (combo slots: meat/fries are fixed by the
  // slot and ignored server-side). Default true = unchanged behavior.
  showMeat?: boolean;
  showFries?: boolean;
  // Overrides the default catalog-baseline summary. `null` renders "Sin
  // modificar"; omit it to summarize against the catalog defaults.
  summary?: string | null;
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
  showMeat = true,
  showFries = true,
  summary,
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
      <p className="font-body text-xs leading-[1.5] text-[var(--muted-foreground)]">
        {(summary !== undefined ? summary : summarizeBurger(item)) ?? "Sin modificar"}
      </p>

      {showMeat && (
        <div className="flex items-center justify-between">
          <span className="font-condensed text-xs font-bold tracking-[.08em] text-[var(--muted-foreground)] uppercase">
            Carne
          </span>
          <div className="flex items-center gap-1">
            <button
              type="button"
              className="inline-flex h-7 w-7 shrink-0 items-center justify-center rounded-full border border-[var(--hairline-strong)] bg-[var(--surface-2)] text-[var(--accent-brand)] transition-[border-color,transform] duration-150 hover:border-[var(--accent-brand)] active:scale-[0.92] [&_svg]:h-3.5 [&_svg]:w-3.5"
              onClick={() => onMeatChange?.(-1)}
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
              onClick={() => onMeatChange?.(1)}
              aria-label="Más carne"
            >
              <Plus />
            </button>
          </div>
        </div>
      )}

      <button
        type="button"
        role="switch"
        aria-checked={item.isVeggie ?? false}
        aria-label="Versión veggie"
        onClick={onToggleVeggie}
        // Same pill as the dashboard order wizard: green when active.
        className={cn(
          "inline-flex cursor-pointer items-center gap-1 rounded-full border px-3 py-1 font-condensed text-[0.8rem] font-bold tracking-[.06em] uppercase transition-[background-color,border-color,color,transform] duration-150 active:scale-[0.96]",
          item.isVeggie
            ? "border-[var(--status-paid)]/30 bg-[var(--status-paid-tint)] text-[var(--status-paid)]"
            : "border-[var(--hairline-strong)] bg-[var(--surface-2)] text-[var(--muted-foreground)] hover:border-[var(--accent-brand)] hover:text-[var(--foreground)]",
        )}
      >
        <span aria-hidden>🌱</span>
        Veggie
      </button>

      {showFries && (
        <div className="flex items-center justify-between">
          <span className="font-condensed text-xs font-bold tracking-[.08em] text-[var(--muted-foreground)] uppercase">
            Papas
          </span>
          <div className="flex items-center gap-1">
            <button
              type="button"
              className="inline-flex h-7 w-7 shrink-0 items-center justify-center rounded-full border border-[var(--hairline-strong)] bg-[var(--surface-2)] text-[var(--accent-brand)] transition-[border-color,transform] duration-150 hover:border-[var(--accent-brand)] active:scale-[0.92] [&_svg]:h-3.5 [&_svg]:w-3.5"
              onClick={() => onFriesChange?.(-1)}
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
              onClick={() => onFriesChange?.(1)}
              aria-label="Más papas"
            >
              <Plus />
            </button>
          </div>
        </div>
      )}

      {toppingExtras.length > 0 && (
        <div>
          <div className="flex items-baseline justify-between">
            <span className="font-condensed text-xs font-bold tracking-[.08em] text-[var(--muted-foreground)] uppercase">
              Extras
            </span>
            {selectedExtrasCount > 0 && (
              <span className="numeric font-condensed text-xs text-[var(--muted-foreground-dim)]">
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
                  "-mx-3 flex items-center gap-[10px] border-b border-dashed border-[var(--hairline-strong)] px-3 py-2 transition-[border-color,background-color,transform] duration-200 ease-[cubic-bezier(0.16,1,0.3,1)] last:border-b-0 hover:border-[var(--foreground)] hover:bg-[color-mix(in_srgb,var(--foreground)_3%,transparent)] active:scale-[0.99]",
                  qty > 0 && "bg-[linear-gradient(90deg,var(--accent-tint-16),transparent_60%)]",
                )}
              >
                <div className="flex min-w-0 flex-1 items-baseline">
                  <span className="truncate font-condensed text-[0.98rem] font-bold tracking-[.03em] text-[var(--foreground)] uppercase">
                    {extra.name}
                  </span>
                  <span
                    className="min-w-[1rem] flex-1"
                    aria-hidden
                  />
                  <span className="numeric shrink-0 font-condensed text-[0.98rem] font-bold text-[var(--accent-brand)]">
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
                  <output className="numeric w-[26px] text-center font-condensed text-[1.1rem] font-bold text-[var(--muted-foreground)]">
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
              className="w-full py-2 text-center font-condensed text-xs font-bold tracking-[.08em] text-[var(--accent-brand)] uppercase"
            >
              {showAllExtras ? "Ver menos" : `Ver los ${toppingExtras.length} extras`}
            </button>
          )}
        </div>
      )}
    </div>
  );
}
