import { NextResponse, type NextRequest } from "next/server";
import { env } from "@/lib/env";
import { CreateWebOrderSchema } from "@/lib/order/cart-request";
import { getCatalog } from "@/lib/catalog/get-catalog";
import { findUnavailableItemIds } from "@/lib/order/assert-catalog-availability";
import { validateComboRules } from "@/lib/order/validate-combo-rules";
import { rehydrateSelection } from "@/lib/order/rehydrate-selection";
import { computeOrderTotal } from "@/lib/order/compute-order-total";
import { OrderDataTransformer } from "@/lib/order/data-transformer";
import { resolveDeliveryTarget } from "@/lib/order/resolve-delivery-target";
import {
  assertDeliveryAddressInvariant,
  OrderPersistInvariantError,
} from "@/lib/order/assert-delivery-invariant";
import {
  DeliveryZoneUnavailableError,
  resolveDeliveryFee,
} from "@/lib/order/resolve-delivery-fee";
import { createWebOrder } from "@/lib/order/create-web-order";
import { checkRateLimit } from "@/lib/order/rate-limit";
import { formatOrderForWhatsapp } from "@/lib/utils/format-order-whatsapp";

// Order Creation Flow (D7, design.md): nothing is written before this
// handler reaches step 10 below. Every earlier step can reject the request
// without touching the database.
type ErrorCode =
  | "VALIDATION_ERROR"
  | "EMPTY_CART"
  | "PHONE_REQUIRED_FOR_DELIVERY"
  | "ITEM_UNAVAILABLE"
  | "COMBO_RULE_VIOLATION"
  | "ZONE_UNAVAILABLE"
  | "RATE_LIMITED"
  | "ORDER_PERSIST_FAILED";

function errorResponse(
  code: ErrorCode,
  message: string,
  status: number,
  details?: unknown,
) {
  return NextResponse.json({ error: { code, message, details } }, { status });
}

function getClientIp(request: NextRequest): string {
  const forwardedFor = request.headers.get("x-forwarded-for");
  if (forwardedFor) return forwardedFor.split(",")[0]!.trim();
  // No proxy header available (e.g. local dev) -- fall back to a single
  // shared bucket rather than skipping the rate limit outright.
  return "unknown";
}

