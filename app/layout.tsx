import type React from "react";
import type { Metadata, Viewport } from "next";
import { archivoBlack, barlow, barlowCondensed, courierPrime } from "@/lib/fonts";
import { BRAND_NAME } from "@/lib/brand";
import "./globals.css";

export const metadata: Metadata = {
  title: BRAND_NAME,
  description: `Pedí tu burger favorita de ${BRAND_NAME} y coordiná el retiro o la entrega por WhatsApp.`,
  icons: {
    icon: "/favicon.png?v=4",
    apple: "/favicon.png?v=4",
  },
};

export const viewport: Viewport = {
  viewportFit: "cover",
  themeColor: "#08090c",
  // Sin esto, iOS Safari (y Chrome Android) solo encogen el "visual
  // viewport" al abrir el teclado, no el "layout viewport" -- entonces
  // 100dvh/max-h-[85dvh] (drawer.tsx) y el footer `position: fixed` del
  // carrito (cart-drawer.tsx, Total + Enviar pedido) siguen calculados
  // contra el alto SIN teclado, y el input enfocado termina scrolleado
  // fuera de vista detrás del header mientras el footer queda flotando en
  // el medio de la pantalla (bug real: paso 2 "Tus datos", reportado en
  // iPhone 15). resizes-content fuerza al browser a tratar el teclado como
  // si redujera el viewport de verdad, así que dvh/fixed se recalculan
  // contra el alto visible real. Soportado desde Safari 17.4 / Chrome 108;
  // en versiones más viejas simplemente no hace nada (no hay regresión,
  // solo no arregla el bug ahí).
  interactiveWidget: "resizes-content",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="es"
      className={`dark ${archivoBlack.variable} ${barlowCondensed.variable} ${barlow.variable} ${courierPrime.variable}`}
      suppressHydrationWarning
    >
      {/* diner-body reserva el padding-bottom para la barra fija del
          carrito (--rail-h) -- estructural, no color. Tipografía "diner"
          (font-body = Barlow) restaurada por pedido del dueño; los colores
          del re-estilo a jebbs-dashboard (--foreground, etc.) quedan. */}
      <body className="diner-body font-body antialiased min-h-screen text-[var(--foreground)]">
        {children}
      </body>
    </html>
  );
}
