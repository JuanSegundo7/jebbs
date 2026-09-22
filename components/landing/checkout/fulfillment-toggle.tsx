"use client";

import { Store, Truck } from "lucide-react";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import type { FulfillmentType } from "@/hooks/use-checkout";
import { formatArs } from "@/components/landing/order-builder/currency";

interface FulfillmentToggleProps {
  value: FulfillmentType;
  onChange: (type: FulfillmentType) => void;
  /** Shown as a second line inside the "Envío a domicilio" tab itself (real
   * feedback: the cost should be visible on the toggle, not only after
   * picking it and scrolling down to the totals). Cheapest active zone's
   * fee -- prices now vary by zone (DeliveryZonePicker), so this tab can
   * only ever advertise a "desde" floor, not a single number. null means no
   * zone is active: the tab is disabled instead of quoting a fake price,
   * pickup keeps working regardless. */
  minDeliveryFeeArs: number | null;
}

// Pickup/delivery switch (WU3b, tasks.md 5.1). Pickup is the default per
// D6 -- the fully-anonymous path, no customer/address row is ever created.
//
// Re-estilo a la identidad real de jebbs-dashboard -- misma convención de
// estado activo que las tabs de categoría de order-builder.tsx (fondo
// --accent-brand, texto --accent-contrast en la tab activa), así que toda
// la página lee como un solo sistema en vez de que el checkout tenga su
// propio lenguaje visual aparte. Lógica intacta.
export function FulfillmentToggle({ value, onChange, minDeliveryFeeArs }: FulfillmentToggleProps) {
  const deliveryDisabled = minDeliveryFeeArs === null;
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
          // items-center + flex-col en el contenido (no en el trigger, que
          // ya trae su propio layout base) para que las dos líneas queden
          // centradas igual que antes tenía centrado el texto simple.
          className="h-auto flex-col gap-0.5 rounded-md px-2 py-[8px] font-condensed text-[.8rem] tracking-[.08em] text-[var(--muted-foreground)] uppercase [transition-timing-function:cubic-bezier(0.16,1,0.3,1)] data-[state=active]:border-transparent data-[state=active]:bg-[var(--accent-brand)] data-[state=active]:text-[var(--accent-contrast)] data-[state=active]:shadow-none focus-visible:ring-0 focus-visible:outline-[var(--accent-brand)] dark:text-[var(--muted-foreground)] dark:data-[state=active]:border-transparent dark:data-[state=active]:bg-[var(--accent-brand)] dark:data-[state=active]:text-[var(--accent-contrast)]"
        >
          <span className="flex items-center gap-1.5">
            <Store className="size-3.5" aria-hidden />
            Retiro en el local
          </span>
          <span className="numeric text-[.68rem] font-normal tracking-[.04em] opacity-70 normal-case">
            Sin cargo
          </span>
        </TabsTrigger>
        <TabsTrigger
          value="delivery"
          disabled={deliveryDisabled}
          className="h-auto flex-col gap-0.5 rounded-md px-2 py-[8px] font-condensed text-[.8rem] tracking-[.08em] text-[var(--muted-foreground)] uppercase [transition-timing-function:cubic-bezier(0.16,1,0.3,1)] data-[state=active]:border-transparent data-[state=active]:bg-[var(--accent-brand)] data-[state=active]:text-[var(--accent-contrast)] data-[state=active]:shadow-none focus-visible:ring-0 focus-visible:outline-[var(--accent-brand)] disabled:pointer-events-none disabled:opacity-40 dark:text-[var(--muted-foreground)] dark:data-[state=active]:border-transparent dark:data-[state=active]:bg-[var(--accent-brand)] dark:data-[state=active]:text-[var(--accent-contrast)]"
        >
          <span className="flex items-center gap-1.5">
            <Truck className="size-3.5" aria-hidden />
            Envío a domicilio
          </span>
          <span className="numeric text-[.68rem] font-normal tracking-[.04em] opacity-70 normal-case">
            {minDeliveryFeeArs === null ? "No disponible" : `desde ${formatArs(minDeliveryFeeArs)}`}
          </span>
        </TabsTrigger>
      </TabsList>
    </Tabs>
  );
}
