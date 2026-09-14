import type { CreateWebOrderRequest } from "@/lib/order/cart-request";
import type { Catalog } from "@/lib/catalog/get-catalog";
import type { Burger, Extra } from "@/lib/types";
import type {
  ComboSlotWithRules,
  ComboWithSlots,
  SelectedBurger,
  SelectedCombo,
  SelectedComboSlot,
} from "@/lib/types/combo-types";
import type { SelectedSide } from "@/hooks/use-side-selection";

// Reproduces the client-side selection construction
// (hooks/use-burger-selection.ts, hooks/use-combo-selection.ts,
// hooks/use-side-selection.ts) from posted ids + the live catalog, so
// OrderPriceCalculator/OrderDataTransformer run over server-trusted rows
// instead of anything the client sent. This function assumes every posted
// id has ALREADY been asserted available (see assert-catalog-availability.ts)
// -- any id that still doesn't resolve here is silently dropped rather than
// thrown, since "reject the request" is the route handler's job, not this
// pure transform's.

type BurgerLine = CreateWebOrderRequest["burgers"][number];
type ComboLine = CreateWebOrderRequest["combos"][number];
type ComboSlotLine = ComboLine["slots"][number];
type SideLine = CreateWebOrderRequest["sides"][number];
type ExtraRef = { extra_id: string; quantity: number };

export interface RehydratedSelection {
  selectedBurgers: SelectedBurger[];
  selectedCombos: SelectedCombo[];
  selectedSides: SelectedSide[];
}

function buildBurgerMap(catalog: Catalog): Map<string, Burger> {
  return new Map(catalog.burgers.map((b) => [b.id, b]));
}

function buildExtraMap(catalog: Catalog): Map<string, Extra> {
  return new Map(catalog.extras.map((e) => [e.id, e]));
}

function buildComboMap(catalog: Catalog): Map<string, ComboWithSlots> {
  return new Map(catalog.combos.map((c) => [c.id, c]));
}

function rehydrateExtraRefs(
  refs: ExtraRef[],
  extraMap: Map<string, Extra>,
): Array<{ extra: Extra; quantity: number }> {
  const result: Array<{ extra: Extra; quantity: number }> = [];
  for (const ref of refs) {
    const extra = extraMap.get(ref.extra_id);
    if (extra) result.push({ extra, quantity: ref.quantity });
  }
  return result;
}

// Standalone burger: mirrors use-burger-selection.ts's addBurger() +
// updateMeatCount(). meatPriceAdjustment = (meat_count - default) * price.
function rehydrateStandaloneBurger(
  line: BurgerLine,
  burgerMap: Map<string, Burger>,
  extraMap: Map<string, Extra>,
  meatExtra: Catalog["meatExtra"],
): SelectedBurger | null {
  const burger = burgerMap.get(line.burger_id);
  if (!burger) return null;

  const referenceMeatCount = burger.default_meat_quantity ?? 2;
  const meatDiff = line.meat_count - referenceMeatCount;

  return {
    id: line.burger_id,
    burger,
    quantity: line.quantity,
    meatCount: line.meat_count,
    friesQuantity: line.fries_quantity,
    isVeggie: line.is_veggie,
    removedIngredients: line.removed_ingredients,
    selectedExtras: rehydrateExtraRefs(line.extras, extraMap),
    meatPriceAdjustment: meatDiff * meatExtra.price,
  };
}

