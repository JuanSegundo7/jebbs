"use client";

import { Minus, Plus, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import type { Burger, Extra } from "@/lib/types";
import type { useBurgerSelection } from "@/hooks/use-burger-selection";
import { formatArs } from "./currency";

interface BurgerPickerProps {
  burgers: Burger[];
  toppingExtras: Extra[];
  selection: ReturnType<typeof useBurgerSelection>;
}

export function BurgerPicker({
  burgers,
  toppingExtras,
  selection,
}: BurgerPickerProps) {
  const {
    selectedBurgers,
    expandedBurger,
    addBurger,
    removeBurger,
    updateQuantity,
    updateMeatCount,
    updateFriesQuantity,
    toggleVeggie,
    toggleExtra,
    toggleExpanded,
  } = selection;

  const countFor = (burgerId: string) =>
    selectedBurgers
      .filter((b) => b.burger.id === burgerId)
      .reduce((acc, b) => acc + b.quantity, 0);

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
        {burgers.map((burger) => {
          const count = countFor(burger.id);
          return (
            <Card
              key={burger.id}
              interactive
              className={cn(
                "cursor-pointer relative",
                count > 0 && "ring-2 ring-primary",
              )}
              onClick={() => addBurger(burger)}
            >
              <CardContent className="p-3">
                {count > 0 && (
                  <span className="absolute -top-2 -right-2 flex h-5 w-5 items-center justify-center rounded-full bg-primary text-caption text-primary-foreground">
                    {count}
                  </span>
                )}
                <p className="font-medium">{burger.name}</p>
                <p className="text-subheadline text-muted-foreground">
                  {formatArs(burger.base_price)}
                </p>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {selectedBurgers.length > 0 && (
        <div className="space-y-2">
          {selectedBurgers.map((item) => {
            const expanded = expandedBurger === item.id;
            return (
              <Card key={item.id} depth="flat">
                <CardContent className="space-y-3 p-3">
                  <div className="flex items-center justify-between gap-2">
                    <button
                      type="button"
                      className="flex-1 text-left font-medium"
                      onClick={() => toggleExpanded(item.id)}
                    >
                      {item.burger.name}
                    </button>
                    <div className="flex items-center gap-1">
                      <Button
                        variant="outline"
                        size="icon-sm"
                        onClick={() => updateQuantity(item.id, -1)}
                        aria-label="Quitar uno"
                      >
                        <Minus />
                      </Button>
                      <span className="w-6 text-center text-subheadline">
                        {item.quantity}
                      </span>
                      <Button
                        variant="outline"
                        size="icon-sm"
                        onClick={() => updateQuantity(item.id, 1)}
                        aria-label="Agregar uno"
                      >
                        <Plus />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon-sm"
                        className="text-destructive"
                        onClick={() => removeBurger(item.id)}
                        aria-label="Eliminar"
                      >
                        <Trash2 />
                      </Button>
                    </div>
                  </div>

                  {expanded && (
                    <div className="space-y-3 border-t pt-3">
                      <div className="flex items-center justify-between">
                        <span className="text-subheadline">Carne</span>
                        <div className="flex items-center gap-1">
                          <Button
                            variant="outline"
                            size="icon-sm"
                            onClick={() => updateMeatCount(item.id, -1)}
                            aria-label="Menos carne"
                          >
                            <Minus />
                          </Button>
                          <span className="w-6 text-center">{item.meatCount}</span>
                          <Button
                            variant="outline"
                            size="icon-sm"
                            onClick={() => updateMeatCount(item.id, 1)}
                            aria-label="Más carne"
                          >
                            <Plus />
                          </Button>
                        </div>
                      </div>

                      <div className="flex items-center justify-between">
                        <span className="text-subheadline">Papas</span>
                        <div className="flex items-center gap-1">
                          <Button
                            variant="outline"
                            size="icon-sm"
                            onClick={() => updateFriesQuantity(item.id, -1)}
                            aria-label="Menos papas"
                          >
                            <Minus />
                          </Button>
                          <span className="w-6 text-center">
                            {item.friesQuantity}
                          </span>
                          <Button
                            variant="outline"
                            size="icon-sm"
                            onClick={() => updateFriesQuantity(item.id, 1)}
                            aria-label="Más papas"
                          >
                            <Plus />
                          </Button>
                        </div>
                      </div>

                      <label className="flex items-center gap-2 text-subheadline">
                        <input
                          type="checkbox"
                          checked={item.isVeggie ?? false}
                          onChange={() => toggleVeggie(item.id)}
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
                                onClick={() => toggleExtra(item.id, extra)}
                                className={cn(
                                  "rounded-full border px-3 py-1 text-caption",
                                  active
                                    ? "border-primary bg-primary text-primary-foreground"
                                    : "border-border",
                                )}
                              >
                                {extra.name} (+{formatArs(extra.price)})
                              </button>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  )}
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
