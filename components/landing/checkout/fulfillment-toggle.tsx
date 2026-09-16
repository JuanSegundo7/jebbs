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
export function FulfillmentToggle({ value, onChange }: FulfillmentToggleProps) {
  return (
    <Tabs
      value={value}
      onValueChange={(next) => onChange(next as FulfillmentType)}
    >
      <TabsList className="w-full">
        <TabsTrigger value="pickup">
          <Store className="size-3.5" aria-hidden />
          Retiro en el local
        </TabsTrigger>
        <TabsTrigger value="delivery">
          <Truck className="size-3.5" aria-hidden />
          Envío a domicilio
        </TabsTrigger>
      </TabsList>
    </Tabs>
  );
}
