import { Geist_Mono, Pacifico } from "next/font/google";

// Identidad real de jebbs-dashboard (repo hermano, mismo negocio): sistema
// tipográfico minimalista, no un set de 4 familias temáticas. --font-sans
// (definida en globals.css) es la pila NATIVA del sistema operativo
// (-apple-system/Segoe UI/etc, cero webfont para texto normal) -- Pacifico
// queda reservado solo para la palabra de marca "Jebbs" (header/hero/footer),
// y Geist Mono para números tabulares (precios, contadores). Esta pareja es
// la que WU1 tenía originalmente, copiada verbatim de jebbs-dashboard, antes
// del pase "diner" (Archivo Black/Barlow Condensed/Barlow/Courier Prime) que
// este re-estilo retira.
export const geistMono = Geist_Mono({
  subsets: ["latin"],
  variable: "--font-geist-mono",
  display: "swap",
  preload: false,
});

export const pacifico = Pacifico({
  subsets: ["latin"],
  weight: "400",
  variable: "--font-pacifico",
  display: "swap",
  preload: false,
});
