import { Beef, Clock, MapPin, Truck } from "lucide-react";

const FACTS = [
  { icon: Truck, label: "Envío a domicilio" },
  { icon: Beef, label: "Retiro en el local" },
  // TODO: confirmar horario y zona reales con el dueño antes de publicar.
  { icon: Clock, label: "20:00 a 00:00 hs" },
  { icon: MapPin, label: "Gonnet y City Bell" },
] as const;

// Short operational-facts strip right under the hero (reference site:
// jebbs-burgers.vercel.app) -- delivery/pickup/hours/zone, in the brand's
// condensed uppercase voice. Purely presentational, no state.
export function FactsStrip() {
  return (
    <div className="border-y border-[var(--line)] bg-[var(--soot)]">
      <div className="mx-auto flex max-w-5xl flex-wrap items-center justify-center gap-x-8 gap-y-3 px-6 py-4 sm:justify-between">
        {FACTS.map(({ icon: Icon, label }) => (
          <div
            key={label}
            className="flex items-center gap-2 font-condensed text-[12px] font-bold tracking-[.1em] text-[var(--ash)] uppercase"
          >
            <Icon className="size-4 text-[var(--cheddar)]" aria-hidden />
            {label}
          </div>
        ))}
      </div>
    </div>
  );
}
