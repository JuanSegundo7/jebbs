import type { SelectedBurger, SelectedCombo } from "@/lib/types/combo-types";
import type { SelectedSide } from "@/hooks/use-side-selection";

interface BurgerBaseline {
  meat: number;
  fries: number;
}

// Shared by summarizeBurger (catalog defaults) and summarizeCombo (slot
// defaults) -- a combo-slot burger does NOT share a standalone burger's
// baseline (use-combo-selection.ts seeds meatCount/friesQuantity from the
// slot, not from burger.default_*), so the baseline has to be a parameter
// or every combo burger in a no_fries slot would falsely report "sin
// papas", and every burger literally named "Veggie" would falsely report
// "veggie" (use-combo-selection.ts auto-derives isVeggie from the name).
// Same naming ladder the menu itself uses for meat-count tiers (e.g. "Triple
// Jebbs" already means 3 patties by convention) -- reused here so a
// customized burger reads with the SAME word a customer would recognize from
// the menu, instead of a bare "5 carnes" note buried in the summary line.
// Falls back to "N carnes" past the named ladder (nobody names a burger
// "Séptuple" today, but a future 7-meat customization shouldn't crash).
const MEAT_COUNT_WORDS: Record<number, string> = {
  1: "Simple",
  2: "Doble",
  3: "Triple",
  4: "Cuádruple",
  5: "Quíntuple",
  6: "Séxtuple",
};

export function meatCountLabel(count: number): string {
  return MEAT_COUNT_WORDS[count] ?? `${count} carnes`;
}

function burgerParts(
  item: SelectedBurger,
  baseline: BurgerBaseline,
  options: { includeMeatCount?: boolean } = {},
): string[] {
  const parts: string[] = [];

  if (options.includeMeatCount !== false && item.meatCount !== baseline.meat) {
    parts.push(`${item.meatCount} carne${item.meatCount === 1 ? "" : "s"}`);
  }
  if (item.friesQuantity !== baseline.fries) {
    parts.push(item.friesQuantity === 0 ? "sin papas" : `${item.friesQuantity} papas`);
  }
  if (item.isVeggie) parts.push("veggie");
  for (const e of item.selectedExtras) {
    parts.push(e.quantity > 1 ? `+ ${e.quantity}x ${e.extra.name}` : `+ ${e.extra.name}`);
  }

  return parts;
}

// Standalone burger: baseline is the catalog's own defaults. Returns null
// (not a fallback string) when nothing was changed -- each caller decides
// its own copy for that case (burger-picker.tsx nudges "tocá para
// personalizar"; cart-drawer.tsx says nothing, since its expandable
// CartItemRow already exposes the customize panel).
export function summarizeBurger(
  item: SelectedBurger,
  options: { includeMeatCount?: boolean } = {},
): string | null {
  const baseline: BurgerBaseline = {
    meat: item.burger.default_meat_quantity ?? 2,
    fries: item.burger.default_fries_quantity ?? 1,
  };
  const parts = burgerParts(item, baseline, options);
  return parts.length > 0 ? parts.join(" · ") : null;
}

// True exactly when burgerParts would have pushed the "N carnes" note --
// same condition, exposed so a caller that promotes the meat count into the
// item's NAME (cart-drawer.tsx) knows when to do so, without duplicating
// the baseline-resolution logic here.
export function isMeatCountCustomized(item: SelectedBurger): boolean {
  const baseline = item.burger.default_meat_quantity ?? 2;
  return item.meatCount !== baseline;
}

// Combo burgers auto-derive isVeggie from the name (use-combo-selection.ts),
// so "veggie" is only a customization when it DIFFERS from that derived
// value: a burger literally named "Veggie" reports nothing untouched, while a
// regular burger switched to veggie (or a Veggie one switched off) is shown.
function comboBurgerParts(item: SelectedBurger, slotDefaultMeat?: number): string[] {
  const baseline: BurgerBaseline = {
    meat: slotDefaultMeat ?? item.burger.default_meat_quantity ?? 2,
    fries: item.referenceFriesQuantity ?? item.burger.default_fries_quantity ?? 1,
  };
  const parts = burgerParts(item, baseline).filter((p) => p !== "veggie");
  const derivedVeggie = /veggie/i.test(item.burger.name);
  const isVeggie = item.isVeggie ?? false;
  if (isVeggie !== derivedVeggie) {
    const at = parts.findIndex((p) => p.startsWith("+ "));
    parts.splice(at === -1 ? parts.length : at, 0, isVeggie ? "veggie" : "sin veggie");
  }
  return parts;
}

// Summary of a combo-slot burger against its SLOT baseline (not the
// catalog's). null when untouched.
export function summarizeComboBurger(
  item: SelectedBurger,
  slotDefaultMeat?: number,
): string | null {
  const parts = comboBurgerParts(item, slotDefaultMeat);
  return parts.length > 0 ? parts.join(" · ") : null;
}

// Walks every slot. Burger slots contribute name (+ quantity if >1) plus
// that burger's own summary against the SLOT's baseline, not the
// catalog's. Drink/side slots contribute their extra names directly --
// SelectedComboSlot.selectedExtras is a bare Extra[] (`.name`), a
// different shape than a burger's selectedExtras ({extra, quantity}[]).
// An unconfigured combo (every slot empty) reads as "1x Combo Doble" with
// no hint that it's incomplete -- validateComboRules only runs
// server-side (app/api/orders/route.ts), so this is real, visible-on-screen
// information, not a new validation gate.
export function summarizeCombo(instance: SelectedCombo): string | null {
  const parts: string[] = [];

  for (const slot of instance.slots) {
    if (slot.slotType === "burger") {
      for (const b of slot.burgers) {
        const prefix = b.quantity > 1 ? `${b.quantity}x ` : "";
        const detail = comboBurgerParts(b, slot.defaultMeatCount);
        parts.push(
          detail.length > 0
            ? `${prefix}${b.burger.name} (${detail.join(" · ")})`
            : `${prefix}${b.burger.name}`,
        );
      }
    } else {
      for (const extra of slot.selectedExtras) parts.push(extra.name);
    }
  }

  if (parts.length === 0) return "Sin configurar";
  return parts.join(" · ");
}

// Always null in the normal flow today -- SidePicker never calls
// toggleExtra/updateExtraQuantity -- but SelectedSide.selectedExtras is
// populated by lib/order/rehydrate-selection.ts when a saved cart is
// rehydrated, so this isn't dead code, and it keeps all three summarize*
// functions symmetric for cart-drawer.tsx's single rendering shape.
export function summarizeSide(side: SelectedSide): string | null {
  if (side.selectedExtras.length === 0) return null;
  return side.selectedExtras.map((e) => `+ ${e.extra.name}`).join(" · ");
}
