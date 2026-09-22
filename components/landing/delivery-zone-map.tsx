"use client";

import { useEffect, useRef, useState } from "react";
import { BRAND_NAME } from "@/lib/brand";
import { formatArs } from "@/components/landing/order-builder/currency";
import type { DeliveryZone } from "@/lib/types";

// El sitio de referencia (jebbs-burgers.vercel.app) dibuja sus zonas de
// envío sobre un mapa callejero real (City Bell -> casco urbano de La
// Plata), no una lista de badges -- eso es lo que el dueño señaló como
// faltante ("le falta la parte del mapa"). El SVG completo (viewBox
// "0 0 1654 966", calles reales trazadas) se sirve como archivo estático
// en public/delivery-zone-map.svg, transcripto tal cual del HTML del
// sitio de referencia -- pesa ~560KB de datos de path.
//
// Para tener hover real (opacar las demás zonas + resaltar la fila
// correspondiente abajo) el SVG tiene que vivir en el DOM de la página,
// no en un <img> (una imagen no dispara eventos de sus elementos internos
// ni se le puede tocar una clase). La solución que mantiene el archivo
// cacheable como asset estático (en vez de embeberlo en el HTML/bundle de
// cada carga de página) es: seguir sirviéndolo en public/, pero
// fetchearlo del lado del cliente e inyectarlo con dangerouslySetInnerHTML
// una sola vez montado -- es nuestro propio asset de confianza, no
// contenido de usuario.
//
// Zonas reales, ya no de ejemplo -- vienen del mismo getCatalog() que
// alimenta el checkout (delivery-zones addendum), así que el mapa muestra
// exactamente los mismos nombres/precios que el servidor termina cobrando,
// no un placeholder "a confirmar" desconectado de la realidad. Cada zona se
// matchea a un path del SVG por zone.map_zone_key ("z1".."z4", atributo
// data-zone ya presente en public/delivery-zone-map.svg); una zona sin
// map_zone_key igual aparece en la lista de abajo, solo que sin resaltado
// en el mapa. Un data-zone del SVG que no matchea ninguna zona activa
// recibe la clase .zone-off (globals.css) -- gris, sin hover -- en vez de
// desaparecer o (peor) seguir mostrando un precio caído.
interface DeliveryZoneMapProps {
  zones: DeliveryZone[];
}

// Paleta categórica del dashboard (--chart-1..4, ya validada CVD-safe), la
// misma que public/delivery-zone-map.svg ya trae hardcodeada por
// data-zone="z1".."z4" en su propio <style> embebido -- mismo hex en los
// dos lugares a mano, no hay una única fuente de verdad para esto. Solo
// alimenta el --zc de la fila de la lista (diner-zrow, globals.css); el
// color del path del SVG en sí sigue viniendo del propio archivo.
const MAP_ZONE_COLORS: Record<string, string> = {
  z1: "#3987e5",
  z2: "#d95926",
  z3: "#199e70",
  z4: "#c98500",
};

// Zonas dibujadas a mano (map_polygon, sin data-zone pre-trazado en el
// SVG) no tienen un hex hardcodeado como las legacy -- se les asigna un
// color de la paleta categórica del propio tema (--chart-1..5, ya
// validada CVD-safe en globals.css) por índice, no por valor fijo, así
// quedan consistentes con dark mode sin duplicar hex a mano. El ciclo
// repite pasada la 5ta zona con posición en el mapa -- aceptable, no bug.
const CHART_COLOR_VARS = [
  "var(--chart-1)",
  "var(--chart-2)",
  "var(--chart-3)",
  "var(--chart-4)",
  "var(--chart-5)",
];

// Zonas con alguna presencia en el mapa (legacy data-zone O polígono
// dibujado a mano), ordenadas por sort_order -- el índice de una zona en
// esta lista es lo que decide qué --chart-N le toca cuando no tiene un
// hex legacy fijo (MAP_ZONE_COLORS). Mantiene el mismo color en la
// leyenda y en el overlay de polígonos para una misma zona.
function getMappedZones(zones: DeliveryZone[]): DeliveryZone[] {
  return zones
    .filter((zone) => zone.map_zone_key !== null || zone.map_polygon !== null)
    .slice()
    .sort((a, b) => a.sort_order - b.sort_order);
}

