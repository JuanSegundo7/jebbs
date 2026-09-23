import type { CreateWebOrderRequest } from "@/lib/order/cart-request";
import type { Catalog } from "@/lib/catalog/get-catalog";
import type { ComboSlotWithRules, ComboWithSlots } from "@/lib/types/combo-types";
import type { Extra, ExtraCategory } from "@/lib/types";

export type ComboRuleValidation =
  | { ok: true }
  | { ok: false; violations: string[] };

type ComboLine = CreateWebOrderRequest["combos"][number];
type ComboSlotLine = ComboLine["slots"][number];

// DD4 (design.md): combo slot rules ARE the combo price boundary.
// OrderPriceCalculator.calculateCombosTotal charges slot burgers nothing
// beyond their own extras/meat/fries adjustments -- "Drink/side slots are
// included in the combo price". An unvalidated body posting 10 burgers into
// a 2-burger slot gets 8 free burgers at full price. Recomputing the total
// does NOT close this; only slot-rule enforcement does. This must run
// before pricing and is independent of the is_available/ITEM_UNAVAILABLE
// check (assert-catalog-availability.ts) -- unknown ids here are skipped,
// not reported as combo-rule violations.
const ALLOWED_EXTRA_CATEGORY_FOR_SLOT_TYPE: Partial<
  Record<string, ExtraCategory>
> = {
  drink: "drink",
  side: "sides",
};

function validateSlot(
  comboId: string,
  slotLine: ComboSlotLine,
  slot: ComboSlotWithRules,
  extraMap: Map<string, Extra>,
  burgerDefaultMeatById: Map<string, number>,
  violations: string[],
): void {
  const location = `combo ${comboId} slot ${slot.id}`;
  // Sum of quantities, NOT line count: one line with quantity 10 is 10
  // burgers, and only counting lines let those through for free.
  const burgerCount = slotLine.burgers.reduce((acc, b) => acc + b.quantity, 0);
  const extraCount = slotLine.extra_ids.length;

  if (burgerCount > slot.quantity) {
    violations.push(
      `${location}: burger count ${burgerCount} exceeds max ${slot.quantity}`,
    );
  }
  if (extraCount > slot.quantity) {
    violations.push(
      `${location}: extra_ids count ${extraCount} exceeds max ${slot.quantity}`,
    );
  }
  const fixedBurgerId = slot.rules.fixed_burger_id;
  if (fixedBurgerId) {
    for (const burgerLine of slotLine.burgers) {
      if (burgerLine.burger_id !== fixedBurgerId) {
        violations.push(
          `${location}: burger ${burgerLine.burger_id} is not the slot's fixed_burger_id ${fixedBurgerId}`,
        );
      }
    }
    // A fixed slot always ships full, regardless of `required`/min rules.
    if (burgerCount !== slot.quantity) {
      violations.push(
        `${location}: fixed_burger_id slot requires exactly ${slot.quantity} burger(s), got ${burgerCount}`,
      );
    }
  }
  // A slot is either a burger slot or an extra-picker slot (drink/side) in
  // practice -- never both -- so the min_quantity bound is checked against
  // whichever dimension the customer actually populated.
  if (!fixedBurgerId && burgerCount + extraCount < slot.rules.min_quantity) {
    violations.push(
      `${location}: burger count ${burgerCount} is below min ${slot.rules.min_quantity}`,
    );
  }

  if (slot.rules.allowed_meat_count) {
    for (const burgerLine of slotLine.burgers) {
      const defaultMeatQuantity = burgerDefaultMeatById.get(
        burgerLine.burger_id,
      );
      if (defaultMeatQuantity === undefined) continue; // ITEM_UNAVAILABLE handles this separately
      if (!slot.rules.allowed_meat_count.includes(defaultMeatQuantity)) {
        violations.push(
          `${location}: burger ${burgerLine.burger_id} default meat count ${defaultMeatQuantity} not in allowed_meat_count`,
        );
      }
    }
  }

  if (slot.rules.no_fries) {
    for (const burgerLine of slotLine.burgers) {
      if (burgerLine.fries_quantity !== 0) {
        violations.push(
          `${location}: fries not allowed for this slot (no_fries rule)`,
        );
      }
    }
  }

  const allowedCategory = ALLOWED_EXTRA_CATEGORY_FOR_SLOT_TYPE[slot.slot_type];
  for (const extraId of slotLine.extra_ids) {
    const extra = extraMap.get(extraId);
    if (!extra) continue; // ITEM_UNAVAILABLE handles this separately
    if (!allowedCategory || extra.category !== allowedCategory) {
      violations.push(
        `${location}: extra ${extraId} (category ${extra.category}) not allowed for slot type ${slot.slot_type}`,
      );
    }
  }
}

export function validateComboRules(
  req: CreateWebOrderRequest,
  catalog: Catalog,
): ComboRuleValidation {
  const violations: string[] = [];
  const comboMap = new Map<string, ComboWithSlots>(
    catalog.combos.map((c) => [c.id, c]),
  );
  const extraMap = new Map<string, Extra>(
    catalog.extras.map((e) => [e.id, e]),
  );
  const burgerDefaultMeatById = new Map<string, number>(
    catalog.burgers.map((b) => [b.id, b.default_meat_quantity]),
  );

  for (const comboLine of req.combos) {
    const combo = comboMap.get(comboLine.combo_id);
    if (!combo) continue; // ITEM_UNAVAILABLE handles this separately

    for (const slotLine of comboLine.slots) {
      const slot = combo.slots.find((s) => s.id === slotLine.slot_id);
      if (!slot) continue; // ITEM_UNAVAILABLE handles this separately

      validateSlot(
        comboLine.combo_id,
        slotLine,
        slot,
        extraMap,
        burgerDefaultMeatById,
        violations,
      );
    }
  }

  return violations.length > 0 ? { ok: false, violations } : { ok: true };
}
