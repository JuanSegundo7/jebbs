// Minimal, local currency formatter for the order builder's advisory total.
// jebbs-dashboard's lib/utils/format.ts (formatCurrency) is the real,
// byte-identity-critical formatter this repo will port in WU5 (WhatsApp
// handoff, per tasks.md 7.1) -- it is intentionally NOT pulled in early here
// to avoid a half-ported dependency. This helper exists only so the cart UI
// can render readable ARS amounts before that port lands; WU5 should
// consider replacing call sites here with the real formatCurrency once it
// exists, though the two are expected to render identically for whole-peso
// amounts.
export function formatArs(amount: number): string {
  return new Intl.NumberFormat("es-AR", {
    style: "currency",
    currency: "ARS",
    maximumFractionDigits: 0,
  }).format(amount);
}
