import { useState } from "react";
import { nanoid } from "nanoid";
import type { Burger, Extra } from "@/lib/types";
import type {
  ComboWithSlots,
  SelectedBurger,
  SelectedCombo,
  SelectedComboSlot,
} from "@/lib/types/combo-types";

// Number() never returns null/undefined, so `Number(x) ?? y` never falls back
// to y. Convert safely and use the fallback when the value isn't a valid number.
const toNumber = (value: unknown, fallback: number) => {
  if (value === null || value === undefined || value === "") return fallback;
  const n = Number(value);
  return Number.isFinite(n) ? n : fallback;
};

// Shared by manual adds and the fixed-burger preload.
const buildSelectedBurger = (
  burger: Burger,
  slot: Pick<SelectedComboSlot, "defaultMeatCount" | "rules">,
  opts: { quantity?: number; locked?: boolean } = {},
): SelectedBurger => {
  const defaultFries = toNumber(burger.default_fries_quantity, 1);
  const fries = slot.rules?.no_fries ? 0 : defaultFries;

  return {
    id: nanoid(),
    burger,
    quantity: opts.quantity ?? 1,
    meatCount:
      slot.defaultMeatCount ?? toNumber(burger.default_meat_quantity, 2),
    removedIngredients: [],
    selectedExtras: [],
    friesQuantity: fries,
    referenceFriesQuantity: fries,
    isVeggie: /veggie/i.test(burger.name),
    meatPriceAdjustment: 0,
    ...(opts.locked ? { locked: true } : {}),
  };
};

// Meat-count filter shared by canAddBurgerToSlot and the pre-select rule so
// both agree on which burgers a slot offers.
const passesMeatFilter = (
  rules: SelectedComboSlot["rules"],
  burger: Burger,
) =>
  !rules.allowed_meat_count ||
  rules.allowed_meat_count.includes(toNumber(burger.default_meat_quantity, 2));

