import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Dacia DPRC - Simulador de cuota",
  description: "Simulador de cuota para Dacia Preference DPRC con fórmula balloon",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="es">
      <body style={{ margin: 0, padding: 0 }}>{children}</body>
    </html>
  );
}
