"use client";

interface CustomerNameFieldProps {
  value: string;
  onChange: (value: string) => void;
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
export function CustomerNameField({ value, onChange }: CustomerNameFieldProps) {
  return (
    <div className="diner-field">
      <label htmlFor="checkout-customer-name" className="diner-field-label">
        Nombre
      </label>
      <input
        id="checkout-customer-name"
        required
        autoComplete="name"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder="Tu nombre"
        className="diner-field-input"
      />
    </div>
  );
}
