import type React from "react";
import type { Metadata } from "next";
import { geistMono, pacifico } from "@/lib/fonts";
import "./globals.css";

export const metadata: Metadata = {
  title: "Jebbs Burger's",
  description: "Pedí tu burger favorita de Jebbs Burger's y coordiná el retiro o la entrega por WhatsApp.",
  icons: {
    icon: "/jebbs.jpg",
    apple: "/jebbs.jpg",
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
      className={`dark ${geistMono.variable} ${pacifico.variable}`}
      suppressHydrationWarning
    >
      {/* diner-body queda mientras el re-estilo avanza sección por sección
          (reserva el padding-bottom para la barra fija del carrito, --rail-h
          -- eso es estructural, no color); font-sans/text-foreground ya
          apuntan a la identidad real del dashboard. */}
      <body className="diner-body font-sans antialiased min-h-screen text-[var(--foreground)]">
        {children}
      </body>
    </html>
  );
}
