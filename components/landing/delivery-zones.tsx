import { MapPin } from "lucide-react";

// The reference site (jebbs-burgers.vercel.app) draws its delivery zones as
// a hand-illustrated SVG map. That's real art-direction work out of scope
// for this pass -- this is a plain badge list instead, same information,
// none of the illustration cost.
//
// TODO: zonas y costos de ejemplo -- confirmar con el dueño antes de
// publicar (nombres de barrio y el costo real de envío por zona).
const ZONES = [
  { name: "Gonnet", fee: "Envío $1.500" },
  { name: "City Bell", fee: "Envío $1.500" },
  { name: "Ringuelet", fee: "Envío $2.000" },
  { name: "La Plata (casco urbano)", fee: "Envío $2.500" },
] as const;

export function DeliveryZones() {
  return (
    <section className="scroll-mt-20 bg-[var(--coal)] px-6 py-16">
      <div className="mx-auto max-w-5xl">
        <h2 className="mb-2 font-display text-3xl text-[var(--cream)] sm:text-4xl">
          Zona de envío
        </h2>
        <p className="mb-6 font-body text-sm text-[var(--ash)]">
          Zonas y costos de referencia -- confirmá el tuyo al armar el pedido.
        </p>
        <ul className="flex flex-wrap gap-3">
          {ZONES.map((zone) => (
            <li key={zone.name} className="diner-chip">
              <MapPin className="size-3.5 text-[var(--cheddar)]" aria-hidden />
              {zone.name}
              <span className="text-[var(--ash-dim)]">·</span>
              <span className="text-[var(--cheddar)]">{zone.fee}</span>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
