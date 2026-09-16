import { formatCurrency, formatDateTime } from "@/lib/utils/format";

// OrderForWhatsapp (D4, design.md): exactly the fields formatOrderForWhatsapp
// reads, named as the Supabase join aliases actually return them
// (jebbs-dashboard's use-orders.ts:19-50) rather than the items/extras lie
// in jebbs-dashboard's own OrderWithItems type (lib/types/index.ts:126-130).
export interface AddressForWhatsapp {
  id: string;
  address: string | null;
  notes: string | null;
}

export interface OrderItemExtraForWhatsapp {
  extra_name: string;
  quantity: number;
  subtotal: number;
}

export interface OrderItemForWhatsapp {
  burger_name: string;
  quantity: number;
  subtotal: number;
  customizations: string | null;
  extra_id: string | null; // non-null => side line ("🍟")
  order_item_extras: OrderItemExtraForWhatsapp[] | null;
}

export interface OrderForWhatsapp {
  order_number: number;
  created_at: string;
  customer_name: string;
  customer: {
    phone: string | null;
    customer_addresses: AddressForWhatsapp[] | null;
  } | null;
  customer_address_id: string | null;
  delivery_type: "pickup" | "delivery";
  delivery_time: string | null;
  delivery_fee: number;
  payment_method: "cash" | "transfer";
  discount_type: "amount" | "percentage" | "none" | null;
  discount_value: number;
  discount_amount: number;
  price_adjustment: number;
  total_amount: number;
  notes: string | null;
  order_items: OrderItemForWhatsapp[] | null;
}

