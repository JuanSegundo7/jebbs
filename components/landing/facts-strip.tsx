import { COVERAGE_FALLBACK } from "@/lib/catalog/coverage-text";
import { Beef, Clock, MapPin, Truck } from "lucide-react";

function buildFacts(coverage: string) {
  return [
    { icon: Truck, label: "Envío a domicilio" },
    { icon: Beef, label: "Retiro en el local" },
    // TODO: confirmar horario real con el dueño antes de publicar.
    { icon: Clock, label: "20:00 a 00:00 hs" },
    { icon: MapPin, label: coverage },
  ];
}

// Franja de datos operativos -- grilla dividida por líneas de 1px sobre
// una superficie plana, no una lista de chips flotantes. En mobile las
// columnas se apilan y el divisor pasa de vertical a horizontal. Colores
// de jebbs-dashboard (--hairline en vez de --line, --accent-brand en los
// íconos); tipografía "diner" (font-condensed mayúscula) restaurada.
export function FactsStrip({ coverage = COVERAGE_FALLBACK }: { coverage?: string }) {
  const FACTS = buildFacts(coverage);
  return (
    <div className="border-b border-[var(--hairline)] bg-[var(--surface-1)]">
      <div className="diner-wrap grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4">
        {FACTS.map(({ icon: Icon, label }, i) => (
          <div
            key={label}
            className={
              "flex items-center justify-center gap-2 px-4 py-4 font-condensed text-[13px] font-semibold tracking-[.09em] text-[var(--muted-foreground)] uppercase " +
              (i > 0
                ? "border-t border-[var(--hairline)] sm:border-t-0 sm:border-l"
                : "")
            }
          >
            <Icon className="size-4 shrink-0 text-[var(--accent-brand)]" aria-hidden />
            <span className="min-w-0 text-balance text-center leading-snug">{label}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
