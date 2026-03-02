"use client";

import { ReactNode, useEffect, useState } from "react";
import { MobileStoreProvider, useMobileStore } from "./MobileStoreContext";
import "../styles/ui.css";

type User = {
  name?: string;
  email?: string;
  role?: string;
  image?: string | null;
};

export default function MobileLayout({
  children,
}: {
  children: ReactNode;
}) {
  return (
    <MobileStoreProvider>
      <MobileLayoutContent>{children}</MobileLayoutContent>
    </MobileStoreProvider>
  );
}

function MobileLayoutContent({
  children,
}: {
  children: ReactNode;
}) {
  const { storeName } = useMobileStore();

  const [user, setUser] = useState<User | null>(null);
  const [menuOpen, setMenuOpen] = useState(false);
  const [hasMultipleStores, setHasMultipleStores] = useState(false);

  // 🔹 Cargar usuario
  useEffect(() => {
    fetch("/api/me", { cache: "no-store" })
      .then((res) => {
        if (!res.ok) return null;
        return res.json();
      })
      .then((data) => {
        if (data) setUser(data);
      })
      .catch(() => setUser(null));
  }, []);

  // 🔹 Saber si tiene múltiples tiendas
  useEffect(() => {
    fetch("/api/my-stores")
      .then((res) => res.json())
      .then((data) => {
        if (Array.isArray(data) && data.length > 1) {
          setHasMultipleStores(true);
        }
      })
      .catch(() => setHasMultipleStores(false));
  }, []);

  const avatarInitial =
    user?.name?.charAt(0) ||
    user?.email?.charAt(0) ||
    "?";

  return (
    <div className="page-container">
      {/* HEADER GLOBAL */}
      <div className="mobile-header">
        <div className="mobile-header-left">
          {user?.name && (
            <div className="mobile-greeting">
              Hola, {user.name}
            </div>
          )}

          <div className="mobile-store-title">
            {storeName || ""}
          </div>
        </div>

        {user && (
          <div style={{ position: "relative" }}>
            <div
              className="avatar"
              style={{ cursor: "pointer" }}
              onClick={() => setMenuOpen(!menuOpen)}
            >
              {user.image ? (
                <img
                  src={user.image}
                  alt="Avatar"
                  width={48}
                  height={48}
                />
              ) : (
                avatarInitial.toUpperCase()
              )}
            </div>

            {menuOpen && (
              <div
                style={{
                  position: "absolute",
                  top: "60px",
                  right: 0,
                  background: "white",
                  border: "1px solid var(--color-secundario)",
                  borderRadius: "10px",
                  boxShadow: "0 10px 30px rgba(0,0,0,0.1)",
                  minWidth: "160px",
                  zIndex: 100,
                  padding: "8px",
                }}
              >
                {hasMultipleStores && (
                  <div
                    className="mobile-menu-item"
                    onClick={() => {
                      setMenuOpen(false);
                      location.href = "/mobile/select-store";
                    }}
                  >
                    Mis Tiendas
                  </div>
                )}

                {(user.role === "ADMIN" ||
                  user.role === "SUPERVISOR") && (
                  <div
                    className="mobile-menu-item"
                    onClick={() => {
                      setMenuOpen(false);
                      location.href = "/admin";
                    }}
                  >
                    Dashboard
                  </div>
                )}

                <div
                  className="mobile-menu-item"
                  onClick={() => {
                    setMenuOpen(false);
                    location.href = "/mobile/profile";
                  }}
                >
                  Perfil
                </div>

                <div
                  className="mobile-logout-btn"
                  onClick={async () => {
                    setMenuOpen(false);
                    await fetch("/api/logout", {
                      method: "POST",
                    });
                    location.href = "/login";
                  }}
                >
                  Logout
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* CONTENIDO */}
      <main className="mobile-content">{children}</main>

      {/* FOOTER */}
      <footer className="mobile-footer">
        Desarrollado y creado por Efza y Orideken.cl
      </footer>
    </div>
  );
}