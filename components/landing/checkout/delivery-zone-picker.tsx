"use client";

import { cn } from "@/lib/utils";
import { formatArs } from "@/components/landing/order-builder/currency";
import type { DeliveryZone } from "@/lib/types";

interface DeliveryZonePickerProps {
  zones: DeliveryZone[];
  value: string | null;
  zoneNotListed: boolean;
  onChange: (zoneId: string | null, notListed: boolean) => void;
  /** See customer-name-field.tsx's `invalid` prop for the same contract. */
  invalid?: boolean;
}

const FIELD_CLASS =
  "w-full rounded-lg border border-[var(--hairline)] bg-[var(--surface-1)] px-[10px] py-[11px] font-body text-[0.95rem] leading-[1.3] text-[var(--foreground)] outline-none focus-visible:border-[var(--accent-brand)] focus-visible:shadow-[inset_0_0_0_1px_var(--accent-brand)]";
const FIELD_INVALID_CLASS = "border-[var(--destructive)] shadow-[inset_0_0_0_1px_var(--destructive)]";

// Sentinel option value for "no encuentro mi zona" -- kept out of the uuid
// space on purpose so it can never collide with a real zone id.
const NOT_LISTED_VALUE = "__not_listed__";

// Step 1 of the cart wizard, rendered only while fulfillmentType ===
// "delivery" (order-preferences.tsx) -- the zone choice changes the total
// shown, same reason the fulfillment/payment toggles live here instead of
// step 2.
//
// Native <select>, not shadcn's Select: same reasoning as
// customer-name-field.tsx/delivery-details-form.tsx -- those primitives
// carry iOS/glass bleed-through no `diner-*` utility can beat, and this app
// is hardcoded to dark mode.
export function DeliveryZonePicker({
  zones,
  value,
  zoneNotListed,
  onChange,
  invalid = false,
}: DeliveryZonePickerProps) {
  const selectValue = zoneNotListed ? NOT_LISTED_VALUE : (value ?? "");

  return (
    <div className="diner-field">
      <label
        htmlFor="checkout-delivery-zone"
        className="mb-1 block font-condensed text-[0.72rem] tracking-[.14em] text-[var(--muted-foreground)] uppercase"
      >
        Zona de envío
      </label>
      <select
        id="checkout-delivery-zone"
        required
        value={selectValue}
        onChange={(e) => {
          const next = e.target.value;
          if (next === NOT_LISTED_VALUE) {
            onChange(null, true);
          } else {
            onChange(next || null, false);
          }
        }}
        aria-invalid={invalid}
        aria-describedby={invalid ? "checkout-delivery-zone-error" : undefined}
        className={cn(FIELD_CLASS, invalid && FIELD_INVALID_CLASS)}
      >
        <option value="" disabled>
          Elegí tu zona
        </option>
        {zones.map((zone) => (
          <option key={zone.id} value={zone.id}>
            {zone.name} — {formatArs(zone.fee)}
          </option>
        ))}
        <option value={NOT_LISTED_VALUE}>
          No encuentro mi zona (te confirmamos el envío)
        </option>
      </select>
      {invalid && (
        <p
          id="checkout-delivery-zone-error"
          role="alert"
          className="mt-1 font-body text-[11px] text-[var(--destructive)]"
        >
          Elegí tu zona de envío
        </p>
      )}
    </div>
  );
}
