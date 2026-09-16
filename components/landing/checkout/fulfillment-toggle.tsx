"use client";

import { Store, Truck } from "lucide-react";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import type { FulfillmentType } from "@/hooks/use-checkout";

interface FulfillmentToggleProps {
  value: FulfillmentType;
  onChange: (type: FulfillmentType) => void;
}

// Pickup/delivery switch (WU3b, tasks.md 5.1). Pickup is the default per
// D6 -- the fully-anonymous path, no customer/address row is ever created.
//
// Styled as a stamped ticket toggle (reference site: jebbs-burgers.vercel.app,
// checkout section) -- Courier Prime, ember fill on the active option
// instead of the generic light pill. Logic untouched.
export function FulfillmentToggle({ value, onChange }: FulfillmentToggleProps) {
  return (
    <Tabs
      value={value}
      onValueChange={(next) => onChange(next as FulfillmentType)}
    >
      <TabsList className="w-full rounded-none border border-[var(--paper-line)] bg-transparent p-0.5">
        <TabsTrigger
          value="pickup"
          className="rounded-sm font-ticket text-xs tracking-[.04em] text-[var(--paper-ink)] uppercase data-[state=active]:bg-[var(--ember)] data-[state=active]:text-[var(--paper)] data-[state=active]:shadow-none"
        >
          <Store className="size-3.5" aria-hidden />
          Retiro en el local
        </TabsTrigger>
        <TabsTrigger
          value="delivery"
          className="rounded-sm font-ticket text-xs tracking-[.04em] text-[var(--paper-ink)] uppercase data-[state=active]:bg-[var(--ember)] data-[state=active]:text-[var(--paper)] data-[state=active]:shadow-none"
        >
          <Truck className="size-3.5" aria-hidden />
          Envío a domicilio
        </TabsTrigger>
      </TabsList>
    </Tabs>
  );
}
