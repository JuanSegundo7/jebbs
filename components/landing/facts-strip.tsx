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
// una superficie plana, no una lista de chips flotantes. En mobile/tablet
// es una grilla 2x2 con divisores en cruz. Colores
// de jebbs-dashboard (--hairline en vez de --line, --accent-brand en los
// íconos); tipografía "diner" (font-condensed mayúscula) restaurada.
export function FactsStrip({ coverage = COVERAGE_FALLBACK }: { coverage?: string }) {
  const FACTS = buildFacts(coverage);
  return (
    <div className="border-b border-[var(--hairline)] bg-[var(--surface-2)]">
      <div className="diner-wrap grid grid-cols-2 lg:grid-cols-4">
        {FACTS.map(({ icon: Icon, label }, i) => (
          <div
            key={label}
            className={
              "flex items-center justify-center gap-2 px-3 py-2.5 sm:px-4 sm:py-4 font-condensed text-[13px] font-semibold tracking-[.09em] text-[var(--muted-foreground)] uppercase " +
              // 2x2 on mobile/tablet (top border on row 2, left border on
              // the right column); single row from lg (left border on 2-4).
              [
                "",
                "border-l border-[var(--hairline)]",
                "border-t border-[var(--hairline)] lg:border-t-0 lg:border-l",
                "border-l border-t border-[var(--hairline)] lg:border-t-0",
              ][i]

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
