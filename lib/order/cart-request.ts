import { z } from "zod";

// Wire contract for POST /api/orders (design.md "Interfaces / Contracts").
// `.strict()` at every level: any unknown key (total_amount, delivery_fee,
// unit_price, source, status, ...) is a 400, never a silently-ignored field.
// No price, total, fee or source ever crosses the wire inbound -- see
// design.md's "Deliberately absent and server-owned" list.

const ExtraRefSchema = z
  .object({
    extra_id: z.string().uuid(),
    quantity: z.number().int().min(1).max(20),
  })
  .strict();

const BurgerLineSchema = z
  .object({
    burger_id: z.string().uuid(),
    quantity: z.number().int().min(1).max(20),
    meat_count: z.number().int().min(1).max(6),
    fries_quantity: z.number().min(0).max(6),
    is_veggie: z.boolean(),
    removed_ingredients: z.array(z.string().max(60)).max(20),
    extras: z.array(ExtraRefSchema).max(20),
  })
  .strict();

const ComboLineSchema = z
  .object({
    combo_id: z.string().uuid(),
    quantity: z.number().int().min(1).max(10),
    slots: z
      .array(
        z
          .object({
            slot_id: z.string().uuid(),
            burgers: z.array(BurgerLineSchema).max(10),
            extra_ids: z.array(z.string().uuid()).max(10),
          })
          .strict(),
      )
      .max(10),
  })
  .strict();

const SideLineSchema = z
  .object({
    extra_id: z.string().uuid(),
    quantity: z.number().int().min(1).max(20),
    extras: z.array(ExtraRefSchema).max(10),
  })
  .strict();

const FulfillmentSchema = z.discriminatedUnion("type", [
  z.object({ type: z.literal("pickup") }).strict(),
  z
    .object({
      type: z.literal("delivery"),
      address: z.string().trim().min(8).max(200),
      notes: z.string().trim().max(200).optional(),
      // Required, not .optional(): a stale/old client that doesn't send
      // this must get a 400, never silently fall through to "pending"
      // (design.md delivery-zones addendum). null === "no encuentro mi
      // zona" -- the server stamps delivery_fee_pending in that case, it
      // is never inferred from a missing key.
      zone_id: z.string().uuid().nullable(),
    })
    .strict(),
]);

export const CreateWebOrderSchema = z
  .object({
    burgers: z.array(BurgerLineSchema).max(30),
    combos: z.array(ComboLineSchema).max(10),
    sides: z.array(SideLineSchema).max(30),
    fulfillment: FulfillmentSchema,
    customer: z
      .object({
        name: z.string().trim().min(2).max(80),
        phone: z.string().trim().max(30).optional(),
      })
      .strict(),
    payment_method: z.enum(["cash", "transfer"]),
    notes: z.string().trim().max(300).optional(),
  })
  .strict()
  .refine(
    (v) => v.burgers.length + v.combos.length + v.sides.length > 0,
    "EMPTY_CART",
  )
  .refine(
    (v) =>
      v.fulfillment.type !== "delivery" ||
      (v.customer.phone ?? "").replace(/\D/g, "").length >= 8,
    "PHONE_REQUIRED_FOR_DELIVERY",
  );

export type CreateWebOrderRequest = z.infer<typeof CreateWebOrderSchema>;
