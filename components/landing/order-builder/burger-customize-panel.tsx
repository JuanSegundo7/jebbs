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
    <div className="space-y-3 border-t border-[var(--line)] pt-3">
      <p className="font-body text-xs leading-[1.5] text-[var(--ash-bright)]">
        {summarizeBurger(item) ?? "Sin modificar"}
      </p>

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

      <button
        type="button"
        role="switch"
        aria-checked={item.isVeggie ?? false}
        onClick={onToggleVeggie}
        // El único uso interactivo real de diner-chip (el resto son badges,
        // sin hover) -- se le suma el movimiento de diner-interactive en
        // valores sueltos (no la clase, para no pelear el `transition`
        // shorthand que ya trae menu-row-compact vía diner-interactive-subtle:
        // acá se anima solo transform/box-shadow, dejando intacta la
        // transición de borde/fondo de la fila).
        className="menu-row-compact w-full border-b-0 text-left transition-[transform,box-shadow] duration-200 [transition-timing-function:cubic-bezier(0.16,1,0.3,1)] hover:-translate-y-0.5 hover:shadow-[0_20px_40px_rgba(0,0,0,0.35)] active:scale-[0.985] active:bg-white/[0.03] active:shadow-[0_8px_16px_rgba(0,0,0,0.25)]"
      >
        <span className="font-condensed text-[0.98rem] font-bold tracking-[.03em] text-[var(--cream)] uppercase">
          Versión veggie
        </span>
        <span className="menu-leader" aria-hidden />
        <span className={cn("diner-chip shrink-0", !item.isVeggie && "diner-chip-hollow")}>
          {item.isVeggie ? "Sí" : "No"}
        </span>
      </button>

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
