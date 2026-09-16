import { Clock, MapPin, Phone } from "lucide-react";

// Static shop info (hours/zone/contact) transcripto de ref-style.css:121-130
// (.info/.cards/.card): grilla con separador de 1px real (fondo del
// contenedor, no gap+divide), tarjetas --soot planas -- no floating cards
// con shadow ni <dl>/<dt>/<dd> genéricos. No catalog/cart state.
const FACTS = [
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
    detail: "Gonnet y City Bell, La Plata.",
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

export function InfoSection() {
  return (
    <section id="info" className="diner-section scroll-mt-20 bg-[var(--soot)]">
      <div className="diner-wrap">
        <div className="diner-sechead">
          <div>
            <p className="diner-eyebrow">Antes de pedir</p>
            <h2 className="diner-sechead-title">Horarios y contacto</h2>
          </div>
        </div>
        <div className="diner-cards-grid">
          {FACTS.map(({ icon: Icon, title, chip, detail, sub }) => (
            <div key={title} className="diner-card">
              <h3 className="mb-3 flex flex-wrap items-center gap-2 font-condensed text-[1.05rem] font-bold tracking-[.15em] text-[var(--ash)] uppercase">
                <Icon className="size-4 text-[var(--cheddar)]" aria-hidden />
                {title}
                <span className="diner-chip diner-chip-hollow">{chip}</span>
              </h3>
              <p className="text-[0.97rem] text-[var(--cream)]">{detail}</p>
              <p className="mt-2.5 text-[0.92rem] text-[var(--ash)]">{sub}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
