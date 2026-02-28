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
      <div className="page-header">
<button className="btn-back" onClick={() => router.back()}>
  <svg
    xmlns="http://www.w3.org/2000/svg"
    fill="none"
    viewBox="0 0 24 24"
    strokeWidth={1.5}
    stroke="currentColor"
    className="w-6 h-6 shrink-0"
  >
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      d="M15.75 19.5 8.25 12l7.5-7.5"
    />
  </svg>
</button>
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
          padding: "8px 0",
        }}
      >
        {(user.role === "ADMIN" || user.role === "SUPERVISOR") && (
          <div
            style={{ padding: "10px 16px", cursor: "pointer" }}
            onClick={() => {
              setMenuOpen(false);
              location.href = "/admin";
            }}
          >
            Dashboard
          </div>
        )}

        <div
          style={{
            padding: "10px 16px",
            cursor: "pointer",
            color: "red",
          }}
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
      <div className="page-title">
  {user && (
    <div style={{ fontSize: "14px", color: "var(--color-font2)" }}>
      Hola {user.name}, por favor
    </div>
  )}

  <div>Selecciona tu tienda</div>
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
