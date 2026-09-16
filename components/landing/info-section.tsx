import { Clock, MapPin, Phone } from "lucide-react";

// Static shop info (hours/zone/contact) as a flat, editorial grid of
// <dl>/<dt>/<dd> blocks -- reference site: jebbs-burgers.vercel.app. Not
// cards with a shadow: a soot background and thin dividers, closer to a
// printed info panel than a floating UI surface. No catalog/cart state.
const FACTS = [
  {
    icon: Clock,
    term: "Horarios",
    // TODO: copy real -- confirmar horario real con el dueño antes de publicar.
    detail: "Todos los días de 20:00 a 00:00 hs.",
  },
  {
    icon: MapPin,
    term: "Zona",
    // TODO: copy real -- confirmar la zona/barrios reales con el dueño.
    detail: "Gonnet y City Bell, La Plata.",
  },
  {
    icon: Phone,
    term: "Contacto",
    detail: "Pedidos por WhatsApp desde el carrito.",
  },
] as const;

export function InfoSection() {
  return (
    <section id="info" className="scroll-mt-20 bg-[var(--soot)] px-6 py-16">
      <div className="mx-auto max-w-5xl">
        <h2 className="mb-8 font-display text-3xl text-[var(--cream)] sm:text-4xl">
          Info
        </h2>
        <dl className="grid gap-x-8 gap-y-8 sm:grid-cols-3">
          {FACTS.map(({ icon: Icon, term, detail }) => (
            <div
              key={term}
              className="space-y-2 border-t border-[var(--line)] pt-4"
            >
              <dt className="flex items-center gap-2 font-condensed text-xs font-bold tracking-[.12em] text-[var(--cheddar)] uppercase">
                <Icon className="size-3.5" aria-hidden />
                {term}
              </dt>
              <dd className="font-body text-[15px] text-[var(--ash)]">{detail}</dd>
            </div>
          ))}
        </dl>
      </div>
    </section>
  );
}
