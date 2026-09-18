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
        <label htmlFor="checkout-phone" className="diner-field-label">
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
          className="diner-field-input"
        />
      </div>

      <div className="diner-field">
        <label htmlFor="checkout-address" className="diner-field-label">
          Dirección
        </label>
        <input
          id="checkout-address"
          required
          autoComplete="street-address"
          value={address}
          onChange={(e) => onAddressChange(e.target.value)}
          placeholder="Calle, número, barrio"
          className="diner-field-input"
        />
      </div>

      <div className="diner-field">
        <label htmlFor="checkout-notes" className="diner-field-label">
          Notas (opcional)
        </label>
        <input
          id="checkout-notes"
          value={notes}
          onChange={(e) => onNotesChange(e.target.value)}
          placeholder="Timbre, piso, entre calles..."
          className="diner-field-input"
        />
      </div>
    </div>
  );
}
