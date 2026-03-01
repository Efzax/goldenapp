"use client";

import "../styles/ui.css";

export default function MobileLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="mobile-layout">
      <main className="mobile-content">
        {children}
      </main>

      <footer className="mobile-footer">
        Desarrollado y creado por Efza y Orideken.cl
      </footer>
    </div>
  );
}