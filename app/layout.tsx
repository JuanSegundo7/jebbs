import type React from "react";
import type { Metadata } from "next";
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
