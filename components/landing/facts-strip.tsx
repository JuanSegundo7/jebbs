import { Beef, Clock, MapPin, Truck } from "lucide-react";

const FACTS = [
  { icon: Truck, label: "Envío a domicilio" },
  { icon: Beef, label: "Retiro en el local" },
  // TODO: confirmar horario y zona reales con el dueño antes de publicar.
  { icon: Clock, label: "20:00 a 00:00 hs" },
  { icon: MapPin, label: "Gonnet y City Bell" },
] as const;

// Franja de datos operativos (ref-style.css:73-79 .facts) -- grilla
// dividida por líneas verticales de 1px sobre fondo --soot, no una lista
// de chips flotantes. En mobile (ref: max-width:640px) las columnas se
// apilan y el divisor pasa de vertical a horizontal.
export function FactsStrip() {
  return (
    <div className="border-b border-[var(--line)] bg-[var(--soot)]">
      <div className="diner-wrap grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4">
        {FACTS.map(({ icon: Icon, label }, i) => (
          <div
            key={label}
            className={
              "flex items-center justify-center gap-2 py-4 font-condensed text-[13px] font-semibold tracking-[.09em] text-[var(--ash)] uppercase " +
              (i > 0
                ? "border-t border-[var(--line)] sm:border-t-0 sm:border-l"
                : "")
            }
          >
            <Icon className="size-4 text-[var(--cheddar)]" aria-hidden />
            {label}
          </div>
        ))}
      </div>
    </div>
  );
}
