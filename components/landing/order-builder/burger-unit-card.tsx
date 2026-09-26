"use client";

import { ChevronDown, Minus, Plus, Trash2 } from "lucide-react";
import { cn } from "@/lib/utils";
import type { Extra } from "@/lib/types";
import type { SelectedBurger } from "@/lib/types/combo-types";
import { summarizeBurger } from "@/lib/order/customization-summary";
import { BurgerCustomizePanel } from "./burger-customize-panel";

interface BurgerUnitCardProps {
  item: SelectedBurger;
  expanded: boolean;
  toppingExtras: Extra[];
  onToggleExpanded: () => void;
  onQuantityChange: (delta: number) => void;
  onRemove: () => void;
  onMeatChange: (delta: number) => void;
  onFriesChange: (delta: number) => void;
  onToggleVeggie: () => void;
  onToggleExtra: (extra: Extra) => void;
  onExtraQuantityChange: (extraId: string, delta: number) => void;
}

// One selected burger line (a single "+" tap): collapsible header with its
// customization summary, quantity controls, and the customize panel.
export function BurgerUnitCard({
  item,
  expanded,
  toppingExtras,
  onToggleExpanded,
  onQuantityChange,
  onRemove,
  onMeatChange,
  onFriesChange,
  onToggleVeggie,
  onToggleExtra,
  onExtraQuantityChange,
}: BurgerUnitCardProps) {
  return (
    <div className="ios-glass min-w-0 space-y-3 rounded-xl p-3">
      <div className="flex items-center justify-between gap-2">
        <button
          type="button"
          className="flex min-w-0 flex-1 items-center gap-2 text-left"
          onClick={onToggleExpanded}
          aria-expanded={expanded}
        >
          <ChevronDown
            className={cn(
              "size-4 shrink-0 text-[var(--muted-foreground)] transition-transform",
              expanded && "rotate-180",
            )}
            aria-hidden
          />
          <span className="min-w-0 flex-1">
            <span className="block font-condensed text-sm font-bold tracking-[.03em] text-[var(--foreground)] uppercase">
              {item.burger.name}
            </span>
            {!expanded && (
              <span className="block break-words font-body text-xs text-[var(--muted-foreground)]">
                {summarizeBurger(item) ?? "Sin modificar · tocá para personalizar"}
              </span>
            )}
          </span>
        </button>
        <div className="flex items-center gap-1">
          <button
            type="button"
            className="inline-flex h-7 w-7 shrink-0 items-center justify-center rounded-full border border-[var(--hairline-strong)] bg-[var(--surface-2)] text-[var(--accent-brand)] transition-[border-color,transform] duration-150 hover:border-[var(--accent-brand)] active:scale-[0.92] [&_svg]:h-3.5 [&_svg]:w-3.5"
            onClick={() => onQuantityChange(-1)}
            aria-label="Quitar uno"
          >
            <Minus />
          </button>
          <span className="numeric w-6 text-center text-sm text-[var(--foreground)]">
            {item.quantity}
          </span>
          <button
            type="button"
            className="inline-flex h-7 w-7 shrink-0 items-center justify-center rounded-full border border-[var(--hairline-strong)] bg-[var(--surface-2)] text-[var(--accent-brand)] transition-[border-color,transform] duration-150 hover:border-[var(--accent-brand)] active:scale-[0.92] [&_svg]:h-3.5 [&_svg]:w-3.5"
            onClick={() => onQuantityChange(1)}
            aria-label="Agregar uno"
          >
            <Plus />
          </button>
          <button
            type="button"
            className="inline-flex size-7 items-center justify-center rounded-full text-[var(--accent-brand)] transition-colors hover:bg-[var(--surface-0)]"
            onClick={onRemove}
            aria-label="Eliminar"
          >
            <Trash2 className="size-4" />
          </button>
        </div>
      </div>

      {expanded && (
        <BurgerCustomizePanel
          item={item}
          toppingExtras={toppingExtras}
          onMeatChange={onMeatChange}
          onFriesChange={onFriesChange}
          onToggleVeggie={onToggleVeggie}
          onToggleExtra={onToggleExtra}
          onExtraQuantityChange={onExtraQuantityChange}
        />
      )}
    </div>
  );
}
