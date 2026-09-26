import { COVERAGE_FALLBACK } from "@/lib/catalog/coverage-text";
import { Clock, MapPin, Phone } from "lucide-react";

// Static shop info (hours/zone/contact) -- grilla con separador de 1px real
// (fondo del contenedor, no gap+divide). No catalog/cart state.
//
// Colores de jebbs-dashboard (naranja/frío en vez de mostaza/carbón).
// diner-section/diner-wrap/diner-sechead se mantienen (son layout puro, sin
// color). Tipografía "diner" restaurada por pedido del dueño: valores
// exactos de diner-eyebrow/diner-sechead-title/diner-chip-hollow en
// globals.css, aplicados acá como clases literales porque esas utilities
// siguen compartidas con otras secciones que ya tienen sus propios colores.
function buildFacts(coverage: string) {
  return [
    {
      icon: Clock,
      title: "Horarios",
      chip: "Confirmado",
      // TODO: copy real -- confirmar horario real con el dueño antes de publicar.
      detail: "Todos los días de 20:00 a 00:00 hs.",
      sub: "Horario confirmado por el dueño. Los pedidos por WhatsApp entran dentro de ese rango.",
    },
    {
      icon: MapPin,
      title: "Dónde estamos",
      chip: "A confirmar",
      // TODO: copy real -- confirmar la zona/barrios reales con el dueño.
      detail: `${coverage}, La Plata.`,
      sub: "Acá va la calle y el número del local -- hoy no está publicado.",
    },
    {
      icon: Phone,
      title: "Pagos",
      chip: "A confirmar",
      detail: "Efectivo · Transferencia · Mercado Pago",
      sub: "Confirmar cuáles acepta el local y si hay algún recargo.",
    },
  ] as const;
}

export function InfoSection({
  coverage = COVERAGE_FALLBACK,
}: {
  coverage?: string;
}) {
  const FACTS = buildFacts(coverage);
  return (
    <section
      id="info"
      className="diner-section scroll-mt-20 bg-[var(--surface-1)]"
    >
      <div className="diner-wrap">
        <div className="diner-sechead">
          <div>
            <p className="font-condensed text-[0.82rem] font-bold tracking-[0.18em] text-[var(--accent-brand)] uppercase">
              Antes de pedir
            </p>
            <h2 className="mt-[10px] font-display text-[clamp(1.7rem,3.6vw,2.5rem)] leading-none tracking-[-0.024em] text-[var(--foreground)]">
              Horarios y contacto
            </h2>
          </div>
        </div>
        <div className="grid grid-cols-1 gap-px overflow-hidden rounded-2xl border border-[var(--hairline)] bg-[var(--hairline)] sm:grid-cols-3">
          {FACTS.map(({ icon: Icon, title, chip, detail, sub }) => (
            <div key={title} className="bg-[var(--surface-2)] p-6">
              <h3 className="mb-3 flex flex-wrap items-center gap-2 font-condensed text-[1.05rem] font-bold tracking-[.15em] text-[var(--foreground)] uppercase">
                <Icon
                  className="size-4 text-[var(--accent-brand)]"
                  aria-hidden
                />
                {title}
                <span className="rounded-full border border-[var(--accent-brand)]/50 px-2.5 py-0.5 font-condensed text-[0.72rem] font-bold tracking-[0.14em] text-[var(--accent-brand)] uppercase">
                  {chip}
                </span>
              </h3>
              <p className="text-[0.97rem] text-[var(--foreground)]">
                {detail}
              </p>
              <p className="mt-2.5 text-[0.92rem] text-[var(--muted-foreground)]">
                {sub}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
