"use client";

import { useState } from "react";
import Image from "next/image";
import { Beef, ChevronDown, Minus, Plus, Trash2 } from "lucide-react";
import { cn } from "@/lib/utils";
import type { Burger, Extra } from "@/lib/types";
import type { useBurgerSelection } from "@/hooks/use-burger-selection";
import { burgerDescriptionText } from "@/lib/catalog/menu-description";
import { summarizeBurger } from "@/lib/order/customization-summary";
import { BurgerCustomizePanel } from "./burger-customize-panel";
import { formatArs } from "./currency";
import { MenuCategoryHeader } from "./menu-category-header";
import { MenuItemSheet } from "./menu-item-sheet";

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
    updateExtraQuantity,
    toggleExpanded,
  } = selection;

  const [detail, setDetail] = useState<Burger | null>(null);
  const [open, setOpen] = useState(false);

  // Doesn't clear `detail` on close -- only `open` -- so the drawer's own
  // close animation still has content to animate out instead of cutting to
  // an empty sheet mid-transition.
  const showDetail = (b: Burger) => {
    setDetail(b);
    setOpen(true);
  };

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
    <>
      <div className="space-y-6">
        <div>
          <MenuCategoryHeader title="Hamburguesas" />
          <div>
            {burgers.map((burger) => {
              const count = countFor(burger.id);
              const description = burgerDescriptionText(burger);
              return (
                <div
                  key={burger.id}
                  className={cn(
                    "flex items-center gap-[15px] border-b border-dashed border-[var(--hairline-strong)] py-[15px] pl-0 transition-[border-color,background-color,transform,padding-left] duration-200 ease-[cubic-bezier(0.16,1,0.3,1)] last:border-b-0 hover:border-[var(--foreground)] hover:bg-[color-mix(in_srgb,var(--foreground)_3%,transparent)] active:scale-[0.99]",
                    count > 0 && "bg-[linear-gradient(90deg,var(--accent-tint-16),transparent_60%)] pl-3",
                  )}
                >
                  <button
                    type="button"
                    className="flex min-w-0 flex-1 items-center gap-[15px] text-left transition-colors active:bg-white/[0.03]"
                    onClick={() => showDetail(burger)}
                    aria-haspopup="dialog"
                  >
                    <div className="relative h-[60px] w-[60px] shrink-0 overflow-hidden rounded-[3px] border border-[var(--hairline)] bg-[var(--surface-2)]">
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
                          <Beef
                            className="size-6 text-[var(--muted-foreground-dim)]"
                            strokeWidth={1.25}
                            aria-hidden
                          />
                        </div>
                      )}
                    </div>

                    <div className="min-w-0 flex-1">
                      <div className="flex items-baseline">
                        <span className="font-condensed text-[1.22rem] font-bold tracking-[.04em] text-[var(--foreground)] uppercase">
                          {burger.name}
                        </span>
                        <span
                          className="mb-[0.3em] min-w-[1rem] flex-1 self-end border-b border-dotted border-[var(--muted-foreground-dim)]"
                          aria-hidden
                        />
                        <span className="numeric shrink-0 font-condensed text-[1.22rem] font-bold text-[var(--accent-brand)]">
                          {formatArs(burger.base_price)}
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
                      onClick={() => decrementBurger(burger.id)}
                      disabled={count === 0}
                      aria-label={`Quitar ${burger.name}`}
                    >
                      <Minus />
                    </button>
                    <output className="numeric w-[26px] text-center font-condensed text-[1.1rem] font-bold text-[var(--muted-foreground)]">
                      {count}
                    </output>
                    <button
                      type="button"
                      className="inline-flex h-9 w-9 items-center justify-center text-[var(--foreground)] transition-[color,transform] duration-150 [transition-timing-function:cubic-bezier(0.16,1,0.3,1)] hover:text-[var(--accent-brand)] active:scale-90 disabled:pointer-events-none disabled:opacity-40 [&_svg]:h-3.5 [&_svg]:w-3.5"
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
            <p className="font-condensed text-xs font-bold tracking-[.16em] text-[var(--muted-foreground)] uppercase">
              Personalizá tu pedido
            </p>
            {selectedBurgers.map((item) => {
              const expanded = expandedBurger === item.id;
              return (
                <div key={item.id} className="ios-glass space-y-3 rounded-xl p-3">
                  <div className="flex items-center justify-between gap-2">
                    <button
                      type="button"
                      className="flex min-w-0 flex-1 items-center gap-2 text-left"
                      onClick={() => toggleExpanded(item.id)}
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
                          <span className="block truncate font-body text-xs text-[var(--muted-foreground)]">
                            {summarizeBurger(item) ??
                              "Sin modificar · tocá para personalizar"}
                          </span>
                        )}
                      </span>
                    </button>
                    <div className="flex items-center gap-1">
                      <button
                        type="button"
                        className="inline-flex h-7 w-7 shrink-0 items-center justify-center rounded-full border border-[var(--hairline-strong)] bg-[var(--surface-2)] text-[var(--accent-brand)] transition-[border-color,transform] duration-150 hover:border-[var(--accent-brand)] active:scale-[0.92] [&_svg]:h-3.5 [&_svg]:w-3.5"
                        onClick={() => updateQuantity(item.id, -1)}
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
                        onClick={() => updateQuantity(item.id, 1)}
                        aria-label="Agregar uno"
                      >
                        <Plus />
                      </button>
                      <button
                        type="button"
                        className="inline-flex size-7 items-center justify-center rounded-full text-[var(--accent-brand)] transition-colors hover:bg-[var(--surface-0)]"
                        onClick={() => removeBurger(item.id)}
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
                      onMeatChange={(delta) => updateMeatCount(item.id, delta)}
                      onFriesChange={(delta) => updateFriesQuantity(item.id, delta)}
                      onToggleVeggie={() => toggleVeggie(item.id)}
                      onToggleExtra={(extra) => toggleExtra(item.id, extra)}
                      onExtraQuantityChange={(extraId, delta) =>
                        updateExtraQuantity(item.id, extraId, delta)
                      }
                    />
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>

      {detail && (
        <MenuItemSheet
          open={open}
          onOpenChange={setOpen}
          name={detail.name}
          price={detail.base_price}
          description={burgerDescriptionText(detail)}
          imageUrl={detail.image_url}
          fallbackIcon={Beef}
          count={countFor(detail.id)}
          onAdd={() => addBurger(detail)}
          onRemove={() => decrementBurger(detail.id)}
          footnote={
            countFor(detail.id) > 0
              ? "Agregada. Podés cambiar carne, papas y extras abajo."
              : null
          }
        >
          {detail.ingredients.length > 0 && (
            <div className="mt-4">
              <p className="mb-2 font-condensed text-xs font-bold tracking-[.16em] text-[var(--muted-foreground)] uppercase">
                Ingredientes
              </p>
              <div className="flex flex-wrap gap-2">
                {detail.ingredients.map((ing) => (
                  <span
                    key={ing}
                    className="rounded-full border border-[var(--accent-brand)]/50 px-2.5 py-0.5 font-condensed text-[0.72rem] font-bold tracking-[0.14em] text-[var(--accent-brand)] uppercase"
                  >
                    {ing}
                  </span>
                ))}
              </div>
            </div>
          )}
        </MenuItemSheet>
      )}
    </>
  );
}
