import { Archivo_Black, Barlow, Barlow_Condensed, Courier_Prime } from "next/font/google";

// El dueño prefirió recuperar el sistema tipográfico "diner" completo por
// encima de la tipografía nativa del re-estilo a jebbs-dashboard -- los
// colores (naranja/frío, --accent-brand/--surface-*/--hairline) SÍ quedan
// del re-estilo, la tipografía vuelve a esta pareja de 4 familias, cada una
// con un rol fijo:
//   - Archivo Black  -> display (h1 del hero, h2 de headers de sección).
//   - Barlow Condensed (600/700) -> todo lo "de marca": nav, nombres de
//     producto, precios, headers de categoría, chips, labels. Mayúscula +
//     tracking generoso.
//   - Barlow (400/600, itálica) -> texto de cuerpo/descripciones.
//   - Courier Prime (400/700) -> vestigios del "ticket" del checkout donde
//     todavía se use font-ticket.
export const archivoBlack = Archivo_Black({
  subsets: ["latin"],
  weight: "400",
  variable: "--font-archivo-black",
  display: "swap",
  preload: false,
});

export const barlowCondensed = Barlow_Condensed({
  subsets: ["latin"],
  weight: ["600", "700"],
  variable: "--font-barlow-condensed",
  display: "swap",
  preload: false,
});

export const barlow = Barlow({
  subsets: ["latin"],
  weight: ["400", "600"],
  style: ["normal", "italic"],
  variable: "--font-barlow",
  display: "swap",
  preload: false,
});

export const courierPrime = Courier_Prime({
  subsets: ["latin"],
  weight: ["400", "700"],
  variable: "--font-courier-prime",
  display: "swap",
  preload: false,
});
