"use client";

import { Trash2, UtensilsCrossed, Minus, Plus } from "lucide-react";
import { cn } from "@/lib/utils";
import type { Burger, Extra } from "@/lib/types";
import type { ComboWithSlots } from "@/lib/types/combo-types";
import type { useComboSelection } from "@/hooks/use-combo-selection";
import { formatArs } from "./currency";
import { MenuCategoryHeader } from "./menu-category-header";

interface ComboPickerProps {
  combos: ComboWithSlots[];
  burgers: Burger[];
  drinkExtras: Extra[];
  sideExtras: Extra[];
  selection: ReturnType<typeof useComboSelection>;
}

// Printed-menu list (reference site: jebbs-burgers.vercel.app), same
// pattern as BurgerPicker/SidePicker. Combos have no image_url in the
// catalog, so the thumbnail is a fixed icon tile instead of a photo. All
// selection/slot logic below is exactly what ComboPicker already had
// (useComboSelection, untouched) -- only the visual wrapper changed.
export function ComboPicker({
  combos,
  burgers,
  drinkExtras,
  sideExtras,
  selection,
}: ComboPickerProps) {
  const {
    selectedCombos,
    addCombo,
    removeCombo,
    getRemainingQuantity,
    canAddBurgerToSlot,
    addBurgerToSlot,
    removeBurgerFromSlot,
    selectExtraForSlot,
    removeOneExtraFromSlot,
  } = selection;

  const comboCountFor = (comboId: string) =>
    selectedCombos.filter((c) => c.combo.id === comboId).length;

  // Derived helper, not new state: combos have no quantity merge (each add
  // is a distinct customizable instance), so the browsing row's "-" removes
  // the most-recently-added instance of this combo -- the same instance a
  // customer who just tapped "+" would expect to undo.
  const decrementCombo = (comboId: string) => {
    const instances = selectedCombos.filter((c) => c.combo.id === comboId);
    const last = instances[instances.length - 1];
    if (last) removeCombo(last.id);
  };

  return (
    <div className="space-y-6">
      <div>
        <MenuCategoryHeader title="Combos" />
        <div>
          {combos.map((combo) => {
            const count = comboCountFor(combo.id);
            return (
              <div
                key={combo.id}
                className={cn("menu-row last:border-b-0", count > 0 && "menu-row-active")}
              >
                <div className="diner-thumb flex items-center justify-center">
                  <UtensilsCrossed className="size-6 text-[var(--ash-dim)]" strokeWidth={1.25} aria-hidden />
                </div>

                <div className="min-w-0 flex-1">
                  <div className="flex items-baseline">
                    <span className="font-condensed text-[1.22rem] font-bold tracking-[.04em] text-[var(--cream)] uppercase">
                      {combo.name}
                    </span>
                    <span className="menu-leader" aria-hidden />
                    <span className="numeric shrink-0 font-condensed text-[1.22rem] font-bold text-[var(--cheddar)]">
                      {formatArs(combo.price)}
                    </span>
                  </div>
                  {combo.description && (
                    <p className="mt-1 line-clamp-2 font-body text-[0.94rem] leading-[1.4] text-[var(--ash)]">
                      {combo.description}
                    </p>
                  )}
                </div>

                <div className="diner-stepper">
                  <button
                    type="button"
                    className="diner-st"
                    onClick={() => decrementCombo(combo.id)}
                    disabled={count === 0}
                    aria-label={`Quitar ${combo.name}`}
                  >
                    <Minus />
                  </button>
                  <output className="diner-qty">{count}</output>
                  <button
                    type="button"
                    className="diner-st"
                    onClick={() => addCombo(combo)}
                    aria-label={`Agregar ${combo.name}`}
                  >
                    <Plus />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {selectedCombos.map((instance) => (
        <div
          key={instance.id}
          className="space-y-4 rounded-xl border border-[var(--line)] bg-[var(--slab)] p-3"
        >
          <div className="flex items-center justify-between">
            <span className="font-condensed text-sm font-bold tracking-[.03em] text-[var(--cream)] uppercase">
              {instance.combo.name}
            </span>
            <button
              type="button"
              className="inline-flex size-7 items-center justify-center rounded-full text-[var(--ember)] transition-colors hover:bg-[var(--coal)]"
              onClick={() => removeCombo(instance.id)}
              aria-label="Eliminar combo"
            >
              <Trash2 className="size-4" />
            </button>
          </div>

          {instance.slots.map((slot) => {
            if (slot.slotType === "burger") {
              const remaining = getRemainingQuantity(instance.id, slot.slotId);
              return (
                <div key={slot.slotId} className="space-y-2">
                  <p className="font-condensed text-xs font-bold tracking-[.08em] text-[var(--ash)] uppercase">
                    Hamburguesas ({remaining} disponibles)
                  </p>
                  <ul className="space-y-1">
                    {slot.burgers.map((item) => (
                      <li
                        key={item.id}
                        className="flex items-center justify-between font-body text-sm text-[var(--cream)]"
                      >
                        <span>{item.burger.name}</span>
                        <button
                          type="button"
                          className="text-[var(--ember)]"
                          onClick={() =>
                            removeBurgerFromSlot(instance.id, slot.slotId, item.id)
                          }
                          aria-label="Quitar hamburguesa del combo"
                        >
                          <Trash2 className="size-4" />
                        </button>
                      </li>
                    ))}
                  </ul>
                  {remaining > 0 && (
                    <div className="flex flex-wrap gap-2">
                      {burgers
                        .filter((burger) =>
                          canAddBurgerToSlot(instance.id, slot.slotId, burger),
                        )
                        .map((burger) => (
                          <button
                            key={burger.id}
                            type="button"
                            className="rounded-full border border-[var(--line-2)] px-3 py-1 font-condensed text-[11px] font-bold tracking-[.04em] text-[var(--ash)] uppercase"
                            onClick={() =>
                              addBurgerToSlot(instance.id, slot.slotId, burger)
                            }
                          >
                            {burger.name}
                          </button>
                        ))}
                    </div>
                  )}
                </div>
              );
            }

            if (slot.slotType === "drink" || slot.slotType === "side") {
              const options = slot.slotType === "drink" ? drinkExtras : sideExtras;
              const label = slot.slotType === "drink" ? "Bebida" : "Acompañamiento";
              const selectedIds = slot.selectedExtras.map((e) => e.id);

              return (
                <div key={slot.slotId} className="space-y-2">
                  <p className="font-condensed text-xs font-bold tracking-[.08em] text-[var(--ash)] uppercase">
                    {label}
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {options.map((extra) => {
                      const timesSelected = selectedIds.filter(
                        (id) => id === extra.id,
                      ).length;
                      return (
                        <button
                          key={extra.id}
                          type="button"
                          className={cn(
                            "rounded-full border px-3 py-1 font-condensed text-[11px] font-bold tracking-[.04em] uppercase",
                            timesSelected > 0
                              ? "border-[var(--cheddar)] bg-[var(--cheddar)] text-[var(--coal)]"
                              : "border-[var(--line-2)] text-[var(--ash)]",
                          )}
                          onClick={() =>
                            timesSelected > 0
                              ? removeOneExtraFromSlot(instance.id, slot.slotId, extra)
                              : selectExtraForSlot(instance.id, slot.slotId, extra)
                          }
                        >
                          {extra.name}
                          {timesSelected > 0 ? ` (${timesSelected})` : ""}
                        </button>
                      );
                    })}
                  </div>
                </div>
              );
            }

            return null;
          })}
        </div>
      ))}
    </div>
  );
}