export async function POST(request: NextRequest) {
  // Step 1 (R18): per-IP rate limit, before any parsing -- a 429 here is
  // cheaper than a wasted zod parse + catalog fetch.
  const ip = getClientIp(request);
  const rateLimit = checkRateLimit(ip);
  if (!rateLimit.allowed) {
    return errorResponse(
      "RATE_LIMITED",
      "Too many orders from this address. Try again later.",
      429,
      { retryAfterMs: rateLimit.retryAfterMs },
    );
  }

  // Step 2: zod .strict() parse -- any unknown key (a posted total, fee,
  // source, status, ...) is a 400, never a silently-ignored field. The
  // EMPTY_CART / PHONE_REQUIRED_FOR_DELIVERY refinements also fire here.
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return errorResponse(
      "VALIDATION_ERROR",
      "Request body must be valid JSON.",
      400,
    );
  }

  const parsed = CreateWebOrderSchema.safeParse(body);
  if (!parsed.success) {
    const refinementIssue = parsed.error.issues.find(
      (issue) =>
        issue.message === "EMPTY_CART" ||
        issue.message === "PHONE_REQUIRED_FOR_DELIVERY",
    );
    if (refinementIssue) {
      return errorResponse(
        refinementIssue.message as "EMPTY_CART" | "PHONE_REQUIRED_FOR_DELIVERY",
        refinementIssue.message,
        400,
      );
    }
    return errorResponse(
      "VALIDATION_ERROR",
      "Invalid request body.",
      400,
      parsed.error.flatten(),
    );
  }
  const req = parsed.data;

  try {
    // Step 3: live catalog + is_available assertion for every posted id.
    const catalog = await getCatalog();
    const unavailableIds = findUnavailableItemIds(req, catalog);
    if (unavailableIds.length > 0) {
      return errorResponse(
        "ITEM_UNAVAILABLE",
        "One or more items are no longer available.",
        409,
        { ids: unavailableIds },
      );
    }

    // Step 4 (DD4): combo slot rules ARE the combo price boundary --
    // recomputing the total alone does not close the "10 burgers in a
    // 2-burger slot" exploit, only this does.
    const comboValidation = validateComboRules(req, catalog);
    if (!comboValidation.ok) {
      return errorResponse(
        "COMBO_RULE_VIOLATION",
        "Combo selection violates slot rules.",
        422,
        { violations: comboValidation.violations },
      );
    }

    // Step 5: rehydrate SelectedBurger/Combo/Side from live catalog rows --
    // never from anything the client posted for pricing.
    const { selectedBurgers, selectedCombos, selectedSides } =
      rehydrateSelection(req, catalog);

    // Step 6: server-stamped delivery fee (DD3) -- never the client's.
    // Pickup keeps the fee at 0 and the zone fields at null/false; delivery
    // resolves the customer's chosen zone against the live catalog (never
    // a flat env var -- prices now vary by zone, see delivery-zones
    // addendum to design.md). An unknown/inactive zone id (catalog changed
    // since the client's page load) is a 409, not a silent fallback.
    let deliveryFee = 0;
    let deliveryZoneId: string | null = null;
    let deliveryZoneName: string | null = null;
    let deliveryFeePending = false;
    if (req.fulfillment.type === "delivery") {
      try {
        const resolved = resolveDeliveryFee(
          catalog.deliveryZones,
          req.fulfillment.zone_id,
        );
        deliveryFee = resolved.deliveryFee;
        deliveryZoneId = resolved.deliveryZoneId;
        deliveryZoneName = resolved.deliveryZoneName;
        deliveryFeePending = resolved.deliveryFeePending;
      } catch (zoneError) {
        if (zoneError instanceof DeliveryZoneUnavailableError) {
          return errorResponse(
            "ZONE_UNAVAILABLE",
            "The selected delivery zone is no longer available.",
            409,
          );
        }
        throw zoneError;
      }
    }

    // Step 7: recompute the total and the order_items payload from the
    // rehydrated selection + the server fee -- ignores any client-posted
    // total_amount/delivery_fee entirely.
    const total = computeOrderTotal(req, catalog, deliveryFee);
    const items = OrderDataTransformer.transformToOrderPayload(
      selectedBurgers,
      selectedCombos,
      catalog.meatExtra,
      catalog.friesExtra,
      selectedSides,
    );

    // Step 8: delivery only -- find-or-create customer + address (DD2/DD5).
    // Pickup keeps both ids null (the PedidosYa precedent).
    let customerId: string | null = null;
    let customerAddressId: string | null = null;
    if (req.fulfillment.type === "delivery") {
      const target = await resolveDeliveryTarget({
        name: req.customer.name,
        phone: req.customer.phone ?? "",
        address: req.fulfillment.address,
        notes: req.fulfillment.notes,
      });
      customerId = target.customerId;
      customerAddressId = target.customerAddressId;
    }

    // Step 9 (R11), hard invariant: abort BEFORE inserting anything if a
    // delivery order doesn't have a real address id (or, symmetrically, if
    // a pickup order somehow carries one). Never write the inconsistent row.
    assertDeliveryAddressInvariant(req.fulfillment.type, customerAddressId);

    // Steps 10-11: insert orders -> order_items -> order_item_extras, then
    // re-query with the nested select (see create-web-order.ts for the R15
    // no-transaction caveat).
    const created = await createWebOrder({
      items,
      total,
      deliveryFee,
      deliveryType: req.fulfillment.type,
      deliveryZoneId,
      deliveryZoneName,
      deliveryFeePending,
      customerName: req.customer.name,
      paymentMethod: req.payment_method,
      notes: req.notes ?? null,
      customerId,
      customerAddressId,
    });

    // Step 12 (DD1): formatOrderForWhatsapp runs server-side only, over the
    // re-queried row -- see design.md's rationale for why this can't move
    // to the browser (timezone control, single source of shop copy, no
    // DB join shape shipped to the client).
    const whatsappText = formatOrderForWhatsapp(created.raw);
    const whatsappUrl = `https://wa.me/${env.NEXT_PUBLIC_WHATSAPP_NUMBER}?text=${encodeURIComponent(whatsappText)}`;

    return NextResponse.json(
      {
        order_id: created.orderId,
        order_number: created.orderNumber,
        total_amount: created.totalAmount,
        delivery_fee: created.deliveryFee,
        whatsapp_text: whatsappText,
        whatsapp_url: whatsappUrl,
      },
      { status: 201 },
    );
  } catch (error) {
    if (error instanceof OrderPersistInvariantError) {
      return errorResponse("ORDER_PERSIST_FAILED", error.message, 500);
    }
    return errorResponse(
      "ORDER_PERSIST_FAILED",
      error instanceof Error ? error.message : "Order could not be persisted.",
      500,
    );
  }
}