// Invariante del editor del dashboard: una zona nunca tiene map_zone_key
// Y map_polygon a la vez (dibujar un polígono limpia la key legacy), así
// que esto no elige entre ambos -- resuelve cuál de los dos está seteado.
function getZoneMapColor(zone: DeliveryZone, mappedZones: DeliveryZone[]): string | null {
  if (zone.map_zone_key) return MAP_ZONE_COLORS[zone.map_zone_key] ?? null;
  if (zone.map_polygon) {
    const index = mappedZones.findIndex((z) => z.id === zone.id);
    if (index === -1) return null;
    return CHART_COLOR_VARS[index % CHART_COLOR_VARS.length];
  }
  return null;
}

export function DeliveryZoneMap({ zones }: DeliveryZoneMapProps) {
  const mapRef = useRef<HTMLDivElement>(null);
  const [svgMarkup, setSvgMarkup] = useState<string | null>(null);
  // Tracked by zone id (not map_zone_key) -- a zone without a map location
  // (map_zone_key === null) still needs its own stable hover identity, and
  // two such zones must not both light up together just because they'd
  // otherwise share the same "no key" value.
  const [hoveredZoneId, setHoveredZoneId] = useState<string | null>(null);
  const hoveredMapKey =
    zones.find((z) => z.id === hoveredZoneId)?.map_zone_key ?? null;
  const mappedZones = getMappedZones(zones);
  const polygonZones = zones.filter(
    (zone): zone is DeliveryZone & { map_polygon: [number, number][] } =>
      zone.map_polygon !== null,
  );

  useEffect(() => {
    let cancelled = false;
    fetch("/delivery-zone-map.svg")
      .then((res) => res.text())
      .then((text) => {
        if (!cancelled) setSvgMarkup(text);
      })
      .catch(() => {
        // Falla silenciosa a propósito: si el fetch no anda (offline,
        // asset movido), la sección de zonas simplemente no muestra el
        // mapa en vez de romper el resto de la página.
      });
    return () => {
      cancelled = true;
    };
  }, []);

  // Delegación de eventos sobre el contenedor: los <path data-zone="z1">
  // etc. ya vienen con ese atributo desde el SVG original (ref-zonemap.svg),
  // no hace falta parsear los ~560KB de paths, solo escuchar bubbling.
  // pointer-events: none en .zone-off (globals.css) ya evita que una zona
  // apagada dispare este handler -- no hace falta filtrarla acá también.
  useEffect(() => {
    const container = mapRef.current;
    if (!container || !svgMarkup) return;

    const handleOver = (e: Event) => {
      const target = (e.target as Element).closest("[data-zone]");
      const mapKey = target?.getAttribute("data-zone");
      const zone = mapKey ? zones.find((z) => z.map_zone_key === mapKey) : null;
      if (zone) setHoveredZoneId(zone.id);
    };
    const handleLeave = () => setHoveredZoneId(null);

    container.addEventListener("pointerover", handleOver);
    container.addEventListener("pointerleave", handleLeave);
    return () => {
      container.removeEventListener("pointerover", handleOver);
      container.removeEventListener("pointerleave", handleLeave);
    };
  }, [svgMarkup, zones]);

  // Única fuente de verdad para el estado de hover -- ya sea que haya
  // arrancado en el mapa o en una fila de la lista de abajo, este efecto
  // es el que sincroniza la clase `.dim` (ya definida en el <style>
  // embebido del propio SVG) sobre los paths reales. También aplica
  // `.zone-off` (globals.css) a cualquier data-zone del SVG que no
  // matchee el map_zone_key de ninguna zona activa -- gris, sin hover, en
  // vez de desaparecer o seguir mostrando un precio caído.
  useEffect(() => {
    const container = mapRef.current;
    if (!container) return;
    const activeMapKeys = new Set(
      zones.map((z) => z.map_zone_key).filter((key): key is string => key !== null),
    );
    const zoneEls = container.querySelectorAll<SVGElement>("[data-zone]");
    zoneEls.forEach((el) => {
      const mapKey = el.getAttribute("data-zone");
      const isKnown = mapKey !== null && activeMapKeys.has(mapKey);
      el.classList.toggle("zone-off", !isKnown);
      const isOther = hoveredMapKey !== null && mapKey !== hoveredMapKey;
      el.classList.toggle("dim", isKnown && isOther);
    });
  }, [hoveredMapKey, svgMarkup, zones]);

  return (
    <section id="zonas" className="diner-section scroll-mt-20">
      <div className="diner-wrap">
        <div className="diner-sechead">
          <div>
            <p className="font-condensed text-[0.82rem] font-bold tracking-[0.18em] text-[var(--accent-brand)] uppercase">
              Zonas de envío
            </p>
            <h2 className="mt-[10px] font-display text-[clamp(1.7rem,3.6vw,2.5rem)] leading-none tracking-[-0.024em] text-[var(--foreground)]">
              Hasta dónde llegamos
            </h2>
            <p className="mt-2 max-w-[60ch] text-[0.95rem] text-[var(--muted-foreground)]">
              El borde de cada barrio en el mapa es el límite real que figura
              en OpenStreetMap, no un dibujo aproximado. Elegí tu zona al
              hacer el pedido y te mostramos el costo de envío exacto.
            </p>
          </div>
        </div>

        <div className="flex flex-col gap-[22px]">
          <div className="diner-zonemap-frame overflow-x-auto">
            {/* relative: ancla el overlay de polígonos (position: absolute,
                inset-0) al mismo cuadro que ocupa el SVG de fondo, incluyendo
                el min-width de abajo cuando el fondo desborda en mobile. */}
            <div className="relative">
              <div
                ref={mapRef}
                className="[&_svg]:block [&_svg]:h-auto [&_svg]:w-full [&_svg]:min-w-[720px] sm:[&_svg]:min-w-0"
                // Ver comentario de arriba: markup propio, servido por
                // nosotros mismos desde public/, no contenido de usuario.
                dangerouslySetInnerHTML={svgMarkup ? { __html: svgMarkup } : undefined}
                aria-label={`Mapa de las zonas de envío de ${BRAND_NAME}`}
                role="img"
              />
              {/* Overlay de solo lectura para zonas dibujadas a mano
                  (map_polygon) -- el dashboard es quien edita/dibuja, acá
                  solo se pinta el polígono ya guardado. pointer-events-none
                  en el <svg> para no tapar el mapa de fondo en el espacio
                  vacío del overlay; cada <polygon> reactiva pointer-events
                  para hover, mismo hoveredZoneId que ya usa la leyenda. */}
              {polygonZones.length > 0 && (
                <svg
                  viewBox="0 0 1654 966"
                  aria-hidden="true"
                  className="pointer-events-none absolute inset-0 block h-full w-full min-w-[720px] sm:min-w-0"
                >
                  {polygonZones.map((zone) => {
                    const color = getZoneMapColor(zone, mappedZones) ?? "currentColor";
                    const isHovered = hoveredZoneId === zone.id;
                    return (
                      <polygon
                        key={zone.id}
                        points={zone.map_polygon.map(([x, y]) => `${x},${y}`).join(" ")}
                        fill={color}
                        fillOpacity={isHovered ? 0.45 : 0.22}
                        stroke={color}
                        strokeWidth={isHovered ? 3 : 1.5}
                        className="pointer-events-auto cursor-pointer transition-[fill-opacity,stroke-width] duration-150"
                        onPointerEnter={() => setHoveredZoneId(zone.id)}
                        onPointerLeave={() => setHoveredZoneId(null)}
                      />
                    );
                  })}
                </svg>
              )}
            </div>
          </div>

          <ul className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
            {zones.map((zone) => (
              <li
                key={zone.id}
                className="diner-zrow"
                style={
                  (() => {
                    const color = getZoneMapColor(zone, mappedZones);
                    return color ? ({ "--zc": color } as React.CSSProperties) : undefined;
                  })()
                }
                // Estado visual (glow activo / dim de las otras) movido de
                // un style={{opacity}} inline a data-active/data-dim: es
                // diner-zrow (globals.css) el que ahora decide, vía CSS,
                // tanto el dim como el box-shadow con glow de --zc.
                data-active={hoveredZoneId === zone.id ? "true" : undefined}
                data-dim={
                  hoveredZoneId !== null && hoveredZoneId !== zone.id ? "true" : undefined
                }
                onPointerEnter={() => setHoveredZoneId(zone.id)}
                onPointerLeave={() => setHoveredZoneId(null)}
              >
                <span className="diner-zname">{zone.name}</span>
                {zone.description && <span className="diner-zhoods">{zone.description}</span>}
                <span className="diner-zprice">Envío {formatArs(zone.fee)}</span>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </section>
  );
}
