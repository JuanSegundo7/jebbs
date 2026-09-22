import "server-only";
import { createAdminClient } from "@/lib/supabase/admin";
import type { OrderItemInput } from "@/lib/order/data-transformer";
import type { OrderForWhatsapp } from "@/lib/utils/format-order-whatsapp";

export interface CreateWebOrderArgs {
  items: OrderItemInput[];
  total: number;
  deliveryFee: number;
  deliveryType: "pickup" | "delivery";
  deliveryZoneId: string | null;
  deliveryZoneName: string | null;
  deliveryFeePending: boolean;
  customerName: string;
  paymentMethod: "cash" | "transfer";
  notes: string | null;
  customerId: string | null;
  customerAddressId: string | null;
}

// `raw` is the re-queried row (NESTED_ORDER_SELECT below), typed as
// OrderForWhatsapp (design.md D4) -- the route handler feeds it straight
// into formatOrderForWhatsapp() to build the `whatsapp_text`/`whatsapp_url`
// response fields (WU5, tasks.md 7.4).
export interface CreatedWebOrder {
  orderId: string;
  orderNumber: number;
  totalAmount: number;
  deliveryFee: number;
  raw: OrderForWhatsapp;
}

const NESTED_ORDER_SELECT = `
  *,
  customer:customers (
    id,
    name,
    phone,
    customer_addresses (
      id,
      label,
      address,
      notes,
      is_default
    )
  ),
  order_items (
    id,
    burger_name,
    quantity,
    unit_price,
    subtotal,
    customizations,
    extra_id,
    order_item_extras (
      id,
      extra_name,
      quantity,
      unit_price,
      subtotal
    )
  )
`;

// R15 (design.md), documented limitation: Supabase-js has no multi
// -statement transaction, so this insert sequence (orders -> order_items ->
// order_item_extras) is NOT atomic -- the exact same exposure
// jebbs-dashboard's use-create-order.ts already has today (it loops
// per-item inserts too). A failure partway through leaves a persisted
// `orders` row with missing items/extras; that artifact is visible on the
// board as a cancellable `new` order -- the same class of residual risk R12
// already accepts elsewhere in this codebase. The correct v2 fix is a single
// `create_web_order` plpgsql RPC, which is a migration this change
// deliberately avoids (D1).
export async function createWebOrder(
  args: CreateWebOrderArgs,
): Promise<CreatedWebOrder> {
  const supabase = createAdminClient();

  const { data: order, error: orderError } = await supabase
    .from("orders")
    .insert({
      customer_id: args.customerId,
      customer_name: args.customerName,
      customer_address_id: args.customerAddressId,
      delivery_type: args.deliveryType,
      delivery_fee: args.deliveryFee,
      delivery_zone_id: args.deliveryZoneId,
      delivery_zone_name: args.deliveryZoneName,
      delivery_fee_pending: args.deliveryFeePending,
      payment_method: args.paymentMethod,
      source: "web",
      commission_amount: 0,
      commission_rate: null,
      discount_type: "none",
      discount_value: 0,
      discount_amount: 0,
      price_adjustment: 0,
      total_amount: args.total,
      notes: args.notes,
      delivery_time: null,
      status: "new",
    })
    .select()
    .single();

  if (orderError || !order) {
    throw new Error(
      `ORDER_PERSIST_FAILED: orders insert failed -- ${orderError?.message ?? "no row returned"}`,
    );
  }

  for (const item of args.items) {
    const { data: orderItem, error: itemError } = await supabase
      .from("order_items")
      .insert({
        order_id: order.id,
        burger_id: item.burger_id,
        combo_id: item.combo_id ?? null,
        extra_id: item.extra_id ?? null,
        burger_name: item.burger_name,
        quantity: item.quantity,
        unit_price: item.unit_price,
        subtotal: item.subtotal,
        customizations: item.customizations ?? null,
      })
      .select()
      .single();

    if (itemError || !orderItem) {
      throw new Error(
        `ORDER_PERSIST_FAILED: order_items insert failed -- ${itemError?.message ?? "no row returned"}`,
      );
    }

    if (item.extras.length) {
      const { error: extrasError } = await supabase.from("order_item_extras").insert(
        item.extras.map((ext) => ({
          order_item_id: orderItem.id,
          extra_id: ext.extra_id,
          extra_name: ext.extra_name,
          quantity: ext.quantity,
          unit_price: ext.unit_price,
          subtotal: ext.subtotal,
        })),
      );

      if (extrasError) {
        throw new Error(`ORDER_PERSIST_FAILED: order_item_extras insert failed -- ${extrasError.message}`);
      }
    }
  }

  const { data: reQueried, error: reQueryError } = await supabase
    .from("orders")
    .select(NESTED_ORDER_SELECT)
    .eq("id", order.id)
    .single();

  if (reQueryError || !reQueried) {
    throw new Error(
      `ORDER_PERSIST_FAILED: re-query failed -- ${reQueryError?.message ?? "no row returned"}`,
    );
  }

  const row = reQueried as unknown as OrderForWhatsapp & {
    id: string;
    order_number: number;
    total_amount: number;
    delivery_fee: number;
  };

  return {
    orderId: row.id,
    orderNumber: row.order_number,
    totalAmount: row.total_amount,
    deliveryFee: row.delivery_fee,
    raw: row,
  };
}
