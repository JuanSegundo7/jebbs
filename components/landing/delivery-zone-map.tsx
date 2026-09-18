"use client";

import { useEffect, useRef, useState } from "react";

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
// Los nombres de zona y el costo de envío son de ejemplo -- se mantiene
// el placeholder "a confirmar" ya usado en el resto de la página.
const ZONES = [
  { zone: "z1", name: "City Bell", hoods: "Casco y alrededores", fee: "$1.500", color: "#F2B21C" },
  { zone: "z2", name: "Gonnet", hoods: "Zona centro", fee: "$1.500", color: "#E2622C" },
  { zone: "z3", name: "Ringuelet", hoods: "Y alrededores", fee: "$2.000", color: "#A3331F" },
  { zone: "z4", name: "La Plata", hoods: "Casco urbano", fee: "$2.500", color: "#6E2650" },
] as const;

export function DeliveryZoneMap() {
  const mapRef = useRef<HTMLDivElement>(null);
  const [svgMarkup, setSvgMarkup] = useState<string | null>(null);
  const [hoveredZone, setHoveredZone] = useState<string | null>(null);

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
  useEffect(() => {
    const container = mapRef.current;
    if (!container || !svgMarkup) return;

    const handleOver = (e: Event) => {
      const target = (e.target as Element).closest("[data-zone]");
      const zone = target?.getAttribute("data-zone");
      if (zone) setHoveredZone(zone);
    };
    const handleLeave = () => setHoveredZone(null);

    container.addEventListener("pointerover", handleOver);
    container.addEventListener("pointerleave", handleLeave);
    return () => {
      container.removeEventListener("pointerover", handleOver);
      container.removeEventListener("pointerleave", handleLeave);
    };
  }, [svgMarkup]);

  // Única fuente de verdad para el estado de hover -- ya sea que haya
  // arrancado en el mapa o en una fila de la lista de abajo, este efecto
  // es el que sincroniza la clase `.dim` (ya definida en el <style>
  // embebido del propio SVG) sobre los paths reales.
  useEffect(() => {
    const container = mapRef.current;
    if (!container) return;
    const zones = container.querySelectorAll<SVGElement>("[data-zone]");
    zones.forEach((el) => {
      const isOther = hoveredZone !== null && el.getAttribute("data-zone") !== hoveredZone;
      el.classList.toggle("dim", isOther);
    });
  }, [hoveredZone, svgMarkup]);

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
            <div
              ref={mapRef}
              className="[&_svg]:block [&_svg]:h-auto [&_svg]:w-full [&_svg]:min-w-[720px] sm:[&_svg]:min-w-0"
              // Ver comentario de arriba: markup propio, servido por
              // nosotros mismos desde public/, no contenido de usuario.
              dangerouslySetInnerHTML={svgMarkup ? { __html: svgMarkup } : undefined}
              aria-label="Mapa de las zonas de envío de Jebbs Burger's, desde City Bell hasta el casco urbano de La Plata"
              role="img"
            />
          </div>

          <ul className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
            {ZONES.map((zone) => (
              <li
                key={zone.zone}
                className="diner-zrow"
                style={{ "--zc": zone.color } as React.CSSProperties}
                // Estado visual (glow activo / dim de las otras) movido de
                // un style={{opacity}} inline a data-active/data-dim: es
                // diner-zrow (globals.css) el que ahora decide, vía CSS,
                // tanto el dim como el box-shadow con glow de --zc.
                data-active={hoveredZone === zone.zone ? "true" : undefined}
                data-dim={
                  hoveredZone !== null && hoveredZone !== zone.zone ? "true" : undefined
                }
                onPointerEnter={() => setHoveredZone(zone.zone)}
                onPointerLeave={() => setHoveredZone(null)}
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
