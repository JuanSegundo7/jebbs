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
// Styled as a stamped ticket toggle (ref-style.css:221-224 .seg/.seg
// button[aria-pressed]) -- Courier Prime, relleno --paper-ink (oscuro)
// sobre la activa, NO ember: es el mismo contraste "sello" que el resto
// del ticket, la marca (cheddar/ember) no aparece dentro del papel salvo
// en el botón de enviar. Logic untouched.
export function FulfillmentToggle({ value, onChange }: FulfillmentToggleProps) {
  return (
    <Tabs
      value={value}
      onValueChange={(next) => onChange(next as FulfillmentType)}
    >
      <TabsList className="w-full rounded-none border border-[var(--paper-line)] bg-transparent p-0.5">
        <TabsTrigger
          value="pickup"
          className="rounded-none font-ticket text-xs tracking-[.1em] text-[#6B6154] uppercase data-[state=active]:bg-[var(--paper-ink)] data-[state=active]:text-[var(--paper)] data-[state=active]:shadow-none"
        >
          <Store className="size-3.5" aria-hidden />
          Retiro en el local
        </TabsTrigger>
        <TabsTrigger
          value="delivery"
          className="rounded-none font-ticket text-xs tracking-[.1em] text-[#6B6154] uppercase data-[state=active]:bg-[var(--paper-ink)] data-[state=active]:text-[var(--paper)] data-[state=active]:shadow-none"
        >
          <Truck className="size-3.5" aria-hidden />
          Envío a domicilio
        </TabsTrigger>
      </TabsList>
    </Tabs>
  );
}
