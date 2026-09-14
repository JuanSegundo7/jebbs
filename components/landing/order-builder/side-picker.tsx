"use client";

import { Minus, Plus, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import type { Extra } from "@/lib/types";
import type { useSidesSelection } from "@/hooks/use-side-selection";
import { formatArs } from "./currency";

interface SidePickerProps {
  sides: Extra[];
  selection: ReturnType<typeof useSidesSelection>;
}

export function SidePicker({ sides, selection }: SidePickerProps) {
  const {
    selectedSides,
    addSide,
    removeSide,
    updateQuantity,
  } = selection;

  const countFor = (extraId: string) =>
    selectedSides.find((s) => s.extra.id === extraId)?.quantity ?? 0;

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
        {sides.map((extra) => {
          const count = countFor(extra.id);
          return (
            <Card
              key={extra.id}
              interactive
              className={cn(
                "cursor-pointer relative",
                count > 0 && "ring-2 ring-primary",
              )}
              onClick={() => addSide(extra)}
            >
              <CardContent className="p-3">
                {count > 0 && (
                  <span className="absolute -top-2 -right-2 flex h-5 w-5 items-center justify-center rounded-full bg-primary text-caption text-primary-foreground">
                    {count}
                  </span>
                )}
                <p className="font-medium">{extra.name}</p>
                <p className="text-subheadline text-muted-foreground">
                  {formatArs(extra.price)}
                </p>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {selectedSides.length > 0 && (
        <div className="space-y-2">
          {selectedSides.map((side) => (
            <Card key={side.id} depth="flat">
              <CardContent className="flex items-center justify-between gap-2 p-3">
                <span className="font-medium">{side.extra.name}</span>
                <div className="flex items-center gap-1">
                  <Button
                    variant="outline"
                    size="icon-sm"
                    onClick={() => updateQuantity(side.id, -1)}
                    aria-label="Quitar uno"
                  >
                    <Minus />
                  </Button>
                  <span className="w-6 text-center text-subheadline">
                    {side.quantity}
                  </span>
                  <Button
                    variant="outline"
                    size="icon-sm"
                    onClick={() => updateQuantity(side.id, 1)}
                    aria-label="Agregar uno"
                  >
                    <Plus />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon-sm"
                    className="text-destructive"
                    onClick={() => removeSide(side.id)}
                    aria-label="Eliminar"
                  >
                    <Trash2 />
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
