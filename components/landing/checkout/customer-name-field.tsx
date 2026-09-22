"use client";

import { cn } from "@/lib/utils";

interface CustomerNameFieldProps {
  value: string;
  onChange: (value: string) => void;
  /** True once the confirm button has been tapped while this field was
   * still empty -- see useCheckout's missingFields/validationNonce. Not
   * shown before the first failed attempt, so opening the cart isn't
   * greeted by a red field. */
  invalid?: boolean;
}

// CreateWebOrderSchema requires customer.name for BOTH pickup and delivery
// (lib/order/cart-request.ts) -- unlike phone/address, this isn't
// delivery-specific, so it's rendered unconditionally, above the
// pickup/delivery toggle.
//
// Native <label>/<input> instead of shadcn's Input/Label: those two are
// used ONLY inside checkout in this repo, and they carry iOS/glass
// bleed-through (focus-visible:ios-shadow-md, selection:bg-primary in
// orange, aria-invalid:border-destructive in red) that a `diner-*`
// utility can never override -- Tailwind's `dark:` variant classes on the
// shadcn primitives always win specificity against a plain `@utility`
// class, and this app is hardcoded to dark mode. Native elements sidestep
// the whole class of bugs instead of overriding it piece by piece.
export function CustomerNameField({ value, onChange, invalid = false }: CustomerNameFieldProps) {
  return (
    <div className="diner-field">
      <label
        htmlFor="checkout-customer-name"
        className="mb-1 block font-condensed text-[0.72rem] tracking-[.14em] text-[var(--muted-foreground)] uppercase"
      >
        Nombre
      </label>
      <input
        id="checkout-customer-name"
        required
        autoComplete="name"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder="Tu nombre"
        aria-invalid={invalid}
        aria-describedby={invalid ? "checkout-customer-name-error" : undefined}
        className={cn(
          "w-full rounded-lg border border-[var(--hairline)] bg-[var(--surface-1)] px-[10px] py-[11px] font-body text-[0.95rem] leading-[1.3] text-[var(--foreground)] outline-none placeholder:text-[var(--muted-foreground-dim)] focus-visible:border-[var(--accent-brand)] focus-visible:shadow-[inset_0_0_0_1px_var(--accent-brand)]",
          invalid && "border-[var(--destructive)] shadow-[inset_0_0_0_1px_var(--destructive)]",
        )}
      />
      {invalid && (
        <p
          id="checkout-customer-name-error"
          role="alert"
          className="mt-1 font-body text-[11px] text-[var(--destructive)]"
        >
          Falta tu nombre
        </p>
      )}
    </div>
  );
}