// Adapted verbatim from jebbs-dashboard's lib/utils/formatOrderWhatsapp.ts
// (design.md D4 "Byte-identity guarantees"). The only differences from the
// dashboard's version are: (1) the `console.log(order)` at the top is
// removed -- it wrote to stderr, never to the return value; (2) the
// signature and the two nested interfaces above are typed against
// OrderForWhatsapp instead of the dashboard's own (lying) OrderWithItems
// type -- types are erased at runtime, so this changes nothing observable.
// The template literal, every emoji, every separator, the `.trim()`, and
// the dead "Ajuste PedidosYa" branch (web orders always carry
// price_adjustment = 0, so it never actually fires) are transcribed
// character-for-character. The `customizations` parse keeps its `any`
// locals deliberately -- narrowing that JSON blob is a behaviour risk with
// zero output benefit.
export function formatOrderForWhatsapp(order: OrderForWhatsapp): string {
  const isDelivery = order.delivery_type === "delivery";

  const address = order.customer?.customer_addresses?.find(
    (a) => a.id === order.customer_address_id,
  );

  const orderItems = order.order_items ?? [];

  // ===== HEADER =====
  const paymentIcon = order.payment_method === "cash" ? "💵 Efectivo" : "🏦 Transferencia";
  const deliveryIcon = isDelivery ? "🚚" : "🏪";
  const deliveryLabel = isDelivery ? "Envío a domicilio" : "Retiro en local";

  // ===== ENTREGA =====
  const deliveryLines: string[] = [];
  deliveryLines.push(`${deliveryIcon} *${deliveryLabel}*`);
  if (isDelivery && address?.address) {
    deliveryLines.push(`📍 ${address.address}`);
    if (address.notes) deliveryLines.push(`   ${address.notes}`);
  }
  if (order.delivery_time) {
    deliveryLines.push(`🕐 ${isDelivery ? "Entregar" : "Retirar"} a las: *${order.delivery_time}*`);
  }

  // ===== ITEMS =====
  const itemsBlock = orderItems.map((item) => {
    const extrasTotal =
      item.order_item_extras?.reduce((sum, extra) => sum + extra.subtotal, 0) ?? 0;
    const itemTotal = item.subtotal + extrasTotal;

    // SIDE
    if (item.extra_id) {
      const extrasLines = item.order_item_extras?.length
        ? "\n" + item.order_item_extras
            .map((e) => `   + ${e.quantity}x ${e.extra_name}${e.subtotal > 0 ? ` $${formatCurrency(e.subtotal)}` : ""}`)
            .join("\n")
        : "";
      return `🍟 ${item.quantity}x ${item.burger_name} — ${formatCurrency(item.subtotal)}${extrasLines}${extrasTotal > 0 ? `\n   *Subtotal: ${formatCurrency(itemTotal)}*` : ""}`;
    }

    // BURGER o COMBO
    let customData: any = null;
    let isCombo = false;
    if (item.customizations) {
      try {
        customData = JSON.parse(item.customizations);
        isCombo = Array.isArray(customData);
      } catch {}
    }

    const detailParts: string[] = [];

    if (!isCombo && customData) {
      // Papas
      if (customData.friesQuantity !== undefined) {
        if (customData.friesQuantity === 0) {
          const discount = Math.abs(customData.friesAdjustment ?? 0);
          detailParts.push(discount > 0 ? `🍟 Sin papas (-${formatCurrency(discount)})` : `🍟 Sin papas`);
        } else if ((customData.friesAdjustment ?? 0) > 0) {
          detailParts.push(`🍟 ${customData.friesQuantity} papas (+${formatCurrency(customData.friesAdjustment)})`);
        } else {
          detailParts.push(`🍟 ${customData.friesQuantity} papas`);
        }
      }

      // Ingredientes removidos
      if (customData.removedIngredients?.length > 0) {
        detailParts.push(`❌ Sin: ${customData.removedIngredients.join(", ")}`);
      }

      // Extras (solo customData, no duplicar con order_item_extras)
      if (customData.extras?.length > 0) {
        customData.extras.forEach((extra: any) => {
          detailParts.push(`+ ${extra.quantity}x ${extra.name} — ${formatCurrency(extra.price * extra.quantity)}`);
        });
      }
    }

    // Combos
    const comboLines: string[] = [];
    if (isCombo && Array.isArray(customData)) {
      customData.forEach((slot: any) => {
        if (slot.burgers?.length > 0) {
          slot.burgers.forEach((burger: any) => {
            comboLines.push(`   🍔 ${burger.quantity}x ${burger.name} x${burger.meatCount}`);

            const burgerParts: string[] = [];
            if (burger.isVeggie) {
              burgerParts.push(`🌱 Veggie`);
            }
            if (burger.friesQuantity !== undefined) {
              if (burger.friesQuantity === 0) {
                const discount = Math.abs(burger.friesAdjustment ?? 0);
                burgerParts.push(discount > 0 ? `🍟 Sin papas (-${formatCurrency(discount)})` : `🍟 Sin papas`);
              } else if ((burger.friesAdjustment ?? 0) > 0) {
                burgerParts.push(`🍟 ${burger.friesQuantity} papas (+${formatCurrency(burger.friesAdjustment)})`);
              } else {
                burgerParts.push(`🍟 ${burger.friesQuantity} papas`);
              }
            }
            if (burger.removedIngredients?.length > 0) {
              burgerParts.push(`❌ Sin: ${burger.removedIngredients.join(", ")}`);
            }
            if (burger.extras?.length > 0) {
              burger.extras.forEach((extra: any) => {
                burgerParts.push(`+ ${extra.quantity}x ${extra.name} — ${formatCurrency(extra.price * extra.quantity)}`);
              });
            }
            if (burgerParts.length > 0) {
              comboLines.push(`      ${burgerParts.join(" · ")}`);
            }
          });
        }
        const extras = Array.isArray(slot.selectedExtras)
          ? slot.selectedExtras
          : slot.selectedExtra
            ? [slot.selectedExtra]
            : [];
        extras.forEach((se: any) => {
          const label = slot.slotType === "drink" ? "🥤" : slot.slotType === "side" ? "🍗" : "➕";
          comboLines.push(`   ${label} ${se.name}`);
        });
      });
    }

    if (!isCombo && customData?.isVeggie) {
      detailParts.unshift(`🌱 Veggie`);
    }

    const meatSuffix = !isCombo && customData?.meatCount ? ` x${customData.meatCount}` : "";
    const detailLine = detailParts.length > 0 ? `\n   ${detailParts.join(" · ")}` : "";
    const comboBlock = comboLines.length > 0 ? "\n" + comboLines.join("\n") : "";
    const subtotalLine = extrasTotal > 0 ? `\n   *Subtotal: ${formatCurrency(itemTotal)}*` : "";

    return `• ${item.quantity}x ${item.burger_name}${meatSuffix} — ${formatCurrency(item.subtotal)}${detailLine}${comboBlock}${subtotalLine}`;
  }).join("\n\n");

  // ===== TOTALES =====
  const totalParts: string[] = [];
  totalParts.push(`Subtotal ${formatCurrency(itemsBlock ? orderItems.reduce((sum, item) => {
    const extrasTotal = item.order_item_extras?.reduce((s, e) => s + e.subtotal, 0) ?? 0;
    return sum + item.subtotal + extrasTotal;
  }, 0) : 0)}`);
  if (order.delivery_fee > 0) totalParts.push(`Envío ${formatCurrency(order.delivery_fee)}`);
  if (order.discount_amount > 0) {
    const label = order.discount_type === "percentage" ? `Desc. ${order.discount_value}%` : "Desc.";
    totalParts.push(`${label} -${formatCurrency(order.discount_amount)}`);
  }
  if (order.price_adjustment > 0) {
    totalParts.push(`Ajuste PedidosYa +${formatCurrency(order.price_adjustment)}`);
  }

  return `*JEBBS BURGERS*
🧾 *PEDIDO #${order.order_number}* · ${formatDateTime(order.created_at)}

👤 *${order.customer_name}* · ${paymentIcon}
${deliveryLines.join("\n")}

📦 *Detalle*
${itemsBlock}

💰 ${totalParts.join(" · ")}
*TOTAL: ${formatCurrency(order.total_amount)}*
━━━━━━━━━━━━━━━${order.notes ? `\n📝 ${order.notes}` : ""}
Gracias por tu compra 🙌

*⚠️ POR FAVOR VERIFICAR QUE ESTÉ TODO CORRECTO EN LA ORDEN ⚠️*`.trim();
}
