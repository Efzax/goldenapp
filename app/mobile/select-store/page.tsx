"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import "../../styles/ui.css";
import { api } from "@/app/lib/api";

type Store = {
  id: string;
  name: string;
  code: string;
};

export default function SelectStorePage() {
  const [stores, setStores] = useState<Store[]>([]);
  const router = useRouter();
  const [user, setUser] = useState<{
  name: string;
  email: string;
  role: string;
} | null>(null);

const [menuOpen, setMenuOpen] = useState(false);



useEffect(() => {
  api<any[]>("/api/my-stores")
    .then((json) => {
      setStores(json);

      if (json.length === 1) {
        router.push(`/mobile?store=${json[0].code}`);
      }
    })
    .catch((err) => {
      console.error(err);
    });
}, [router]);

useEffect(() => {
  fetch("/api/me")
    .then(res => res.json())
    .then(data => {
      if (data?.role) {
        setUser(data);
      }
    });
}, []);

  return (
    <div style={{ padding: 20, fontFamily: "system-ui" }}>
     
     <div className="page-container">
      {/* HEADER */}
<div className="mobile-header">
  <div className="mobile-header-left">
    {user && (
      <div className="mobile-greeting">
        Hola, {user.name}
      </div>
    )}

    <div className="mobile-store-title">
      Selecciona tu tienda
    </div>
  </div>

  {user && (
    <div style={{ position: "relative" }}>
      <div
        className="avatar"
        style={{ cursor: "pointer" }}
        onClick={() => setMenuOpen(!menuOpen)}
      >
        {user.name
          ? user.name.charAt(0).toUpperCase()
          : user.email.charAt(0).toUpperCase()}
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
            padding: "8px ",
          }}
        >
          {(user.role === "ADMIN" || user.role === "SUPERVISOR") && (
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
            className="mobile-logout-btn"
            onClick={async () => {
              setMenuOpen(false);
              await fetch("/api/logout", { method: "POST" });
              location.href = "/mobile/login";
            }}
          >
            Logout
          </div>
        </div>
      )}
    </div>
  )}
</div>
      {stores.map((store) => (
        <button
          key={store.id}
          onClick={() => router.push(`/mobile?store=${store.code}`)}
          style={{
            display: "block",
            width: "100%",
            padding: "12px",
            marginTop: "10px",
            borderRadius: "8px",
            border: "1px solid #cbd5e1",
            background: "white",
            fontSize: "16px",
          }}
        >
          {store.name}
        </button>
      ))}
    </div></div>
  );
}
