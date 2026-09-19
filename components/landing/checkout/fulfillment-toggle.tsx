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
// Re-estilo a la identidad real de jebbs-dashboard -- misma convención de
// estado activo que las tabs de categoría de order-builder.tsx (fondo
// --accent-brand, texto --accent-contrast en la tab activa), así que toda
// la página lee como un solo sistema en vez de que el checkout tenga su
// propio lenguaje visual aparte. Lógica intacta.
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
      <TabsList className="h-auto w-full rounded-lg border border-[var(--hairline-strong)] bg-[var(--surface-0)] p-1">
        <TabsTrigger
          value="pickup"
          // [transition-timing-function:...] -- misma curva cubic-bezier
          // que las tabs de categoría (order-builder.tsx) y el resto del
          // sistema de depth, para que el toggle se sienta consistente.
          className="h-auto rounded-md px-2 py-[8px] font-sans text-[.8rem] font-semibold text-[var(--muted-foreground)] [transition-timing-function:cubic-bezier(0.16,1,0.3,1)] data-[state=active]:border-transparent data-[state=active]:bg-[var(--accent-brand)] data-[state=active]:text-[var(--accent-contrast)] data-[state=active]:shadow-none focus-visible:ring-0 focus-visible:outline-[var(--accent-brand)] dark:text-[var(--muted-foreground)] dark:data-[state=active]:border-transparent dark:data-[state=active]:bg-[var(--accent-brand)] dark:data-[state=active]:text-[var(--accent-contrast)]"
        >
          <Store className="size-3.5" aria-hidden />
          Retiro en el local
        </TabsTrigger>
        <TabsTrigger
          value="delivery"
          className="h-auto rounded-md px-2 py-[8px] font-sans text-[.8rem] font-semibold text-[var(--muted-foreground)] [transition-timing-function:cubic-bezier(0.16,1,0.3,1)] data-[state=active]:border-transparent data-[state=active]:bg-[var(--accent-brand)] data-[state=active]:text-[var(--accent-contrast)] data-[state=active]:shadow-none focus-visible:ring-0 focus-visible:outline-[var(--accent-brand)] dark:text-[var(--muted-foreground)] dark:data-[state=active]:border-transparent dark:data-[state=active]:bg-[var(--accent-brand)] dark:data-[state=active]:text-[var(--accent-contrast)]"
        >
          <Truck className="size-3.5" aria-hidden />
          Envío a domicilio
        </TabsTrigger>
      </TabsList>
    </Tabs>
  );
}
