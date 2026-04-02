import type { Metadata } from "next";
import "./styles/ui.css";
import localFont from "next/font/local";

const satoshi = localFont({
  src: [
    {
      path: "../public/fonts/Satoshi-Regular.woff2",
      weight: "400",
      style: "normal",
    },
    {
      path: "../public/fonts/Satoshi-Medium.woff2",
      weight: "500",
      style: "normal",
    },
    {
      path: "../public/fonts/Satoshi-Bold.woff2",
      weight: "700",
      style: "normal",
    },
  ],
  variable: "--font-satoshi",
  display: "swap",
});

export const metadata: Metadata = {
  title: "GoldenApp v0.2.1",
  description:
    "Gestor de Stock e inventario para tiendas, desarrollado por Efza & Orideken.cl",
  manifest: "/manifest.json", // ✅ Mejor usar metadata en vez de <link>
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="es">
      <body className={satoshi.variable}>
        {children}
      </body>
    </html>
  );
}