"use client";

import { useState } from "react";
import { Minus, Plus } from "lucide-react";
import { cn } from "@/lib/utils";
import type { Extra } from "@/lib/types";
import type { SelectedBurger } from "@/lib/types/combo-types";
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
    <div className="space-y-3 border-t border-[var(--line)] pt-3">
      <div className="flex items-center justify-between">
        <span className="font-condensed text-xs font-bold tracking-[.08em] text-[var(--ash)] uppercase">
          Carne
        </span>
        <div className="flex items-center gap-1">
          <button
            type="button"
            className="diner-stepper-btn"
            onClick={() => onMeatChange(-1)}
            aria-label="Menos carne"
          >
            <Minus />
          </button>
          <span className="numeric w-6 text-center text-sm text-[var(--cream)]">
            {item.meatCount}
          </span>
          <button
            type="button"
            className="diner-stepper-btn"
            onClick={() => onMeatChange(1)}
            aria-label="Más carne"
          >
            <Plus />
          </button>
        </div>
      </div>

      <div className="flex items-center justify-between">
        <span className="font-condensed text-xs font-bold tracking-[.08em] text-[var(--ash)] uppercase">
          Papas
        </span>
        <div className="flex items-center gap-1">
          <button
            type="button"
            className="diner-stepper-btn"
            onClick={() => onFriesChange(-1)}
            aria-label="Menos papas"
          >
            <Minus />
          </button>
          <span className="numeric w-6 text-center text-sm text-[var(--cream)]">
            {item.friesQuantity}
          </span>
          <button
            type="button"
            className="diner-stepper-btn"
            onClick={() => onFriesChange(1)}
            aria-label="Más papas"
          >
            <Plus />
          </button>
        </div>
      </div>

      <label className="flex items-center gap-2 font-body text-sm text-[var(--ash)]">
        <input
          type="checkbox"
          checked={item.isVeggie ?? false}
          onChange={onToggleVeggie}
        />
        Version veggie
      </label>

      {toppingExtras.length > 0 && (
        <div>
          <div className="flex items-baseline justify-between">
            <span className="font-condensed text-xs font-bold tracking-[.08em] text-[var(--ash)] uppercase">
              Extras
            </span>
            {selectedExtrasCount > 0 && (
              <span className="numeric font-condensed text-xs text-[var(--ash-dim)]">
                {selectedExtrasCount} agregado{selectedExtrasCount === 1 ? "" : "s"}
              </span>
            )}
          </div>

          {visibleExtras.map((extra) => {
            const qty = qtyOf(extra.id);
            return (
              <div
                key={extra.id}
                className={cn("menu-row-compact last:border-b-0", qty > 0 && "menu-row-active")}
              >
                <div className="flex min-w-0 flex-1 items-baseline">
                  <span className="truncate font-condensed text-[0.98rem] font-bold tracking-[.03em] text-[var(--cream)] uppercase">
                    {extra.name}
                  </span>
                  <span className="menu-leader" aria-hidden />
                  <span className="numeric shrink-0 font-condensed text-[0.98rem] font-bold text-[var(--cheddar)]">
                    +{formatArs(extra.price)}
                  </span>
                </div>
                <div className="diner-stepper">
                  <button
                    type="button"
                    className="diner-st"
                    disabled={qty === 0}
                    onClick={() => onExtraQuantityChange(extra.id, -1)}
                    aria-label={`Quitar ${extra.name}`}
                  >
                    <Minus />
                  </button>
                  <output className="diner-qty">{qty}</output>
                  <button
                    type="button"
                    className="diner-st"
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
              className="w-full py-2 text-center font-condensed text-xs font-bold tracking-[.08em] text-[var(--cheddar)] uppercase"
            >
              {showAllExtras ? "Ver menos" : `Ver los ${toppingExtras.length} extras`}
            </button>
          )}
        </div>
      )}
    </div>
  );
}
