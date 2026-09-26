"use client";

import { useState } from "react";
import { Beef, Minus, Plus } from "lucide-react";
import { cn } from "@/lib/utils";
import type { Burger, Extra } from "@/lib/types";
import type { useBurgerSelection } from "@/hooks/use-burger-selection";
import { burgerDescriptionText } from "@/lib/catalog/menu-description";
import { usePresenceList } from "@/hooks/use-presence-list";
import type { SelectedBurger } from "@/lib/types/combo-types";
import { BurgerUnitCard } from "./burger-unit-card";
import { FallbackImage } from "./fallback-image";
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
    updateQuantity,
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
  // (meat/fries/veggie/extras) is still edited in the unit cards rendered
  // under the row -- this only mirrors what the "+" (addBurger) does.
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
              const units = selectedBurgers.filter((b) => b.burger.id === burger.id);
              return (
                <div
                  key={burger.id}
                  data-burger-row
                  className="border-b border-dashed border-[var(--hairline-strong)] last:border-b-0"
                >
                <div
                  className={cn(
                    "flex items-center gap-[15px] py-[15px] pl-0 transition-[background-color,transform,padding-left] duration-200 ease-[cubic-bezier(0.16,1,0.3,1)] hover:bg-[color-mix(in_srgb,var(--foreground)_3%,transparent)] active:scale-[0.99]",
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
                        <FallbackImage
                          src={burger.image_url}
                          alt={burger.name}
                          fill
                          sizes="60px"
                          className="object-cover"
                          fallback={<BurgerThumbFallback />}
                        />
                      ) : (
                        <BurgerThumbFallback />
                      )}
                    </div>

                    <div className="min-w-0 flex-1">
                      <span className="font-condensed text-[1.22rem] font-bold tracking-[.04em] text-[var(--foreground)] uppercase">
                          {burger.name}
                        </span>
                      {description && (
                        <p className="mt-1 line-clamp-2 font-body text-[0.94rem] leading-[1.45] tracking-[0.005em] text-[var(--muted-foreground)]">
                          {description}
                        </p>
                      )}
                    </div>

                    <span className="numeric shrink-0 font-condensed text-[1.22rem] font-bold text-[var(--accent-brand)]">
                      {formatArs(burger.base_price)}
                    </span>
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

                <BurgerUnitList
                  burgerName={burger.name}
                  units={units}
                  expandedBurger={expandedBurger}
                  toppingExtras={toppingExtras}
                  selection={selection}
                />

                </div>
              );
            })}
          </div>
        </div>
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

interface BurgerUnitListProps {
  burgerName: string;
  units: SelectedBurger[];
  expandedBurger: string | null;
  toppingExtras: Extra[];
  selection: BurgerPickerProps["selection"];
}

// Per-row list of unit cards. Removed units linger as inert "ghosts" for the
// exit animation (usePresenceList), whoever triggered the removal -- the
// card's own trash or the row stepper's "-". The group wrapper collapses too
// once every entry is exiting, so its margins animate away with it instead of
// jumping. Spacing lives inside the overflow-hidden children (pt-3 / pb-2) so
// it collapses together with the height.
function BurgerThumbFallback() {
  return (
    <div className="flex h-full w-full items-center justify-center">
      <Beef
        className="size-6 text-[var(--muted-foreground-dim)]"
        strokeWidth={1.25}
        aria-hidden
      />
    </div>
  );
}

function BurgerUnitList({
  burgerName,
  units,
  expandedBurger,
  toppingExtras,
  selection,
}: BurgerUnitListProps) {
  const {
    toggleExpanded,
    updateQuantity,
    removeBurger,
    updateMeatCount,
    updateFriesQuantity,
    toggleVeggie,
    toggleExtra,
    updateExtraQuantity,
  } = selection;
  const entries = usePresenceList(units);
  if (entries.length === 0) return null;
  const allExiting = entries.every((e) => e.exiting);

  return (
    <div
      role="group"
      aria-label={`Personalización de ${burgerName}`}
      aria-hidden={allExiting || undefined}
      inert={allExiting || undefined}
      data-exiting={allExiting}
      className="presence-item min-w-0"
    >
      {/* Padding lives on an inner div: padding on the overflow-hidden grid
          child can't shrink with the 0fr track, leaving a residual strip
          that disappears in one frame when the ghost unmounts (the "step"). */}
      <div className="min-h-0 min-w-0 overflow-hidden">
       <div className="pb-[7px] pt-3">
        {entries.map(({ item, exiting }) => (
          <div
            key={item.id}
            aria-hidden={exiting || undefined}
            inert={exiting || undefined}
            // When the whole group is leaving, only the wrapper animates:
            // a per-card exit on top of it would compound the height and
            // translate (two nested 1fr->0fr collapses) and desync.
            data-exiting={exiting && !allExiting}
            className={cn("presence-item", allExiting && "[animation:none]")}
          >
            <div className="min-h-0 min-w-0 overflow-hidden">
             <div className="pb-2">
              <BurgerUnitCard
                item={item}
                expanded={expandedBurger === item.id}
                toppingExtras={toppingExtras}
                onToggleExpanded={() => toggleExpanded(item.id)}
                onQuantityChange={(delta) => updateQuantity(item.id, delta)}
                onRemove={() => removeBurger(item.id)}
                onMeatChange={(delta) => updateMeatCount(item.id, delta)}
                onFriesChange={(delta) => updateFriesQuantity(item.id, delta)}
                onToggleVeggie={() => toggleVeggie(item.id)}
                onToggleExtra={(extra) => toggleExtra(item.id, extra)}
                onExtraQuantityChange={(extraId, delta) =>
                  updateExtraQuantity(item.id, extraId, delta)
                }
              />
             </div>
            </div>
          </div>
        ))}
       </div>
      </div>
    </div>
  );
}
