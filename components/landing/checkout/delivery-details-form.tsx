"use client";

import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

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
// Styled as ticket lines (reference site: jebbs-burgers.vercel.app,
// checkout section) -- Courier Prime, underline-only inputs. Logic untouched.
const ticketInputClass =
  "h-9 rounded-none border-0 border-b border-[var(--paper-line)] bg-transparent px-1 font-ticket text-[var(--paper-ink)] placeholder:text-[var(--paper-line)] focus-visible:ring-0";
const ticketLabelClass = "font-ticket text-xs tracking-[.08em] text-[var(--paper-ink)] uppercase";

export function DeliveryDetailsForm({
  phone,
  onPhoneChange,
  address,
  onAddressChange,
  notes,
  onNotesChange,
}: DeliveryDetailsFormProps) {
  return (
    <div className="space-y-3" data-testid="delivery-address-form">
      <div className="space-y-1.5">
        <Label htmlFor="checkout-phone" className={ticketLabelClass}>
          Teléfono
        </Label>
        <Input
          id="checkout-phone"
          type="tel"
          required
          value={phone}
          onChange={(e) => onPhoneChange(e.target.value)}
          placeholder="Ej: 3454123456"
          className={ticketInputClass}
        />
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="checkout-address" className={ticketLabelClass}>
          Dirección
        </Label>
        <Input
          id="checkout-address"
          required
          value={address}
          onChange={(e) => onAddressChange(e.target.value)}
          placeholder="Calle, número, barrio"
          className={ticketInputClass}
        />
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="checkout-notes" className={ticketLabelClass}>
          Notas (opcional)
        </Label>
        <Input
          id="checkout-notes"
          value={notes}
          onChange={(e) => onNotesChange(e.target.value)}
          placeholder="Timbre, piso, entre calles..."
          className={ticketInputClass}
        />
      </div>
    </div>
  );
}
