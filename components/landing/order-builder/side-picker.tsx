"use client";

import { Minus, Plus, Trash2 } from "lucide-react";
import { cn } from "@/lib/utils";
import type { Extra } from "@/lib/types";
import type { useSidesSelection } from "@/hooks/use-side-selection";
import { formatArs } from "./currency";
import { MenuCategoryHeader } from "./menu-category-header";

interface SidePickerProps {
  /** Standalone-purchasable extras for this tab -- drinks + sides, both
   * routed through the same generic useSidesSelection. Only the display is
   * category-aware: it groups by Extra.category into two labeled
   * sub-sections instead of one undifferentiated grid. */
  sides: Extra[];
  selection: ReturnType<typeof useSidesSelection>;
}

interface SidesGroupProps {
  title: string;
  items: Extra[];
  countFor: (extraId: string) => number;
  onAdd: (extra: Extra) => void;
  onRemove: (extraId: string) => void;
}

// Printed-menu list (reference site: jebbs-burgers.vercel.app), same
// pattern as BurgerPicker/ComboPicker. useSidesSelection already merges
// repeat adds of the same Extra into one row with a quantity, so the
// browsing row's stepper reads/writes that row directly -- no derived
// "last instance" lookup needed here, unlike burgers/combos.
function SidesGroup({ title, items, countFor, onAdd, onRemove }: SidesGroupProps) {
  if (items.length === 0) return null;

  return (
    <div>
      <MenuCategoryHeader title={title} />
      <div>
        {items.map((extra) => {
          const count = countFor(extra.id);
          return (
            <div
              key={extra.id}
              className={cn(
                "flex items-center gap-[15px] border-b border-dashed border-[var(--hairline-strong)] py-[15px] transition-[border-color,background-color,transform] duration-200 ease-[cubic-bezier(0.16,1,0.3,1)] last:border-b-0 hover:border-[var(--foreground)] hover:bg-[color-mix(in_srgb,var(--foreground)_3%,transparent)] active:scale-[0.99]",
                count > 0 && "bg-[linear-gradient(90deg,var(--accent-tint-16),transparent_60%)]",
              )}
            >
              <div className="min-w-0 flex-1">
                <div className="flex items-baseline">
                  <span className="font-sans text-[1.22rem] font-bold text-[var(--foreground)]">
                    {extra.name}
                  </span>
                  <span
                    className="mb-[0.3em] min-w-[1rem] flex-1 self-end border-b border-dotted border-[var(--muted-foreground-dim)]"
                    aria-hidden
                  />
                  <span className="numeric shrink-0 font-sans text-[1.22rem] font-bold text-[var(--accent-brand)]">
                    {formatArs(extra.price)}
                  </span>
                </div>
              </div>

              <div className="flex shrink-0 items-center gap-0.5 rounded-[3px] border border-[var(--hairline)] bg-[var(--surface-2)]">
                <button
                  type="button"
                  className="inline-flex h-9 w-9 items-center justify-center text-[var(--foreground)] transition-[color,transform] duration-150 [transition-timing-function:cubic-bezier(0.16,1,0.3,1)] hover:text-[var(--accent-brand)] active:scale-90 disabled:pointer-events-none disabled:opacity-40 [&_svg]:h-3.5 [&_svg]:w-3.5"
                  onClick={() => onRemove(extra.id)}
                  disabled={count === 0}
                  aria-label={`Quitar ${extra.name}`}
                >
                  <Minus />
                </button>
                <output className="numeric w-[26px] text-center font-sans text-[1.1rem] font-bold text-[var(--muted-foreground)]">
                  {count}
                </output>
                <button
                  type="button"
                  className="inline-flex h-9 w-9 items-center justify-center text-[var(--foreground)] transition-[color,transform] duration-150 [transition-timing-function:cubic-bezier(0.16,1,0.3,1)] hover:text-[var(--accent-brand)] active:scale-90 disabled:pointer-events-none disabled:opacity-40 [&_svg]:h-3.5 [&_svg]:w-3.5"
                  onClick={() => onAdd(extra)}
                  aria-label={`Agregar ${extra.name}`}
                >
                  <Plus />
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

export function SidePicker({ sides, selection }: SidePickerProps) {
  const { selectedSides, addSide, removeSide, updateQuantity } = selection;

  const countFor = (extraId: string) =>
    selectedSides.find((s) => s.extra.id === extraId)?.quantity ?? 0;

  // Derived helper, not new state: mirrors countFor to resolve the extra id
  // (used by the browsing row) back to its selection id (what updateQuantity
  // needs).
  const decrementByExtraId = (extraId: string) => {
    const entry = selectedSides.find((s) => s.extra.id === extraId);
    if (entry) updateQuantity(entry.id, -1);
  };

  const drinks = sides.filter((s) => s.category === "drink");
  const snacks = sides.filter((s) => s.category !== "drink");

  return (
    <div className="space-y-6">
      <SidesGroup
        title="Bebidas"
        items={drinks}
        countFor={countFor}
        onAdd={addSide}
        onRemove={decrementByExtraId}
      />
      <SidesGroup
        title="Acompañamientos"
        items={snacks}
        countFor={countFor}
        onAdd={addSide}
        onRemove={decrementByExtraId}
      />

      {selectedSides.length > 0 && (
        <div className="space-y-2">
          {selectedSides.map((side) => (
            <div
              key={side.id}
              className="flex items-center justify-between gap-2 rounded-xl border border-[var(--hairline)] bg-[var(--surface-2)] p-3"
            >
              <span className="font-sans text-sm font-bold text-[var(--foreground)]">
                {side.extra.name}
              </span>
              <div className="flex items-center gap-1">
                <button
                  type="button"
                  className="inline-flex h-7 w-7 shrink-0 items-center justify-center rounded-full border border-[var(--hairline-strong)] bg-[var(--surface-1)] text-[var(--accent-brand)] transition-[border-color,transform] duration-150 hover:border-[var(--accent-brand)] active:scale-[0.92] [&_svg]:h-3.5 [&_svg]:w-3.5"
                  onClick={() => updateQuantity(side.id, -1)}
                  aria-label="Quitar uno"
                >
                  <Minus />
                </button>
                <span className="numeric w-6 text-center text-sm text-[var(--foreground)]">
                  {side.quantity}
                </span>
                <button
                  type="button"
                  className="inline-flex h-7 w-7 shrink-0 items-center justify-center rounded-full border border-[var(--hairline-strong)] bg-[var(--surface-1)] text-[var(--accent-brand)] transition-[border-color,transform] duration-150 hover:border-[var(--accent-brand)] active:scale-[0.92] [&_svg]:h-3.5 [&_svg]:w-3.5"
                  onClick={() => updateQuantity(side.id, 1)}
                  aria-label="Agregar uno"
                >
                  <Plus />
                </button>
                <button
                  type="button"
                  className="inline-flex size-7 items-center justify-center rounded-full text-[var(--accent-brand)] transition-colors hover:bg-[var(--surface-0)]"
                  onClick={() => removeSide(side.id)}
                  aria-label="Eliminar"
                >
                  <Trash2 className="size-4" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
