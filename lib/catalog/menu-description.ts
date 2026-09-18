import type { Burger } from "@/lib/types";
import type { ComboSlotWithRules, ComboWithSlots } from "@/lib/types/combo-types";

// Burger.description is a free-text column that most catalog rows don't
// populate (jebbs-dashboard's write flows don't require it). Ingredients is
// a real, populated column the landing never renders today, so it's the
// natural fallback -- joined with " · " to read like a short ingredient list
// rather than a comma-separated DB dump.
export function burgerDescriptionText(burger: Burger): string | null {
  const description = burger.description?.trim();
  if (description) return description;

  const ingredients = burger.ingredients
    .map((i) => i.trim())
    .filter(Boolean)
    .join(" · ");
  return ingredients.length > 0 ? ingredients : null;
}

// Labels per slot_type, singular/plural. ComboSlot.slot_type is a free string
// in the DB (see combo-types.ts) -- any value not listed here still has to
// produce a description, so callers fall back to the raw slot_type instead
// of dropping the slot.
const SLOT_LABELS: Record<string, { one: string; many: string }> = {
  burger: { one: "hamburguesa a elección", many: "hamburguesas a elección" },
  drink: { one: "bebida", many: "bebidas" },
  side: { one: "acompañamiento", many: "acompañamientos" },
  nuggets: { one: "porción de nuggets", many: "porciones de nuggets" },
};

// The quantity that actually matters is slot.quantity -- validate-combo-rules.ts
// enforces burger/extra counts against it, not against rules.max_quantity
// (which isn't used to validate anything). Describing max_quantity here would
// promise a capacity the validator would then reject.
export function describeComboSlot(slot: ComboSlotWithRules): string | null {
  const count = Number(slot.quantity);
  if (!Number.isFinite(count) || count <= 0) return null;

  const label = SLOT_LABELS[slot.slot_type] ?? { one: slot.slot_type, many: slot.slot_type };
  const min = slot.rules?.min_quantity ?? 0;

  // min >= count is inconsistent config (a minimum that can't be reached
  // within the slot's own quantity) -- fall through to the flat form rather
  // than emit an inverted "entre X y Y" range.
  if (min > 0 && min < count) {
    return `entre ${min} y ${count} ${label.many}`;
  }
  return `${count} ${count === 1 ? label.one : label.many}`;
}

// Preserves combo.slots order as-is -- it's the order the combo was
// authored in, not something to re-sort by slot_type or count.
export function describeComboSlots(combo: ComboWithSlots): string[] {
  return combo.slots
    .map((slot) => describeComboSlot(slot))
    .filter((line): line is string => line !== null);
}

export function summarizeComboSlots(combo: ComboWithSlots): string | null {
  const lines = describeComboSlots(combo);
  if (lines.length === 0) return null;
  return `Incluye: ${lines.join(" · ")}`;
}

// combo.description is almost certainly NULL in production today -- no
// jebbs-dashboard write flow sets it -- so the slot-based summary is the
// realistic path, but an authored description always wins verbatim when
// present (no appending the synthesized text on top of it).
export function comboDescriptionText(combo: ComboWithSlots): string | null {
  const description = combo.description?.trim();
  if (description) return description;
  return summarizeComboSlots(combo);
}
