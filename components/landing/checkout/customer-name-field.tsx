"use client";

import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

interface CustomerNameFieldProps {
  value: string;
  onChange: (value: string) => void;
}

// CreateWebOrderSchema requires customer.name for BOTH pickup and delivery
// (lib/order/cart-request.ts) -- unlike phone/address, this isn't
// delivery-specific, so it's rendered unconditionally, above the
// pickup/delivery toggle.
//
// Styled as a line on a paper ticket (reference site: jebbs-burgers.vercel.app,
// checkout section) -- Courier Prime, no pill/glass chrome, a single
// underline instead of a bordered box. Logic untouched.
export function CustomerNameField({ value, onChange }: CustomerNameFieldProps) {
  return (
    <div className="space-y-1.5">
      <Label
        htmlFor="checkout-customer-name"
        className="font-ticket text-xs tracking-[.08em] text-[var(--paper-ink)] uppercase"
      >
        Nombre
      </Label>
      <Input
        id="checkout-customer-name"
        required
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder="Tu nombre"
        className="h-9 rounded-none border-0 border-b border-[var(--paper-line)] bg-transparent px-1 font-ticket text-[var(--paper-ink)] placeholder:text-[var(--paper-line)] focus-visible:ring-0"
      />
    </div>
  );
}
