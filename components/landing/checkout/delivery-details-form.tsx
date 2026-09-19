"use client";

interface DeliveryDetailsFormProps {
  phone: string;
  onPhoneChange: (value: string) => void;
  address: string;
  onAddressChange: (value: string) => void;
  notes: string;
  onNotesChange: (value: string) => void;
}

// Conditional form rendered only while fulfillmentType === "delivery"
// (WU3b, tasks.md 5.1). Phone + address are required for delivery per
// spec.md Domain 3; notes are optional. This is UI-only -- the server
// (WU4) is the real enforcement boundary (PHONE_REQUIRED_FOR_DELIVERY / R11).
//
// Native <label>/<input>, not shadcn's Input/Label -- see the same note
// in customer-name-field.tsx: those primitives are used only in checkout
// in this repo and carry iOS/glass bleed-through no `diner-*` utility can
// beat (dark: variants always win against a plain @utility class here).
export function DeliveryDetailsForm({
  phone,
  onPhoneChange,
  address,
  onAddressChange,
  notes,
  onNotesChange,
}: DeliveryDetailsFormProps) {
  return (
    <div data-testid="delivery-address-form">
      <div className="diner-field">
        <label
          htmlFor="checkout-phone"
          className="mb-1 block font-sans text-xs font-medium text-[var(--muted-foreground)]"
        >
          Teléfono
        </label>
        <input
          id="checkout-phone"
          type="tel"
          required
          autoComplete="tel"
          inputMode="numeric"
          value={phone}
          onChange={(e) => onPhoneChange(e.target.value)}
          placeholder="Ej: 3454123456"
          className="w-full rounded-lg border border-[var(--hairline)] bg-[var(--surface-1)] px-[10px] py-[11px] font-sans text-[0.95rem] leading-[1.3] text-[var(--foreground)] outline-none placeholder:text-[var(--muted-foreground-dim)] focus-visible:border-[var(--accent-brand)] focus-visible:shadow-[inset_0_0_0_1px_var(--accent-brand)]"
        />
      </div>

      <div className="diner-field">
        <label
          htmlFor="checkout-address"
          className="mb-1 block font-sans text-xs font-medium text-[var(--muted-foreground)]"
        >
          Dirección
        </label>
        <input
          id="checkout-address"
          required
          autoComplete="street-address"
          value={address}
          onChange={(e) => onAddressChange(e.target.value)}
          placeholder="Calle, número, barrio"
          className="w-full rounded-lg border border-[var(--hairline)] bg-[var(--surface-1)] px-[10px] py-[11px] font-sans text-[0.95rem] leading-[1.3] text-[var(--foreground)] outline-none placeholder:text-[var(--muted-foreground-dim)] focus-visible:border-[var(--accent-brand)] focus-visible:shadow-[inset_0_0_0_1px_var(--accent-brand)]"
        />
      </div>

      <div className="diner-field">
        <label
          htmlFor="checkout-notes"
          className="mb-1 block font-sans text-xs font-medium text-[var(--muted-foreground)]"
        >
          Notas (opcional)
        </label>
        <input
          id="checkout-notes"
          value={notes}
          onChange={(e) => onNotesChange(e.target.value)}
          placeholder="Timbre, piso, entre calles..."
          className="w-full rounded-lg border border-[var(--hairline)] bg-[var(--surface-1)] px-[10px] py-[11px] font-sans text-[0.95rem] leading-[1.3] text-[var(--foreground)] outline-none placeholder:text-[var(--muted-foreground-dim)] focus-visible:border-[var(--accent-brand)] focus-visible:shadow-[inset_0_0_0_1px_var(--accent-brand)]"
        />
      </div>
    </div>
  );
}
