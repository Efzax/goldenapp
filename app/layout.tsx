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
  title: "GoldenApp v0.1.9",
  description: "Gestor de Stock e iventario para tiendas, desarrollado por Efza & Orideken.cl",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="es">
      <head>
        <link rel="manifest" href="/manifest.json" />
<link rel="apple-touch-icon" href="/apple-icon.png" />
</head>

      <body className={satoshi.variable}>
        {children}
      </body>
    </html>
  );
}
