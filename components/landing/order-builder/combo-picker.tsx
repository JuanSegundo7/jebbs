"use client";

import { useState } from "react";
import { Trash2, UtensilsCrossed, Minus, Plus } from "lucide-react";
import { cn } from "@/lib/utils";
import type { Burger, Extra } from "@/lib/types";
import type { ComboWithSlots } from "@/lib/types/combo-types";
import type { useComboSelection } from "@/hooks/use-combo-selection";
import {
  comboDescriptionText,
  describeComboSlots,
} from "@/lib/catalog/menu-description";
import { formatArs } from "./currency";
import { MenuCategoryHeader } from "./menu-category-header";
import { MenuItemSheet } from "./menu-item-sheet";

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

  const [detail, setDetail] = useState<ComboWithSlots | null>(null);
  const [open, setOpen] = useState(false);

  // Doesn't clear `detail` on close -- only `open` -- so the drawer's own
  // close animation still has content to animate out instead of cutting to
  // an empty sheet mid-transition.
  const showDetail = (c: ComboWithSlots) => {
    setDetail(c);
    setOpen(true);
  };

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
    <>
      <div className="space-y-6">
        <div>
          <MenuCategoryHeader title="Combos" />
          <div>
            {combos.map((combo) => {
              const count = comboCountFor(combo.id);
              const description = comboDescriptionText(combo);
              return (
                <div
                  key={combo.id}
                  className={cn(
                    "flex items-center gap-[15px] border-b border-dashed border-[var(--hairline-strong)] py-[15px] pl-0 transition-[border-color,background-color,transform,padding-left] duration-200 ease-[cubic-bezier(0.16,1,0.3,1)] last:border-b-0 hover:border-[var(--foreground)] hover:bg-[color-mix(in_srgb,var(--foreground)_3%,transparent)] active:scale-[0.99]",
                    count > 0 && "bg-[linear-gradient(90deg,var(--accent-tint-16),transparent_60%)] pl-3",
                  )}
                >
                  <button
                    type="button"
                    className="flex min-w-0 flex-1 items-center gap-[15px] text-left transition-colors active:bg-white/[0.03]"
                    onClick={() => showDetail(combo)}
                    aria-haspopup="dialog"
                  >
                    <div className="flex h-[60px] w-[60px] shrink-0 items-center justify-center overflow-hidden rounded-[3px] border border-[var(--hairline)] bg-[var(--surface-2)]">
                      <UtensilsCrossed
                        className="size-6 text-[var(--muted-foreground-dim)]"
                        strokeWidth={1.25}
                        aria-hidden
                      />
                    </div>

                    <div className="min-w-0 flex-1">
                      <div className="flex items-baseline">
                        <span className="font-condensed text-[1.22rem] font-bold tracking-[.04em] text-[var(--foreground)] uppercase">
                          {combo.name}
                        </span>
                        <span
                          className="mb-[0.3em] min-w-[1rem] flex-1 self-end border-b border-dotted border-[var(--muted-foreground-dim)]"
                          aria-hidden
                        />
                        <span className="numeric shrink-0 font-condensed text-[1.22rem] font-bold text-[var(--accent-brand)]">
                          {formatArs(combo.price)}
                        </span>
                      </div>
                      {description && (
                        <p className="mt-1 line-clamp-2 font-body text-[0.94rem] leading-[1.45] tracking-[0.005em] text-[var(--muted-foreground)]">
                          {description}
                        </p>
                      )}
                    </div>
                  </button>

                  <div className="flex shrink-0 items-center gap-0.5 rounded-[3px] border border-[var(--hairline)] bg-[var(--surface-2)]">
                    <button
                      type="button"
                      className="inline-flex h-9 w-9 items-center justify-center text-[var(--foreground)] transition-[color,transform] duration-150 [transition-timing-function:cubic-bezier(0.16,1,0.3,1)] hover:text-[var(--accent-brand)] active:scale-90 disabled:pointer-events-none disabled:opacity-40 [&_svg]:h-3.5 [&_svg]:w-3.5"
                      onClick={() => decrementCombo(combo.id)}
                      disabled={count === 0}
                      aria-label={`Quitar ${combo.name}`}
                    >
                      <Minus />
                    </button>
                    <output className="numeric w-[26px] text-center font-condensed text-[1.1rem] font-bold text-[var(--muted-foreground)]">
                      {count}
                    </output>
                    <button
                      type="button"
                      className="inline-flex h-9 w-9 items-center justify-center text-[var(--foreground)] transition-[color,transform] duration-150 [transition-timing-function:cubic-bezier(0.16,1,0.3,1)] hover:text-[var(--accent-brand)] active:scale-90 disabled:pointer-events-none disabled:opacity-40 [&_svg]:h-3.5 [&_svg]:w-3.5"
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
          <div key={instance.id} className="ios-glass space-y-4 rounded-xl p-3">
            <div className="flex items-center justify-between">
              <span className="font-condensed text-sm font-bold tracking-[.03em] text-[var(--foreground)] uppercase">
                {instance.combo.name}
              </span>
              <button
                type="button"
                className="inline-flex size-7 items-center justify-center rounded-full text-[var(--accent-brand)] transition-colors hover:bg-[var(--surface-0)]"
                onClick={() => removeCombo(instance.id)}
                aria-label="Eliminar combo"
              >
                <Trash2 className="size-4" />
              </button>
            </div>

            {instance.slots.map((slot) => {
              if (slot.slotType === "burger") {
                const remaining = getRemainingQuantity(
                  instance.id,
                  slot.slotId,
                );
                return (
                  <div key={slot.slotId} className="space-y-2">
                    <p className="font-condensed text-xs font-bold tracking-[.08em] text-[var(--muted-foreground)] uppercase">
                      Hamburguesas ({remaining} disponibles)
                    </p>
                    <ul className="space-y-1">
                      {slot.burgers.map((item) => (
                        <li
                          key={item.id}
                          className="flex items-center justify-between font-body text-sm text-[var(--foreground)]"
                        >
                          <span>{item.burger.name}</span>
                          <button
                            type="button"
                            className="text-[var(--accent-brand)]"
                            onClick={() =>
                              removeBurgerFromSlot(
                                instance.id,
                                slot.slotId,
                                item.id,
                              )
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
                            canAddBurgerToSlot(
                              instance.id,
                              slot.slotId,
                              burger,
                            ),
                          )
                          .map((burger) => (
                            <button
                              key={burger.id}
                              type="button"
                              className="rounded-full border border-[var(--hairline-strong)] px-3 py-1 font-condensed text-[11px] font-bold tracking-[.04em] text-[var(--muted-foreground)] uppercase transition-colors hover:border-[var(--accent-brand)] hover:text-[var(--accent-brand)]"
                              onClick={() =>
                                addBurgerToSlot(
                                  instance.id,
                                  slot.slotId,
                                  burger,
                                )
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
                const options =
                  slot.slotType === "drink" ? drinkExtras : sideExtras;
                const label =
                  slot.slotType === "drink" ? "Bebida" : "Acompañamiento";
                const selectedIds = slot.selectedExtras.map((e) => e.id);

                return (
                  <div key={slot.slotId} className="space-y-2">
                    <p className="font-condensed text-xs font-bold tracking-[.08em] text-[var(--muted-foreground)] uppercase">
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
                                ? "border-[var(--accent-brand)] bg-[var(--accent-brand)] text-[var(--accent-contrast)]"
                                : "border-[var(--hairline-strong)] text-[var(--muted-foreground)]",
                            )}
                            onClick={() =>
                              timesSelected > 0
                                ? removeOneExtraFromSlot(
                                    instance.id,
                                    slot.slotId,
                                    extra,
                                  )
                                : selectExtraForSlot(
                                    instance.id,
                                    slot.slotId,
                                    extra,
                                  )
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

      {detail && (
        <MenuItemSheet
          open={open}
          onOpenChange={setOpen}
          name={detail.name}
          price={detail.price}
          description={comboDescriptionText(detail)}
          fallbackIcon={UtensilsCrossed}
          count={comboCountFor(detail.id)}
          onAdd={() => addCombo(detail)}
          onRemove={() => decrementCombo(detail.id)}
          footnote={
            comboCountFor(detail.id) > 0
              ? "Elegí las hamburguesas y bebidas de tu combo abajo."
              : null
          }
        >
          <div className="mt-4">
            <p className="mb-2 font-condensed text-xs font-bold tracking-[.16em] text-[var(--muted-foreground)] uppercase">
              Qué incluye
            </p>
            <ul className="space-y-1 font-body text-sm text-[var(--foreground)]">
              {describeComboSlots(detail).map((line, i) => (
                <li key={i}>{line}</li>
              ))}
            </ul>
          </div>
        </MenuItemSheet>
      )}
    </>
  );
}
