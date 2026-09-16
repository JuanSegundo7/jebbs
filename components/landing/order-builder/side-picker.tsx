"use client";

import { Minus, Plus, Trash2 } from "lucide-react";
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
            <div key={extra.id} className="menu-row last:border-b-0">
              <div className="min-w-0 flex-1">
                <div className="flex items-baseline">
                  <span className="font-condensed text-[15px] font-bold tracking-[.04em] text-[var(--cream)] uppercase">
                    {extra.name}
                  </span>
                  <span className="menu-leader" aria-hidden />
                  <span className="numeric shrink-0 font-condensed font-bold text-[var(--cheddar)]">
                    {formatArs(extra.price)}
                  </span>
                </div>
              </div>

              <div className="flex shrink-0 items-center gap-2">
                {count > 0 && (
                  <>
                    <button
                      type="button"
                      className="diner-stepper-btn"
                      onClick={() => onRemove(extra.id)}
                      aria-label={`Quitar ${extra.name}`}
                    >
                      <Minus />
                    </button>
                    <span className="numeric w-4 text-center font-condensed text-sm font-bold text-[var(--cream)]">
                      {count}
                    </span>
                  </>
                )}
                <button
                  type="button"
                  className="diner-stepper-btn"
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
              className="flex items-center justify-between gap-2 rounded-xl border border-[var(--line)] bg-[var(--slab)] p-3"
            >
              <span className="font-condensed text-sm font-bold tracking-[.03em] text-[var(--cream)] uppercase">
                {side.extra.name}
              </span>
              <div className="flex items-center gap-1">
                <button
                  type="button"
                  className="diner-stepper-btn"
                  onClick={() => updateQuantity(side.id, -1)}
                  aria-label="Quitar uno"
                >
                  <Minus />
                </button>
                <span className="numeric w-6 text-center text-sm text-[var(--cream)]">
                  {side.quantity}
                </span>
                <button
                  type="button"
                  className="diner-stepper-btn"
                  onClick={() => updateQuantity(side.id, 1)}
                  aria-label="Agregar uno"
                >
                  <Plus />
                </button>
                <button
                  type="button"
                  className="inline-flex size-7 items-center justify-center rounded-full text-[var(--ember)] transition-colors hover:bg-[var(--coal)]"
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
