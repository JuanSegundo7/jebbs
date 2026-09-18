"use client";

import Image from "next/image";
import { Beef, ChevronDown, Minus, Plus, Trash2 } from "lucide-react";
import { cn } from "@/lib/utils";
import type { Burger, Extra } from "@/lib/types";
import type { useBurgerSelection } from "@/hooks/use-burger-selection";
import { summarizeBurger } from "@/lib/order/customization-summary";
import { formatArs } from "./currency";
import { MenuCategoryHeader } from "./menu-category-header";

interface BurgerPickerProps {
  burgers: Burger[];
  toppingExtras: Extra[];
  selection: ReturnType<typeof useBurgerSelection>;
}

// Printed-menu list (reference site: jebbs-burgers.vercel.app) instead of a
// grid of cards: thumbnail, name, leader dots, price, description, +/-
// stepper. The selection/quantity/detail-expansion logic below is exactly
// what BurgerPicker already had (useBurgerSelection, untouched) -- only the
// visual wrapper changed.
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

  // Derived helper, not new state: the browsing row's "-" decrements the
  // most-recently-added instance of this burger. Per-instance detail
  // (meat/fries/veggie/extras) is still edited below, in the expanded
  // selected-items list -- this only mirrors what the "+" (addBurger) does.
  const decrementBurger = (burgerId: string) => {
    const instances = selectedBurgers.filter((b) => b.burger.id === burgerId);
    const last = instances[instances.length - 1];
    if (last) updateQuantity(last.id, -1);
  };

  return (
    <div className="space-y-6">
      <div>
        <MenuCategoryHeader title="Hamburguesas" />
        <div>
          {burgers.map((burger) => {
            const count = countFor(burger.id);
            return (
              <div
                key={burger.id}
                className={cn("menu-row last:border-b-0", count > 0 && "menu-row-active")}
              >
                <div className="diner-thumb">
                  {burger.image_url ? (
                    <Image
                      src={burger.image_url}
                      alt={burger.name}
                      fill
                      sizes="60px"
                      className="object-cover"
                    />
                  ) : (
                    <div className="flex h-full w-full items-center justify-center">
                      <Beef className="size-6 text-[var(--ash-dim)]" strokeWidth={1.25} aria-hidden />
                    </div>
                  )}
                </div>

                <div className="min-w-0 flex-1">
                  <div className="flex items-baseline">
                    <span className="font-condensed text-[1.22rem] font-bold tracking-[.04em] text-[var(--cream)] uppercase">
                      {burger.name}
                    </span>
                    <span className="menu-leader" aria-hidden />
                    <span className="numeric shrink-0 font-condensed text-[1.22rem] font-bold text-[var(--cheddar)]">
                      {formatArs(burger.base_price)}
                    </span>
                  </div>
                  {burger.description && (
                    <p className="mt-1 font-body text-[0.94rem] leading-[1.4] text-[var(--ash)]">
                      {burger.description}
                    </p>
                  )}
                </div>

                <div className="diner-stepper">
                  <button
                    type="button"
                    className="diner-st"
                    onClick={() => decrementBurger(burger.id)}
                    disabled={count === 0}
                    aria-label={`Quitar ${burger.name}`}
                  >
                    <Minus />
                  </button>
                  <output className="diner-qty">{count}</output>
                  <button
                    type="button"
                    className="diner-st"
                    onClick={() => addBurger(burger)}
                    aria-label={`Agregar ${burger.name}`}
                  >
                    <Plus />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {selectedBurgers.length > 0 && (
        <div className="space-y-2">
          <p className="font-condensed text-xs font-bold tracking-[.16em] text-[var(--ash)] uppercase">
            Personalizá tu pedido
          </p>
          {selectedBurgers.map((item) => {
            const expanded = expandedBurger === item.id;
            return (
              <div
                key={item.id}
                className="space-y-3 rounded-xl border border-[var(--line)] bg-[var(--slab)] p-3"
              >
                <div className="flex items-center justify-between gap-2">
                  <button
                    type="button"
                    className="flex min-w-0 flex-1 items-center gap-2 text-left"
                    onClick={() => toggleExpanded(item.id)}
                    aria-expanded={expanded}
                  >
                    <ChevronDown
                      className={cn(
                        "size-4 shrink-0 text-[var(--ash)] transition-transform",
                        expanded && "rotate-180",
                      )}
                      aria-hidden
                    />
                    <span className="min-w-0 flex-1">
                      <span className="block font-condensed text-sm font-bold tracking-[.03em] text-[var(--cream)] uppercase">
                        {item.burger.name}
                      </span>
                      {!expanded && (
                        <span className="block truncate font-body text-xs text-[var(--ash)]">
                          {summarizeBurger(item) ?? "Sin modificar · tocá para personalizar"}
                        </span>
                      )}
                    </span>
                  </button>
                  <div className="flex items-center gap-1">
                    <button
                      type="button"
                      className="diner-stepper-btn"
                      onClick={() => updateQuantity(item.id, -1)}
                      aria-label="Quitar uno"
                    >
                      <Minus />
                    </button>
                    <span className="numeric w-6 text-center text-sm text-[var(--cream)]">
                      {item.quantity}
                    </span>
                    <button
                      type="button"
                      className="diner-stepper-btn"
                      onClick={() => updateQuantity(item.id, 1)}
                      aria-label="Agregar uno"
                    >
                      <Plus />
                    </button>
                    <button
                      type="button"
                      className="inline-flex size-7 items-center justify-center rounded-full text-[var(--ember)] transition-colors hover:bg-[var(--coal)]"
                      onClick={() => removeBurger(item.id)}
                      aria-label="Eliminar"
                    >
                      <Trash2 className="size-4" />
                    </button>
                  </div>
                </div>

                {expanded && (
                  <div className="space-y-3 border-t border-[var(--line)] pt-3">
                    <div className="flex items-center justify-between">
                      <span className="font-condensed text-xs font-bold tracking-[.08em] text-[var(--ash)] uppercase">
                        Carne
                      </span>
                      <div className="flex items-center gap-1">
                        <button
                          type="button"
                          className="diner-stepper-btn"
                          onClick={() => updateMeatCount(item.id, -1)}
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
                          onClick={() => updateMeatCount(item.id, 1)}
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
                          onClick={() => updateFriesQuantity(item.id, -1)}
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
                          onClick={() => updateFriesQuantity(item.id, 1)}
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
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
