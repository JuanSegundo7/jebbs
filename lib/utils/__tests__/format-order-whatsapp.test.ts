import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { formatCurrency, formatDateTime } from "@/lib/utils/format";
import {
  formatOrderForWhatsapp,
  type OrderForWhatsapp,
} from "@/lib/utils/format-order-whatsapp";

// R16 (design.md): this is a golden-file test asserting byte-identical
// output against jebbs-dashboard's lib/utils/formatOrderWhatsapp.ts for the
// same inputs. formatDateTime has no explicit timeZone, so it renders in
// the runtime's default zone -- vitest.setup.ts already pins process.env.TZ
// globally, this test just confirms that pin is actually in effect and
// freezes the clock so a future refactor that accidentally reads Date.now()
// cannot make this test flaky.
const CREATED_AT = "2026-01-15T15:05:00.000Z";
const CUSTOMER_NAME = "Marcos Pérez";

function baseOrder(overrides: Partial<OrderForWhatsapp> = {}): OrderForWhatsapp {
  return {
    order_number: 500,
    created_at: CREATED_AT,
    customer_name: CUSTOMER_NAME,
    customer: null,
    customer_address_id: null,
    delivery_type: "pickup",
    delivery_time: null,
    delivery_fee: 0,
    payment_method: "cash",
    discount_type: "none",
    discount_value: 0,
    discount_amount: 0,
    price_adjustment: 0,
    total_amount: 0,
    notes: null,
    order_items: [],
    ...overrides,
  };
}

