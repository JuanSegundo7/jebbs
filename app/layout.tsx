import type React from "react";
import type { Metadata } from "next";
import { archivoBlack, barlow, barlowCondensed, courierPrime } from "@/lib/fonts";
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
      className={`dark ${archivoBlack.variable} ${barlowCondensed.variable} ${barlow.variable} ${courierPrime.variable}`}
      suppressHydrationWarning
    >
      <body className="diner-body font-body antialiased min-h-screen text-[var(--cream)]">
        {children}
      </body>
    </html>
  );
}
