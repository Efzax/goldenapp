"use client";

import type { ReactNode } from "react";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import styles from "./dashboard-layout.module.css";
import "../styles/ui.css";

type User = {
  name?: string;
  email?: string;
  role?: string;
  image?: string | null;
};

export default function DashboardLayout({ children }: { children: ReactNode }) {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [menuOpen, setMenuOpen] = useState(false);
  const [hasMultipleStores, setHasMultipleStores] = useState(false);

  useEffect(() => {
    fetch("/api/me", { cache: "no-store" })
      .then((res) => {
        if (res.status === 401) {
          router.replace("/login");
          return null;
        }
        if (!res.ok) return null;
        return res.json();
      })
      .then((data) => {
        if (data) setUser(data);
      })
      .catch(() => setUser(null));
  }, [router]);

  useEffect(() => {
    fetch("/api/my-stores")
      .then((res) => {
        if (res.status === 401) {
          router.replace("/login");
          return [];
        }
        return res.json();
      })
      .then((data) => {
        if (Array.isArray(data) && data.length > 1) {
          setHasMultipleStores(true);
        } else {
          setHasMultipleStores(false);
        }
      })
      .catch(() => setHasMultipleStores(false));
  }, [router]);

  const avatarInitial = user?.name?.charAt(0) || user?.email?.charAt(0) || "?";

  return (
    <div className="mobile-layout">
      <div className="app-badge">
        <div className={`app-badge-inner ${styles.headerWide}`}>GOLDENAPP</div>
      </div>

      <div className="mobile-header">
        <div className={`mobile-header-inner ${styles.headerWide}`}>
          <div className="mobile-header-left">
            {user?.name ? <div className="mobile-greeting">Hola, {user.name}</div> : null}
            <div className="mobile-store-title">Summary Store Dashboard</div>
          </div>

          <div className={styles.avatarWrap}>
            <div className="avatar" style={{ cursor: "pointer" }} onClick={() => setMenuOpen((current) => !current)}>
              {user?.image ? <img src={user.image} alt="Avatar" /> : avatarInitial.toUpperCase()}
            </div>

            {menuOpen ? (
              <div className={styles.avatarMenu}>
                <div
                  className="mobile-menu-item"
                  onClick={() => {
                    setMenuOpen(false);
                    router.push("/mobile/select-store");
                  }}
                >
                  Mis Tiendas
                </div>

                {(user?.role === "ADMIN" || user?.role === "SUPERVISOR") ? (
                  <div
                    className="mobile-menu-item"
                    onClick={() => {
                      setMenuOpen(false);
                      router.push("/admin");
                    }}
                  >
                    Admin
                  </div>
                ) : null}

                <div
                  className="mobile-menu-item"
                  onClick={() => {
                    setMenuOpen(false);
                    router.push("/dashboard");
                  }}
                >
                  Dashboard
                </div>

                <div
                  className="mobile-menu-item"
                  onClick={() => {
                    setMenuOpen(false);
                    router.push("/mobile/profile");
                  }}
                >
                  Perfil
                </div>

                <div
                  className="mobile-logout-btn"
                  onClick={async () => {
                    setMenuOpen(false);
                    await fetch("/api/logout", { method: "POST" });
                    location.href = "/login";
                  }}
                >
                  Logout
                </div>
              </div>
            ) : null}
          </div>
        </div>
      </div>

      <div className="page-container">
        <main className={`mobile-content ${styles.dashboardContent}`}>{children}</main>
      </div>

      <footer className="mobile-footer">Desarrollado y creado por Efza y Orideken.cl</footer>
    </div>
  );
}
