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
// Dark/cheddar toggle (2nd revision, matching checkout-panel.tsx's own
// pivot away from the light "paper ticket" look) -- same active-state
// convention as order-builder.tsx's category tabs (cheddar fill, coal
// text on the active tab), so the whole page reads as one system instead
// of the checkout having its own separate visual language. Logic untouched.
export function FulfillmentToggle({ value, onChange }: FulfillmentToggleProps) {
  return (
    <Tabs
      value={value}
      onValueChange={(next) => onChange(next as FulfillmentType)}
    >
      {/* dark: variants repeat every override on purpose: the base
          TabsTrigger ships bare + dark:-prefixed classes for the same
          property (text-foreground / dark:text-muted-foreground,
          data-[state=active]:bg-background / dark:data-[state=active]:bg-input/30),
          and this app is hardcoded to dark mode (<html className="dark">).
          An override with only the bare variant loses to the base
          component's dark: one at runtime -- this was the actual cause of
          the "poco legible" toggle, not a plain contrast/color choice. */}
      <TabsList className="h-auto w-full rounded-lg border border-[var(--line-2)] bg-[var(--coal)] p-1">
        <TabsTrigger
          value="pickup"
          className="h-auto rounded-md px-2 py-[8px] font-condensed text-[.8rem] tracking-[.08em] text-[var(--ash)] uppercase data-[state=active]:border-transparent data-[state=active]:bg-[var(--cheddar)] data-[state=active]:text-[var(--coal)] data-[state=active]:shadow-none focus-visible:ring-0 focus-visible:outline-[var(--cheddar)] dark:text-[var(--ash)] dark:data-[state=active]:border-transparent dark:data-[state=active]:bg-[var(--cheddar)] dark:data-[state=active]:text-[var(--coal)]"
        >
          <Store className="size-3.5" aria-hidden />
          Retiro en el local
        </TabsTrigger>
        <TabsTrigger
          value="delivery"
          className="h-auto rounded-md px-2 py-[8px] font-condensed text-[.8rem] tracking-[.08em] text-[var(--ash)] uppercase data-[state=active]:border-transparent data-[state=active]:bg-[var(--cheddar)] data-[state=active]:text-[var(--coal)] data-[state=active]:shadow-none focus-visible:ring-0 focus-visible:outline-[var(--cheddar)] dark:text-[var(--ash)] dark:data-[state=active]:border-transparent dark:data-[state=active]:bg-[var(--cheddar)] dark:data-[state=active]:text-[var(--coal)]"
        >
          <Truck className="size-3.5" aria-hidden />
          Envío a domicilio
        </TabsTrigger>
      </TabsList>
    </Tabs>
  );
}