// Combo-slot burger: mirrors use-combo-selection.ts's addBurgerToSlot().
// meatCount/friesQuantity are ALWAYS the slot/burger defaults, never the
// posted meat_count/fries_quantity -- combo-slot meat/fries customization is
// not honored server-side, which is what makes meatPriceAdjustment: 0 safe
// (OrderPriceCalculator derives the meat/fries delta itself from these same
// defaults, so there is never a delta to charge).
function rehydrateComboSlotBurger(
  line: BurgerLine,
  slot: ComboSlotWithRules,
  burgerMap: Map<string, Burger>,
  extraMap: Map<string, Extra>,
): SelectedBurger | null {
  const burger = burgerMap.get(line.burger_id);
  if (!burger) return null;

  const meatCount =
    slot.default_meat_quantity ?? burger.default_meat_quantity ?? 2;
  const friesQuantity = slot.rules.no_fries
    ? 0
    : (burger.default_fries_quantity ?? 1);

  return {
    id: line.burger_id,
    burger,
    quantity: line.quantity,
    meatCount,
    friesQuantity,
    referenceFriesQuantity: friesQuantity,
    isVeggie: line.is_veggie,
    removedIngredients: line.removed_ingredients,
    selectedExtras: rehydrateExtraRefs(line.extras, extraMap),
    meatPriceAdjustment: 0,
  };
}

function rehydrateComboSlot(
  slotLine: ComboSlotLine,
  comboSlots: ComboSlotWithRules[],
  burgerMap: Map<string, Burger>,
  extraMap: Map<string, Extra>,
): SelectedComboSlot | null {
  const slot = comboSlots.find((s) => s.id === slotLine.slot_id);
  if (!slot) return null;

  const burgers: SelectedBurger[] = [];
  for (const burgerLine of slotLine.burgers) {
    const burger = rehydrateComboSlotBurger(
      burgerLine,
      slot,
      burgerMap,
      extraMap,
    );
    if (burger) burgers.push(burger);
  }

  const selectedExtras: Extra[] = [];
  for (const extraId of slotLine.extra_ids) {
    const extra = extraMap.get(extraId);
    if (extra) selectedExtras.push(extra);
  }

  return {
    slotId: slot.id,
    slotType: slot.slot_type as SelectedComboSlot["slotType"],
    defaultMeatCount: slot.default_meat_quantity ?? undefined,
    maxQuantity: slot.quantity,
    minQuantity: slot.rules.min_quantity,
    rules: slot.rules,
    burgers,
    selectedExtras,
  };
}

function rehydrateCombo(
  line: ComboLine,
  comboMap: Map<string, ComboWithSlots>,
  burgerMap: Map<string, Burger>,
  extraMap: Map<string, Extra>,
): SelectedCombo | null {
  const combo = comboMap.get(line.combo_id);
  if (!combo) return null;

  const slots: SelectedComboSlot[] = [];
  for (const slotLine of line.slots) {
    const slot = rehydrateComboSlot(slotLine, combo.slots, burgerMap, extraMap);
    if (slot) slots.push(slot);
  }

  return {
    id: line.combo_id,
    combo,
    quantity: line.quantity,
    slots,
  };
}

function rehydrateSide(
  line: SideLine,
  extraMap: Map<string, Extra>,
): SelectedSide | null {
  const extra = extraMap.get(line.extra_id);
  if (!extra) return null;

  return {
    id: line.extra_id,
    extra,
    quantity: line.quantity,
    selectedExtras: rehydrateExtraRefs(line.extras, extraMap),
    expanded: false,
  };
}

export function rehydrateSelection(
  req: CreateWebOrderRequest,
  catalog: Catalog,
): RehydratedSelection {
  const burgerMap = buildBurgerMap(catalog);
  const extraMap = buildExtraMap(catalog);
  const comboMap = buildComboMap(catalog);

  const selectedBurgers: SelectedBurger[] = [];
  for (const line of req.burgers) {
    const burger = rehydrateStandaloneBurger(
      line,
      burgerMap,
      extraMap,
      catalog.meatExtra,
    );
    if (burger) selectedBurgers.push(burger);
  }

  const selectedCombos: SelectedCombo[] = [];
  for (const line of req.combos) {
    const combo = rehydrateCombo(line, comboMap, burgerMap, extraMap);
    if (combo) selectedCombos.push(combo);
  }

  const selectedSides: SelectedSide[] = [];
  for (const line of req.sides) {
    const side = rehydrateSide(line, extraMap);
    if (side) selectedSides.push(side);
  }

  return { selectedBurgers, selectedCombos, selectedSides };
}
