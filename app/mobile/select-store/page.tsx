"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import "../../styles/ui.css";

type Store = {
  id: string;
  name: string;
  code: string;
};

export default function SelectStorePage() {
  const [stores, setStores] = useState<Store[]>([]);
  const router = useRouter();

  useEffect(() => {
    fetch("/api/my-stores")
      .then((res) => res.json())
      .then((json) => {
        setStores(json);

        if (json.length === 1) {
          router.push(`/mobile?store=${json[0].code}`);
        }
      });
  }, []);

  return (
    <div style={{ padding: 20, fontFamily: "system-ui" }}>
     
      {/* HEADER */}
      <div className="page-header">
        <button className="btn-back" onClick={() => history.back()}>
          
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
      <div className="page-title">Selecciona tu tienda</div>
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
    </div>
  );
}
