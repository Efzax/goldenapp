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
        <button
          className="btn-logout"
          onClick={async () => {
            await fetch("/api/logout", { method: "POST" });
            location.href = "/mobile/login";
          }}
        >
          Logout
        </button>
      </div>
      <div className="page-title">SELECCIONA TU TIENDA</div>
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
