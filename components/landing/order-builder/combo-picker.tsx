"use client";

import { Trash2, UtensilsCrossed } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import type { Burger, Extra } from "@/lib/types";
import type { ComboWithSlots } from "@/lib/types/combo-types";
import type { useComboSelection } from "@/hooks/use-combo-selection";
import { formatArs } from "./currency";

interface ComboPickerProps {
  combos: ComboWithSlots[];
  burgers: Burger[];
  drinkExtras: Extra[];
  sideExtras: Extra[];
  selection: ReturnType<typeof useComboSelection>;
}

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

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
        {combos.map((combo) => {
          const count = comboCountFor(combo.id);
          return (
            <Card
              key={combo.id}
              interactive
              className={cn(
                "cursor-pointer relative gap-0 overflow-hidden p-0",
                count > 0 && "ring-2 ring-primary",
              )}
              onClick={() => addCombo(combo)}
            >
              {count > 0 && (
                <span className="absolute -top-2 -right-2 z-10 flex h-5 w-5 items-center justify-center rounded-full bg-primary text-caption text-primary-foreground">
                  {count}
                </span>
              )}
              {/* Combo has no image_url in the catalog -- an icon tile keeps
                  the same visual weight as BurgerPicker's photo cards
                  instead of leaving this grid bare. */}
              <div className="flex aspect-[4/3] w-full items-center justify-center bg-[var(--accent-tint-08)]">
                <UtensilsCrossed
                  className="size-8 text-muted-foreground"
                  strokeWidth={1.25}
                  aria-hidden
                />
              </div>
              <CardContent className="space-y-0.5 p-3">
                <p className="text-subheadline font-medium text-foreground">
                  {combo.name}
                </p>
                {combo.description && (
                  <p className="line-clamp-2 text-caption text-muted-foreground">
                    {combo.description}
                  </p>
                )}
                <p className="text-footnote font-medium text-accent-foreground">
                  {formatArs(combo.price)}
                </p>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {selectedCombos.map((instance) => (
        <Card key={instance.id} depth="flat">
          <CardContent className="space-y-4 p-3">
            <div className="flex items-center justify-between">
              <span className="font-medium">{instance.combo.name}</span>
              <Button
                variant="ghost"
                size="icon-sm"
                className="text-destructive"
                onClick={() => removeCombo(instance.id)}
                aria-label="Eliminar combo"
              >
                <Trash2 />
              </Button>
            </div>

            {instance.slots.map((slot) => {
              if (slot.slotType === "burger") {
                const remaining = getRemainingQuantity(instance.id, slot.slotId);
                return (
                  <div key={slot.slotId} className="space-y-2">
                    <p className="text-caption text-muted-foreground">
                      Hamburguesas ({remaining} disponibles)
                    </p>
                    <ul className="space-y-1">
                      {slot.burgers.map((item) => (
                        <li
                          key={item.id}
                          className="flex items-center justify-between text-subheadline"
                        >
                          <span>{item.burger.name}</span>
                          <button
                            type="button"
                            className="text-destructive"
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
                              className="rounded-full border border-border px-3 py-1 text-caption"
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
                    <p className="text-caption text-muted-foreground">{label}</p>
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
                              "rounded-full border px-3 py-1 text-caption",
                              timesSelected > 0
                                ? "border-primary bg-primary text-primary-foreground"
                                : "border-border",
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
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