describe("formatOrderForWhatsapp", () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date(CREATED_AT));
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("runs under the Argentina timezone pinned by vitest.setup.ts", () => {
    expect(process.env.TZ).toBe("America/Argentina/Buenos_Aires");
  });

  it("pickup order: no 📍 line, header/footer verbatim", () => {
    const order = baseOrder({
      order_number: 501,
      total_amount: 15000,
      order_items: [
        {
          burger_name: "Clásica",
          quantity: 1,
          subtotal: 15000,
          customizations: null,
          extra_id: null,
          order_item_extras: null,
        },
      ],
    });

    const expected = `*JEBBS BURGERS*
🧾 *PEDIDO #501* · ${formatDateTime(CREATED_AT)}

👤 *Marcos Pérez* · 💵 Efectivo
🏪 *Retiro en local*

📦 *Detalle*
• 1x Clásica — ${formatCurrency(15000)}

💰 Subtotal ${formatCurrency(15000)}
*TOTAL: ${formatCurrency(15000)}*
━━━━━━━━━━━━━━━
Gracias por tu compra 🙌

*⚠️ POR FAVOR VERIFICAR QUE ESTÉ TODO CORRECTO EN LA ORDEN ⚠️*`;

    expect(formatOrderForWhatsapp(order)).toBe(expected);
    expect(formatOrderForWhatsapp(order)).not.toContain("📍");
  });

  it("delivery order: 📍 address + notes line, delivery fee in the totals", () => {
    const order = baseOrder({
      order_number: 502,
      payment_method: "transfer",
      delivery_type: "delivery",
      delivery_fee: 1500,
      total_amount: 16500,
      customer: {
        // Present on the real join row shape, but formatOrderForWhatsapp
        // never reads customer.phone directly (that's formatOrderDelivery's
        // job in jebbs-dashboard, out of scope for this port) -- included
        // here only to keep the fixture shape realistic.
        phone: "3454123456",
        customer_addresses: [
          { id: "addr-1", address: "San Martín 123", notes: "Timbre 2B" },
        ],
      },
      customer_address_id: "addr-1",
      order_items: [
        {
          burger_name: "Clásica",
          quantity: 1,
          subtotal: 15000,
          customizations: null,
          extra_id: null,
          order_item_extras: null,
        },
      ],
    });

    const expected = `*JEBBS BURGERS*
🧾 *PEDIDO #502* · ${formatDateTime(CREATED_AT)}

👤 *Marcos Pérez* · 🏦 Transferencia
🚚 *Envío a domicilio*
📍 San Martín 123
   Timbre 2B

📦 *Detalle*
• 1x Clásica — ${formatCurrency(15000)}

💰 Subtotal ${formatCurrency(15000)} · Envío ${formatCurrency(1500)}
*TOTAL: ${formatCurrency(16500)}*
━━━━━━━━━━━━━━━
Gracias por tu compra 🙌

*⚠️ POR FAVOR VERIFICAR QUE ESTÉ TODO CORRECTO EN LA ORDEN ⚠️*`;

    expect(formatOrderForWhatsapp(order)).toBe(expected);
  });

  it("combo with slots: burger + fries line inside the slot, drink slot extra", () => {
    const customizations = JSON.stringify([
      {
        slotId: "slot-1",
        slotType: "burger",
        burgers: [
          {
            burgerId: "b1",
            name: "Doble Cheddar",
            meatCount: 2,
            isVeggie: false,
            friesQuantity: 1,
            friesAdjustment: 0,
            quantity: 1,
            removedIngredients: [],
            extras: [],
          },
        ],
        selectedExtras: [],
      },
      {
        slotId: "slot-2",
        slotType: "drink",
        burgers: [],
        selectedExtras: [{ id: "e1", name: "Coca-Cola", price: 0 }],
      },
    ]);

    const order = baseOrder({
      order_number: 503,
      total_amount: 20000,
      order_items: [
        {
          burger_name: "Combo Doble",
          quantity: 1,
          subtotal: 20000,
          customizations,
          extra_id: null,
          order_item_extras: null,
        },
      ],
    });

    const expected = `*JEBBS BURGERS*
🧾 *PEDIDO #503* · ${formatDateTime(CREATED_AT)}

👤 *Marcos Pérez* · 💵 Efectivo
🏪 *Retiro en local*

📦 *Detalle*
• 1x Combo Doble — ${formatCurrency(20000)}
   🍔 1x Doble Cheddar x2
      🍟 1 papas
   🥤 Coca-Cola

💰 Subtotal ${formatCurrency(20000)}
*TOTAL: ${formatCurrency(20000)}*
━━━━━━━━━━━━━━━
Gracias por tu compra 🙌

*⚠️ POR FAVOR VERIFICAR QUE ESTÉ TODO CORRECTO EN LA ORDEN ⚠️*`;

    expect(formatOrderForWhatsapp(order)).toBe(expected);
  });

  it("side line via extra_id: 🍟 prefix, no bullet", () => {
    const order = baseOrder({
      order_number: 504,
      total_amount: 3000,
      order_items: [
        {
          burger_name: "Papas Fritas",
          quantity: 2,
          subtotal: 3000,
          customizations: null,
          extra_id: "extra-fries-id",
          order_item_extras: null,
        },
      ],
    });

    const expected = `*JEBBS BURGERS*
🧾 *PEDIDO #504* · ${formatDateTime(CREATED_AT)}

👤 *Marcos Pérez* · 💵 Efectivo
🏪 *Retiro en local*

📦 *Detalle*
🍟 2x Papas Fritas — ${formatCurrency(3000)}

💰 Subtotal ${formatCurrency(3000)}
*TOTAL: ${formatCurrency(3000)}*
━━━━━━━━━━━━━━━
Gracias por tu compra 🙌

*⚠️ POR FAVOR VERIFICAR QUE ESTÉ TODO CORRECTO EN LA ORDEN ⚠️*`;

    expect(formatOrderForWhatsapp(order)).toBe(expected);
  });

  it("item with order_item_extras: extras total folded into the item's *Subtotal* line, not printed as separate lines (verbatim quirk of the original)", () => {
    const order = baseOrder({
      order_number: 505,
      total_amount: 16500,
      order_items: [
        {
          burger_name: "Clásica",
          quantity: 1,
          subtotal: 15000,
          customizations: null,
          extra_id: null,
          order_item_extras: [
            { extra_name: "Cheddar", quantity: 1, subtotal: 300 },
            { extra_name: "Panceta", quantity: 2, subtotal: 1200 },
          ],
        },
      ],
    });

    const expected = `*JEBBS BURGERS*
🧾 *PEDIDO #505* · ${formatDateTime(CREATED_AT)}

👤 *Marcos Pérez* · 💵 Efectivo
🏪 *Retiro en local*

📦 *Detalle*
• 1x Clásica — ${formatCurrency(15000)}
   *Subtotal: ${formatCurrency(16500)}*

💰 Subtotal ${formatCurrency(16500)}
*TOTAL: ${formatCurrency(16500)}*
━━━━━━━━━━━━━━━
Gracias por tu compra 🙌

*⚠️ POR FAVOR VERIFICAR QUE ESTÉ TODO CORRECTO EN LA ORDEN ⚠️*`;

    expect(formatOrderForWhatsapp(order)).toBe(expected);
    // The Cheddar/Panceta names themselves never appear -- only their sum
    // folds into the *Subtotal* line. Real web orders would duplicate this
    // via the customizations.extras JSON instead; this fixture isolates the
    // order_item_extras-only path on purpose.
    expect(formatOrderForWhatsapp(order)).not.toContain("Cheddar");
  });

  it("dead 'Ajuste PedidosYa' branch: transcribed verbatim even though web orders always carry price_adjustment = 0", () => {
    const order = baseOrder({
      order_number: 506,
      total_amount: 15500,
      price_adjustment: 500,
      order_items: [
        {
          burger_name: "Clásica",
          quantity: 1,
          subtotal: 15000,
          customizations: null,
          extra_id: null,
          order_item_extras: null,
        },
      ],
    });

    const result = formatOrderForWhatsapp(order);
    expect(result).toContain(`Ajuste PedidosYa +${formatCurrency(500)}`);
  });
});
