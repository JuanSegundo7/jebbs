import { Archivo_Black, Barlow, Barlow_Condensed, Courier_Prime } from "next/font/google";

// Identidad "diner" de Jebbs Burger's, extraída del HTML real del sitio de
// referencia (jebbs-burgers.vercel.app). Cuatro familias, cada una con un
// rol fijo -- no se mezclan libremente:
//   - Archivo Black  -> display (h1 del hero, h2 de headers de sección).
//   - Barlow Condensed (600/700) -> todo lo "de marca": nav, nombres de
//     producto, precios, headers de categoría, chips, labels. Siempre
//     mayúscula + tracking generoso en el sitio de consumo, no acá.
//   - Barlow (400/600, itálica) -> texto de cuerpo/descripciones.
//   - Courier Prime (400/700) -> solo la sección de checkout (ticket).
// Reemplazan a Geist Mono + Pacifico de la fase WU1: esa pareja pertenecía
// al sistema glass/iOS genérico que este pase retira por completo.
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
