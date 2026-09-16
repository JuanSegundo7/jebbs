import { describe, expect, it } from "vitest";
import { buildCreateWebOrderRequest } from "@/lib/order/build-cart-request";
import type { Burger, Extra } from "@/lib/types";
import type {
  ComboWithSlots,
  SelectedBurger,
  SelectedCombo,
} from "@/lib/types/combo-types";
import type { SelectedSide } from "@/hooks/use-side-selection";

function makeBurger(overrides: Partial<Burger> = {}): Burger {
  return {
    id: "burger-1",
    name: "Clásica",
    description: null,
    base_price: 15000,
    ingredients: [],
    is_available: true,
    image_url: null,
    default_meat_quantity: 1,
    default_fries_quantity: 1,
    created_at: "2024-01-01",
    ...overrides,
  };
}

function makeExtra(overrides: Partial<Extra> = {}): Extra {
  return {
    id: "extra-1",
    name: "Cheddar",
    category: "extra",
    price: 300,
    is_available: true,
    created_at: "2024-01-01",
    ...overrides,
  };
}

function emptyCart() {
  return {
    burgers: { selectedBurgers: [] as SelectedBurger[] },
    combos: { selectedCombos: [] as SelectedCombo[] },
    sides: { selectedSides: [] as SelectedSide[] },
  };
}

function pickupCheckout() {
  return {
    fulfillmentType: "pickup" as const,
    phone: "",
    address: "",
    notes: "",
    customerName: "Juan",
    paymentMethod: "cash" as const,
  };
}

describe("buildCreateWebOrderRequest", () => {
  it("maps a standalone burger with an extra", () => {
    const burger: SelectedBurger = {
      id: "sel-1",
      burger: makeBurger(),
      quantity: 2,
      meatCount: 2,
      friesQuantity: 1,
      isVeggie: false,
      removedIngredients: ["Lechuga"],
      selectedExtras: [{ extra: makeExtra(), quantity: 1 }],
      meatPriceAdjustment: 800,
    };

    const cart = { ...emptyCart(), burgers: { selectedBurgers: [burger] } };
    const req = buildCreateWebOrderRequest(cart, pickupCheckout());

    expect(req.burgers).toEqual([
      {
        burger_id: "burger-1",
        quantity: 2,
        meat_count: 2,
        fries_quantity: 1,
        is_veggie: false,
        removed_ingredients: ["Lechuga"],
        extras: [{ extra_id: "extra-1", quantity: 1 }],
      },
    ]);
  });

  it("maps a combo slot's burgers and its selected extras (extra_ids)", () => {
    const combo: SelectedCombo = {
      id: "combo-sel-1",
      combo: {
        id: "combo-1",
        name: "Combo Doble",
        description: null,
        price: 20000,
        is_available: true,
        created_at: "2024-01-01",
        slots: [],
      } as ComboWithSlots,
      quantity: 1,
      slots: [
        {
          slotId: "slot-1",
          slotType: "burger",
          maxQuantity: 1,
          minQuantity: 1,
          rules: { min_quantity: 1, max_quantity: 1 },
          burgers: [
            {
              id: "sel-2",
              burger: makeBurger({ id: "burger-2" }),
              quantity: 1,
              meatCount: 2,
              friesQuantity: 1,
              isVeggie: false,
              removedIngredients: [],
              selectedExtras: [],
              meatPriceAdjustment: 0,
            },
          ],
          selectedExtras: [],
        },
        {
          slotId: "slot-2",
          slotType: "drink",
          maxQuantity: 1,
          minQuantity: 1,
          rules: { min_quantity: 1, max_quantity: 1 },
          burgers: [],
          selectedExtras: [makeExtra({ id: "drink-1", category: "drink" })],
        },
      ],
    };

    const cart = { ...emptyCart(), combos: { selectedCombos: [combo] } };
    const req = buildCreateWebOrderRequest(cart, pickupCheckout());

    expect(req.combos).toEqual([
      {
        combo_id: "combo-1",
        quantity: 1,
        slots: [
          {
            slot_id: "slot-1",
            burgers: [
              {
                burger_id: "burger-2",
                quantity: 1,
                meat_count: 2,
                fries_quantity: 1,
                is_veggie: false,
                removed_ingredients: [],
                extras: [],
              },
            ],
            extra_ids: [],
          },
          {
            slot_id: "slot-2",
            burgers: [],
            extra_ids: ["drink-1"],
          },
        ],
      },
    ]);
  });

  it("maps a side and its own extras", () => {
    const side: SelectedSide = {
      id: "side-1",
      extra: makeExtra({ id: "fries-1", name: "Papas fritas chicas", category: "fries" }),
      quantity: 1,
      selectedExtras: [{ extra: makeExtra({ id: "cheese-1", name: "Cheddar" }), quantity: 2 }],
      expanded: false,
    };

    const cart = { ...emptyCart(), sides: { selectedSides: [side] } };
    const req = buildCreateWebOrderRequest(cart, pickupCheckout());

    expect(req.sides).toEqual([
      {
        extra_id: "fries-1",
        quantity: 1,
        extras: [{ extra_id: "cheese-1", quantity: 2 }],
      },
    ]);
  });

  it("pickup: fulfillment is {type: 'pickup'}, phone omitted when blank", () => {
    const req = buildCreateWebOrderRequest(emptyCart(), pickupCheckout());

    expect(req.fulfillment).toEqual({ type: "pickup" });
    expect(req.customer).toEqual({ name: "Juan", phone: undefined });
    expect(req.payment_method).toBe("cash");
  });

  it("delivery: fulfillment carries trimmed address/notes, phone included", () => {
    const req = buildCreateWebOrderRequest(emptyCart(), {
      fulfillmentType: "delivery",
      phone: "  3454123456  ",
      address: "  San Martín 123  ",
      notes: "  Timbre 2B  ",
      customerName: "  Juan  ",
      paymentMethod: "transfer",
    });

    expect(req.fulfillment).toEqual({
      type: "delivery",
      address: "San Martín 123",
      notes: "Timbre 2B",
    });
    expect(req.customer).toEqual({ name: "Juan", phone: "3454123456" });
    expect(req.payment_method).toBe("transfer");
  });

  it("delivery with blank notes: fulfillment.notes is undefined, not an empty string", () => {
    const req = buildCreateWebOrderRequest(emptyCart(), {
      fulfillmentType: "delivery",
      phone: "3454123456",
      address: "San Martín 123",
      notes: "   ",
      customerName: "Juan",
      paymentMethod: "cash",
    });

    expect(req.fulfillment).toEqual({
      type: "delivery",
      address: "San Martín 123",
      notes: undefined,
    });
  });
});
