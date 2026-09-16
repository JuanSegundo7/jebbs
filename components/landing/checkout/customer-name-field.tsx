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
export function CustomerNameField({ value, onChange }: CustomerNameFieldProps) {
  return (
    <div className="space-y-1.5">
      <Label htmlFor="checkout-customer-name">Nombre</Label>
      <Input
        id="checkout-customer-name"
        required
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder="Tu nombre"
      />
    </div>
  );
}
