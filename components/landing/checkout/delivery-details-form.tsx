"use client";

import { cn } from "@/lib/utils";

interface DeliveryDetailsFormProps {
  phone: string;
  onPhoneChange: (value: string) => void;
  address: string;
  onAddressChange: (value: string) => void;
  notes: string;
  onNotesChange: (value: string) => void;
  /** See customer-name-field.tsx's `invalid` prop for the same contract. */
  phoneInvalid?: boolean;
  addressInvalid?: boolean;
}

const FIELD_CLASS =
  "w-full rounded-lg border border-[var(--hairline)] bg-[var(--surface-1)] px-[10px] py-[11px] font-body text-[0.95rem] leading-[1.3] text-[var(--foreground)] outline-none placeholder:text-[var(--muted-foreground-dim)] focus-visible:border-[var(--accent-brand)] focus-visible:shadow-[inset_0_0_0_1px_var(--accent-brand)]";
const FIELD_INVALID_CLASS = "border-[var(--destructive)] shadow-[inset_0_0_0_1px_var(--destructive)]";

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
  phoneInvalid = false,
  addressInvalid = false,
}: DeliveryDetailsFormProps) {
  return (
    <div data-testid="delivery-address-form">
      <div className="diner-field">
        <label
          htmlFor="checkout-phone"
          className="mb-1 block font-condensed text-[0.72rem] tracking-[.14em] text-[var(--muted-foreground)] uppercase"
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
          aria-invalid={phoneInvalid}
          aria-describedby={phoneInvalid ? "checkout-phone-error" : undefined}
          className={cn(FIELD_CLASS, phoneInvalid && FIELD_INVALID_CLASS)}
        />
        {phoneInvalid && (
          <p id="checkout-phone-error" role="alert" className="mt-1 font-body text-[11px] text-[var(--destructive)]">
            Falta tu teléfono
          </p>
        )}
      </div>

      <div className="diner-field">
        <label
          htmlFor="checkout-address"
          className="mb-1 block font-condensed text-[0.72rem] tracking-[.14em] text-[var(--muted-foreground)] uppercase"
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
          aria-invalid={addressInvalid}
          aria-describedby={addressInvalid ? "checkout-address-error" : undefined}
          className={cn(FIELD_CLASS, addressInvalid && FIELD_INVALID_CLASS)}
        />
        {addressInvalid && (
          <p id="checkout-address-error" role="alert" className="mt-1 font-body text-[11px] text-[var(--destructive)]">
            Falta tu dirección
          </p>
        )}
      </div>

      <div className="diner-field">
        <label
          htmlFor="checkout-notes"
          className="mb-1 block font-condensed text-[0.72rem] tracking-[.14em] text-[var(--muted-foreground)] uppercase"
        >
          Referencia (opcional)
        </label>
        <input
          id="checkout-notes"
          value={notes}
          onChange={(e) => onNotesChange(e.target.value)}
          placeholder="Timbre, piso, entre calles..."
          className={FIELD_CLASS}
        />
      </div>
    </div>
  );
}
