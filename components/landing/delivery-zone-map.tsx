// El sitio de referencia (jebbs-burgers.vercel.app) dibuja sus zonas de
// envío sobre un mapa callejero real (City Bell -> casco urbano de La
// Plata), no una lista de badges -- eso es lo que el dueño señaló como
// faltante ("le falta la parte del mapa"). El SVG completo (viewBox
// "0 0 1654 966", calles reales trazadas) se sirve como archivo estático
// en public/delivery-zone-map.svg, transcripto tal cual del HTML del
// sitio de referencia -- pesa ~560KB de datos de path, así que va como
// <img> (no inline en el bundle de JS) en vez de un componente SVG con
// las zonas como elementos React individuales. Contrapartida consciente:
// se pierde la interactividad zona<->lista del original (hover/click que
// resalta el path); lo que no se pierde es que el mapa real aparezca en
// la página, que es el pedido explícito.
//
// Los nombres de zona y el costo de envío son de ejemplo -- el archivo
// que ref-zonemap.svg no incluye esa lista (.zlist/.zrow vivía en otra
// parte del HTML que no llegó a esta sesión), así que se mantiene el
// placeholder "a confirmar" ya usado en el resto de la página.
const ZONES = [
  { name: "City Bell", hoods: "Casco y alrededores", fee: "$1.500", color: "#F2B21C" },
  { name: "Gonnet", hoods: "Zona centro", fee: "$1.500", color: "#E2622C" },
  { name: "Ringuelet", hoods: "Y alrededores", fee: "$2.000", color: "#A3331F" },
  { name: "La Plata", hoods: "Casco urbano", fee: "$2.500", color: "#6E2650" },
] as const;

export function DeliveryZoneMap() {
  return (
    <section id="zonas" className="diner-section scroll-mt-20">
      <div className="diner-wrap">
        <div className="diner-sechead">
          <div>
            <p className="diner-eyebrow">Zonas de envío</p>
            <h2 className="diner-sechead-title">
              Hasta dónde llegamos{" "}
              <span className="diner-chip diner-chip-hollow align-middle">
                A confirmar
              </span>
            </h2>
            <p className="diner-sechead-note">
              El borde de cada barrio en el mapa es el límite real que figura
              en OpenStreetMap, no un dibujo aproximado. Falta confirmar a
              cuáles zonas llegan de verdad y cuánto cobran de envío en cada
              una.
            </p>
          </div>
        </div>

        <div className="flex flex-col gap-[22px]">
          <div className="diner-zonemap-frame overflow-x-auto">
            <img
              src="/delivery-zone-map.svg"
              alt="Mapa de las zonas de envío de Jebbs Burger's, desde City Bell hasta el casco urbano de La Plata"
              className="block h-auto w-full min-w-[720px] sm:min-w-0"
            />
          </div>

          <ul className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
            {ZONES.map((zone) => (
              <li
                key={zone.name}
                className="diner-zrow"
                style={{ "--zc": zone.color } as React.CSSProperties}
              >
                <span className="diner-zname">{zone.name}</span>
                <span className="diner-zhoods">{zone.hoods}</span>
                <span className="diner-zprice">Envío {zone.fee}</span>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </section>
  );
}
