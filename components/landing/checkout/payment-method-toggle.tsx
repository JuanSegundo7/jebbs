"use client";

import { Banknote, Landmark } from "lucide-react";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import type { PaymentMethod } from "@/hooks/use-checkout";

interface PaymentMethodToggleProps {
  value: PaymentMethod;
  onChange: (method: PaymentMethod) => void;
}

// Cash/transfer switch. `paymentMethod` already existed end-to-end in
// useCheckout -> build-cart-request.ts -> the Zod schema -> orders.payment_method
// (and the WhatsApp message already prints "Efectivo"/"Transferencia") --
// this was the only missing piece, a UI control. Renders unconditionally
// (not gated on fulfillmentType): cash vs. transfer applies to pickup too.
// Structural clone of fulfillment-toggle.tsx, including its `dark:`
// duplication -- see the comment there for why it's load-bearing.
export function PaymentMethodToggle({ value, onChange }: PaymentMethodToggleProps) {
  return (
    <Tabs value={value} onValueChange={(next) => onChange(next as PaymentMethod)}>
      <TabsList className="h-auto w-full rounded-lg border border-[var(--hairline-strong)] bg-[var(--surface-0)] p-1">
        <TabsTrigger
          value="cash"
          className="h-auto rounded-md px-2 py-[8px] font-condensed text-[.8rem] tracking-[.08em] text-[var(--muted-foreground)] uppercase [transition-timing-function:cubic-bezier(0.16,1,0.3,1)] data-[state=active]:border-transparent data-[state=active]:bg-[var(--accent-brand)] data-[state=active]:text-[var(--accent-contrast)] data-[state=active]:shadow-none focus-visible:ring-0 focus-visible:outline-[var(--accent-brand)] dark:text-[var(--muted-foreground)] dark:data-[state=active]:border-transparent dark:data-[state=active]:bg-[var(--accent-brand)] dark:data-[state=active]:text-[var(--accent-contrast)]"
        >
          <Banknote className="size-3.5" aria-hidden />
          Efectivo
        </TabsTrigger>
        <TabsTrigger
          value="transfer"
          className="h-auto rounded-md px-2 py-[8px] font-condensed text-[.8rem] tracking-[.08em] text-[var(--muted-foreground)] uppercase [transition-timing-function:cubic-bezier(0.16,1,0.3,1)] data-[state=active]:border-transparent data-[state=active]:bg-[var(--accent-brand)] data-[state=active]:text-[var(--accent-contrast)] data-[state=active]:shadow-none focus-visible:ring-0 focus-visible:outline-[var(--accent-brand)] dark:text-[var(--muted-foreground)] dark:data-[state=active]:border-transparent dark:data-[state=active]:bg-[var(--accent-brand)] dark:data-[state=active]:text-[var(--accent-contrast)]"
        >
          <Landmark className="size-3.5" aria-hidden />
          Transferencia
        </TabsTrigger>
      </TabsList>
    </Tabs>
  );
}
