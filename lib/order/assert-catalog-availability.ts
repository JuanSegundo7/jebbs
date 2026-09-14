import type { CreateWebOrderRequest } from "@/lib/order/cart-request";
import type { Catalog } from "@/lib/catalog/get-catalog";

// 409 ITEM_UNAVAILABLE detection (design.md order-creation flow, step 2).
// getCatalog() already filters burgers/extras/combos to is_available = true,
// so "id not found in the catalog" and "id exists but is_available = false"
// collapse into the exact same signal here: anything posted that isn't in
// these maps must be rejected. Wiring this into an actual 409 response is
// app/api/orders/route.ts's job (a later work unit) -- this module only
// detects the offending ids.
export function findUnavailableItemIds(
  req: CreateWebOrderRequest,
  catalog: Catalog,
): string[] {
  const burgerIds = new Set(catalog.burgers.map((b) => b.id));
  const extraIds = new Set(catalog.extras.map((e) => e.id));
  const comboMap = new Map(catalog.combos.map((c) => [c.id, c]));

  const unavailable = new Set<string>();

  const checkExtraIds = (ids: string[]) => {
    for (const id of ids) {
      if (!extraIds.has(id)) unavailable.add(id);
    }
  };
  const checkExtraRefs = (refs: { extra_id: string }[]) => {
    checkExtraIds(refs.map((ref) => ref.extra_id));
  };

  for (const burger of req.burgers) {
    if (!burgerIds.has(burger.burger_id)) unavailable.add(burger.burger_id);
    checkExtraRefs(burger.extras);
  }

  for (const combo of req.combos) {
    const catalogCombo = comboMap.get(combo.combo_id);
    if (!catalogCombo) {
      unavailable.add(combo.combo_id);
      continue;
    }

    const slotIds = new Set(catalogCombo.slots.map((s) => s.id));

    for (const slot of combo.slots) {
      if (!slotIds.has(slot.slot_id)) {
        unavailable.add(slot.slot_id);
        continue;
      }
      for (const burger of slot.burgers) {
        if (!burgerIds.has(burger.burger_id)) unavailable.add(burger.burger_id);
        checkExtraRefs(burger.extras);
      }
      checkExtraIds(slot.extra_ids);
    }
  }

  for (const side of req.sides) {
    if (!extraIds.has(side.extra_id)) unavailable.add(side.extra_id);
    checkExtraRefs(side.extras);
  }

  return Array.from(unavailable);
}
