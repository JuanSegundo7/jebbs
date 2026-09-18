"use client";

import { Minus, Plus } from "lucide-react";
import { cn } from "@/lib/utils";
import type { Extra } from "@/lib/types";
import type { SelectedBurger } from "@/lib/types/combo-types";
import { formatArs } from "./currency";

interface BurgerCustomizePanelProps {
  item: SelectedBurger;
  toppingExtras: Extra[];
  onMeatChange: (delta: number) => void;
  onFriesChange: (delta: number) => void;
  onToggleVeggie: () => void;
  onToggleExtra: (extra: Extra) => void;
}

// Extracted verbatim from burger-picker.tsx's `{expanded && (...)}` block --
// pure move, no behavior change. Handlers are bound to `item.id` at the call
// site (burger-picker.tsx) instead of threading `item.id` + the raw hook
// setters down here separately.
export function BurgerCustomizePanel({
  item,
  toppingExtras,
  onMeatChange,
  onFriesChange,
  onToggleVeggie,
  onToggleExtra,
}: BurgerCustomizePanelProps) {
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
        <div className="flex flex-wrap gap-2">
          {toppingExtras.map((extra) => {
            const active = item.selectedExtras.some(
              (e) => e.extra.id === extra.id,
            );
            return (
              <button
                key={extra.id}
                type="button"
                onClick={() => onToggleExtra(extra)}
                className={cn(
                  "rounded-full border px-3 py-1 font-condensed text-[11px] font-bold tracking-[.04em] uppercase",
                  active
                    ? "border-[var(--cheddar)] bg-[var(--cheddar)] text-[var(--coal)]"
                    : "border-[var(--line-2)] text-[var(--ash)]",
                )}
              >
                {extra.name} (+{formatArs(extra.price)})
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
