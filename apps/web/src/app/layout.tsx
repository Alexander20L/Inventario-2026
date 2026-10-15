import type { Metadata } from "next";
import "./globals.css";
import "./catalog.css";

export const metadata: Metadata = {
  title: {
    default: "EN STOCK · Tu tienda, en orden",
    template: "%s · EN STOCK",
  },
  description: "Administra tu tienda, inventario y equipo desde un solo lugar.",
  robots: { index: false, follow: false },
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="es">
      <body>{children}</body>
    </html>
  );
}
