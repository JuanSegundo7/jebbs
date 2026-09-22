import { z } from "zod";

// DELIVERY_FEE_ARS (DD3) was removed once delivery pricing moved to the
// per-zone `delivery_zones` table (see lib/order/resolve-delivery-fee.ts) --
// there is no longer a single flat fee to boot-fail on.
const EnvSchema = z.object({
  // Digits only, no "+", 8-15 characters -- enough range for an Argentina
  // WhatsApp number with country/area code and no separators.
  NEXT_PUBLIC_WHATSAPP_NUMBER: z
    .string({ required_error: "NEXT_PUBLIC_WHATSAPP_NUMBER is required" })
    .regex(
      /^\d{8,15}$/,
      "NEXT_PUBLIC_WHATSAPP_NUMBER must be 8-15 digits, no separators or plus sign",
    ),
});

// R16 (design.md): formatDateTime composes Intl.DateTimeFormat with no
// explicit timeZone, so it renders in the runtime's zone. A server
// defaulting to UTC would print a WhatsApp timestamp 3h off from what the
// dashboard shows for the same order. Pinning TZ here fails the boot loudly
// instead of drifting silently.
const REQUIRED_TZ = "America/Argentina/Buenos_Aires";

function assertTimezone(): void {
  if (process.env.TZ !== REQUIRED_TZ) {
    throw new Error(
      `TZ must be set to "${REQUIRED_TZ}" (found: ${process.env.TZ ?? "unset"}). ` +
        "See design.md R16 -- formatDateTime renders in the runtime's default timezone.",
    );
  }
}

export function loadEnv() {
  assertTimezone();

  const parsed = EnvSchema.safeParse({
    NEXT_PUBLIC_WHATSAPP_NUMBER: process.env.NEXT_PUBLIC_WHATSAPP_NUMBER,
  });

  if (!parsed.success) {
    const issues = parsed.error.issues
      .map((issue) => `${issue.path.join(".")}: ${issue.message}`)
      .join("; ");
    throw new Error(`Invalid environment configuration: ${issues}`);
  }

  return parsed.data;
}

// Throws at module load, on first import, per DD3 -- next build fails and
// the dev server fails on first import while quoting a wrong fee.
export const env = loadEnv();