export function useComboSelection() {
  const [selectedCombos, setSelectedCombos] = useState<SelectedCombo[]>([]);
  const [expandedBurgerId, setExpandedBurgerId] = useState<string | null>(null);

  /* ================= COMBOS ================= */

  // `burgers` (the catalog's burgers) resolves fixed-burger slots and the
  // single-candidate pre-select (same list the picker shows as chips).
  const addCombo = (combo: ComboWithSlots, burgers: Burger[] = []) => {
    setSelectedCombos((prev) => [
      ...prev,
      {
        id: nanoid(),
        combo,
        quantity: 1,
        slots: combo.slots.map((slot): SelectedComboSlot => {
          const slotState: SelectedComboSlot = {
            slotId: slot.id,
            slotType: slot.slot_type as "burger" | "drink" | "side",
            maxQuantity: Number(slot.quantity),
            defaultMeatCount: slot.default_meat_quantity
              ? Number(slot.default_meat_quantity)
              : 2,
            minQuantity: slot.rules?.min_quantity ?? Number(slot.quantity),
            rules: slot.rules,
            burgers: [],
            selectedExtras: [],
          };

          const fixedId = slot.rules?.fixed_burger_id;
          if (slotState.slotType === "burger" && fixedId) {
            const fixed = burgers.find((b) => b.id === fixedId);
            // Unresolved -> stays empty; the catalog already hides such combos.
            // One quantity-1 entry PER burger (not one entry with quantity N)
            // so each can be customized separately (one without onion, etc).
            if (fixed) {
              slotState.burgers = Array.from(
                { length: Number(slot.quantity) },
                () => buildSelectedBurger(fixed, slotState, { locked: true }),
              );
            }
          } else if (
            slotState.slotType === "burger" &&
            slot.rules?.min_quantity === 1 &&
            slot.rules?.max_quantity === 1
          ) {
            // Exactly one burger needed and only one qualifies: pre-fill it
            // (NOT locked -- the trash still removes it and the chip returns).
            const candidates = burgers.filter((b) =>
              passesMeatFilter(slot.rules, b),
            );
            if (candidates.length === 1) {
              slotState.burgers = [
                buildSelectedBurger(candidates[0], slotState),
              ];
            }
          }

          return slotState;
        }),
      },
    ]);
  };

  const removeCombo = (comboInstanceId: string) => {
    setSelectedCombos((prev) => prev.filter((c) => c.id !== comboInstanceId));
  };

  // Mirrors updateQuantity in use-burger-selection.ts/use-side-selection.ts
  // -- addCombo seeds quantity at 1 and, before this, nothing could ever
  // change it. Routed through removeCombo at 0 instead of filtering here
  // directly, so combo teardown stays in the one place that knows about it.
  const updateComboQuantity = (comboInstanceId: string, delta: number) => {
    const target = selectedCombos.find((c) => c.id === comboInstanceId);
    if (!target) return;
    if (target.quantity + delta <= 0) {
      removeCombo(comboInstanceId);
      return;
    }
    setSelectedCombos((prev) =>
      prev.map((c) =>
        c.id === comboInstanceId ? { ...c, quantity: c.quantity + delta } : c,
      ),
    );
  };

  /* ================= HELPERS ================= */

  const getSlot = (comboId: string, slotId: string) =>
    selectedCombos
      .find((c) => c.id === comboId)
      ?.slots.find((s) => s.slotId === slotId);

  const getRemainingQuantity = (comboId: string, slotId: string) => {
    const slot = getSlot(comboId, slotId);
    if (!slot) return 0;

    const used = slot.burgers.reduce((acc, b) => acc + b.quantity, 0);
    return slot.maxQuantity - used;
  };

  /* ================= RULES ================= */

  const canAddBurgerToSlot = (
    comboId: string,
    slotId: string,
    burger: Burger,
  ) => {
    const slot = getSlot(comboId, slotId);
    if (!slot) return false;
    if (getRemainingQuantity(comboId, slotId) <= 0) return false;

    if (slot.rules.fixed_burger_id) {
      return burger.id === slot.rules.fixed_burger_id;
    }

    return passesMeatFilter(slot.rules, burger);
  };

  /* ================= BURGERS ================= */

  const addBurgerToSlot = (comboId: string, slotId: string, burger: Burger) => {
    // Don't rely on the UI hiding ineligible burgers.
    if (!canAddBurgerToSlot(comboId, slotId, burger)) return;

    setSelectedCombos((prev) =>
      prev.map((c) =>
        c.id !== comboId
          ? c
          : {
              ...c,
              slots: c.slots.map((s) =>
                s.slotId !== slotId
                  ? s
                  : {
                      ...s,
                      burgers: [...s.burgers, buildSelectedBurger(burger, s)],
                    },
              ),
            },
      ),
    );
  };

  // Combo's fixed burger: cannot be removed or change quantity.
  const isBurgerLocked = (
    comboId: string,
    slotId: string,
    burgerItemId: string,
  ) =>
    getSlot(comboId, slotId)?.burgers.find((b) => b.id === burgerItemId)
      ?.locked === true;

  const removeBurgerFromSlot = (
    comboId: string,
    slotId: string,
    burgerItemId: string,
  ) => {
    if (isBurgerLocked(comboId, slotId, burgerItemId)) return;

    setSelectedCombos((prev) =>
      prev.map((c) =>
        c.id !== comboId
          ? c
          : {
              ...c,
              slots: c.slots.map((s) =>
                s.slotId !== slotId
                  ? s
                  : {
                      ...s,
                      burgers: s.burgers.filter((b) => b.id !== burgerItemId),
                    },
              ),
            },
      ),
    );

    if (expandedBurgerId === burgerItemId) {
      setExpandedBurgerId(null);
    }
  };

  const increaseBurgerQty = (
    comboId: string,
    slotId: string,
    burgerItemId: string,
  ) => {
    if (isBurgerLocked(comboId, slotId, burgerItemId)) return;
    if (getRemainingQuantity(comboId, slotId) <= 0) return;

    setSelectedCombos((prev) =>
      prev.map((c) =>
        c.id !== comboId
          ? c
          : {
              ...c,
              slots: c.slots.map((s) =>
                s.slotId !== slotId
                  ? s
                  : {
                      ...s,
                      burgers: s.burgers.map((b) =>
                        b.id === burgerItemId
                          ? { ...b, quantity: b.quantity + 1 }
                          : b,
                      ),
                    },
              ),
            },
      ),
    );
  };

  const decreaseBurgerQty = (
    comboId: string,
    slotId: string,
    burgerItemId: string,
  ) => {
    if (isBurgerLocked(comboId, slotId, burgerItemId)) return;

    setSelectedCombos((prev) =>
      prev.map((c) =>
        c.id !== comboId
          ? c
          : {
              ...c,
              slots: c.slots.map((s) =>
                s.slotId !== slotId
                  ? s
                  : {
                      ...s,
                      burgers: s.burgers
                        .map((b) =>
                          b.id === burgerItemId
                            ? { ...b, quantity: b.quantity - 1 }
                            : b,
                        )
                        .filter((b) => b.quantity > 0),
                    },
              ),
            },
      ),
    );

    const burger = selectedCombos
      .find((c) => c.id === comboId)
      ?.slots.find((s) => s.slotId === slotId)
      ?.burgers.find((b) => b.id === burgerItemId);

    if (burger && burger.quantity === 1 && expandedBurgerId === burgerItemId) {
      setExpandedBurgerId(null);
    }
  };

  const updateBurgerMeat = (
    comboId: string,
    slotId: string,
    burgerItemId: string,
    meatCount: number,
  ) => {
    setSelectedCombos((prev) =>
      prev.map((c) =>
        c.id !== comboId
          ? c
          : {
              ...c,
              slots: c.slots.map((s) =>
                s.slotId !== slotId
                  ? s
                  : {
                      ...s,
                      burgers: s.burgers.map((b) =>
                        b.id === burgerItemId ? { ...b, meatCount } : b,
                      ),
                    },
              ),
            },
      ),
    );
  };

  /* ================= CUSTOMIZATION ================= */

  const toggleComboBurgerIngredient = (
    comboId: string,
    slotId: string,
    burgerItemId: string,
    ingredient: string,
  ) => {
    setSelectedCombos((prev) =>
      prev.map((c) =>
        c.id !== comboId
          ? c
          : {
              ...c,
              slots: c.slots.map((s) =>
                s.slotId !== slotId
                  ? s
                  : {
                      ...s,
                      burgers: s.burgers.map((b) =>
                        b.id === burgerItemId
                          ? {
                              ...b,
                              removedIngredients: b.removedIngredients.includes(
                                ingredient,
                              )
                                ? b.removedIngredients.filter(
                                    (i) => i !== ingredient,
                                  )
                                : [...b.removedIngredients, ingredient],
                            }
                          : b,
                      ),
                    },
              ),
            },
      ),
    );
  };

  const toggleComboBurgerExtra = (
    comboId: string,
    slotId: string,
    burgerItemId: string,
    extra: Extra,
  ) => {
    setSelectedCombos((prev) =>
      prev.map((c) =>
        c.id !== comboId
          ? c
          : {
              ...c,
              slots: c.slots.map((s) =>
                s.slotId !== slotId
                  ? s
                  : {
                      ...s,
                      burgers: s.burgers.map((b) => {
                        if (b.id !== burgerItemId) return b;

                        const existing = b.selectedExtras.find(
                          (e) => e.extra.id === extra.id,
                        );

                        if (existing) {
                          return {
                            ...b,
                            selectedExtras: b.selectedExtras.filter(
                              (e) => e.extra.id !== extra.id,
                            ),
                          };
                        }

                        return {
                          ...b,
                          selectedExtras: [
                            ...b.selectedExtras,
                            { extra, quantity: 1 },
                          ],
                        };
                      }),
                    },
              ),
            },
      ),
    );
  };

  const updateComboBurgerExtraQty = (
    comboId: string,
    slotId: string,
    burgerItemId: string,
    extraId: string,
    delta: number,
  ) => {
    setSelectedCombos((prev) =>
      prev.map((c) =>
        c.id !== comboId
          ? c
          : {
              ...c,
              slots: c.slots.map((s) =>
                s.slotId !== slotId
                  ? s
                  : {
                      ...s,
                      burgers: s.burgers.map((b) => {
                        if (b.id !== burgerItemId) return b;

                        return {
                          ...b,
                          selectedExtras: b.selectedExtras
                            .map((e) =>
                              e.extra.id === extraId
                                ? { ...e, quantity: e.quantity + delta }
                                : e,
                            )
                            .filter((e) => e.quantity > 0),
                        };
                      }),
                    },
              ),
            },
      ),
    );
  };

  const updateComboBurgerFries = (
    comboId: string,
    slotId: string,
    burgerItemId: string,
    delta: number,
  ) => {
    setSelectedCombos((prev) =>
      prev.map((c) =>
        c.id !== comboId
          ? c
          : {
              ...c,
              slots: c.slots.map((s) =>
                s.slotId !== slotId
                  ? s
                  : {
                      ...s,
                      burgers: s.burgers.map((b) =>
                        b.id === burgerItemId
                          ? {
                              ...b,
                              friesQuantity: Math.max(
                                0,
                                b.friesQuantity + delta,
                              ),
                            }
                          : b,
                      ),
                    },
              ),
            },
      ),
    );
  };

  const toggleComboBurgerVeggie = (
    comboId: string,
    slotId: string,
    burgerItemId: string,
  ) => {
    setSelectedCombos((prev) =>
      prev.map((c) =>
        c.id !== comboId
          ? c
          : {
              ...c,
              slots: c.slots.map((s) =>
                s.slotId !== slotId
                  ? s
                  : {
                      ...s,
                      burgers: s.burgers.map((b) =>
                        b.id === burgerItemId
                          ? { ...b, isVeggie: !b.isVeggie }
                          : b,
                      ),
                    },
              ),
            },
      ),
    );
  };

  /* ================= EXTRAS FOR SLOTS ================= */

  const removeOneExtraFromSlot = (
    comboId: string,
    slotId: string,
    extra: Extra,
  ) => {
    setSelectedCombos((prev) =>
      prev.map((c) =>
        c.id !== comboId
          ? c
          : {
              ...c,
              slots: c.slots.map((s) => {
                if (s.slotId !== slotId) return s;
                const idx = s.selectedExtras.findIndex(
                  (e) => e.id === extra.id,
                );
                if (idx === -1) return s;
                return {
                  ...s,
                  selectedExtras: s.selectedExtras.filter((_, i) => i !== idx),
                };
              }),
            },
      ),
    );
  };

  const selectExtraForSlot = (
    comboId: string,
    slotId: string,
    extra: Extra,
  ) => {
    setSelectedCombos((prev) =>
      prev.map((c) =>
        c.id !== comboId
          ? c
          : {
              ...c,
              slots: c.slots.map((s) => {
                if (s.slotId !== slotId) return s;

                const totalSelected = s.selectedExtras.length;
                const itemCount = s.selectedExtras.filter(
                  (e) => e.id === extra.id,
                ).length;

                if (s.maxQuantity === 1) {
                  // Single-select: same item -> deselect, different -> replace
                  return {
                    ...s,
                    selectedExtras: itemCount > 0 ? [] : [extra],
                  };
                }

                // Multi-select: card click always adds if there's room
                if (totalSelected < s.maxQuantity) {
                  return {
                    ...s,
                    selectedExtras: [...s.selectedExtras, extra],
                  };
                }

                return s;
              }),
            },
      ),
    );
  };

  /* ================= UI STATE ================= */

  const toggleBurgerExpanded = (burgerItemId: string) => {
    setExpandedBurgerId(
      expandedBurgerId === burgerItemId ? null : burgerItemId,
    );
  };

  const resetState = () => {
    setSelectedCombos([]);
    setExpandedBurgerId(null);
  };

  const loadCombos = (combos: SelectedCombo[]) => {
    setSelectedCombos(combos);
  };

  return {
    // State
    selectedCombos,
    expandedBurgerId,

    // Combos
    addCombo,
    removeCombo,
    updateComboQuantity,

    // Helpers
    getRemainingQuantity,
    canAddBurgerToSlot,

    // Burgers
    addBurgerToSlot,
    removeBurgerFromSlot,
    increaseBurgerQty,
    decreaseBurgerQty,
    updateBurgerMeat,

    // Customization
    toggleComboBurgerIngredient,
    toggleComboBurgerExtra,
    updateComboBurgerExtraQty,
    updateComboBurgerFries,
    toggleComboBurgerVeggie,

    // Extras for slots
    selectExtraForSlot,
    removeOneExtraFromSlot,

    // Helpers
    loadCombos,

    // UI
    toggleBurgerExpanded,
    resetState,
  };
}
