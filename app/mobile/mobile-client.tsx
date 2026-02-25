"use client";

import { useEffect, useState } from "react";
import { useRouter, useSearchParams, usePathname } from "next/navigation";
import {
  CheckCircleIcon,
  XCircleIcon,
  TvIcon,
} from "@heroicons/react/24/outline";
import "../styles/ui.css";

type Item = {
  sku: string;
  family: string;
  stock: number;
  exhib: boolean;
  status: string;
};

export default function MobileClient() {
  const [data, setData] = useState<Item[]>([]);
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState<"TV" | "AV">("TV");
  const [storeName, setStoreName] = useState<string>("");
  const [storeCount, setStoreCount] = useState(1);
const [isAdmin, setIsAdmin] = useState(false);


  const router = useRouter();
  const searchParams = useSearchParams();
  const pathname = usePathname();
  

  // Verificar sesión
/*useEffect(() => {
  fetch("/api/me")
    .then((res) => {
      if (res.status === 401) {
        router.replace("/mobile/login");
        return null;
      }
      return res.json();
    })
    .then((json) => {
      if (json?.role === "ADMIN") {
        setIsAdmin(true);
      }
    });
}, [router]);
*/


  const storeCode = searchParams.get("store");

  // Cargar inventario
  useEffect(() => {
    if (!storeCode && pathname === "/mobile") {
      router.replace("/mobile/select-store");
      return;
    }

    if (storeCode) {
      fetch(`/api/dashboard/${storeCode}?category=${category}`, { cache: "no-store" })
        .then((res) => res.json())
        .then((json) => {
  setStoreName(json.storeName);
  setData(json.items);
});

    }
  }, [storeCode, pathname, category, router]);

useEffect(() => {
  if (!storeCode) return;

  fetch(`/api/store/${storeCode}`)
    .then((res) => res.json())
    .then((json) => {
      if (json.name) setStoreName(json.name);
    })
    .catch(() => setStoreName(""));
}, [storeCode]);


  const statusDotClass = (status: string) => {
    if (status === "OK") return "dot-ok";
    if (status === "BAJO") return "dot-bajo";
    if (status === "CRITICO") return "dot-critico";
    return "";
  };

  const filtered = data.filter((item) =>
    item.sku.toLowerCase().includes(search.toLowerCase())
  );

  const grouped = filtered.reduce((acc: any, item) => {
    acc[item.family] = acc[item.family] || [];
    acc[item.family].push(item);
    return acc;
  }, {});

  return (
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


  {isAdmin && (
    <button
      className="btn-dash"
      onClick={() => location.href = "/admin"}
    >
      Dashboard
    </button>
  )}

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

      <div className="page-title">{storeName || storeCode}</div>



      {/* BOTONES TV / AV */}
      <div className="category-tabs">
        <button
          className={category === "TV" ? "tab active" : "tab"}
          onClick={() => setCategory("TV")}
        >
          TV
        </button>
        <button
          className={category === "AV" ? "tab active" : "tab"}
          onClick={() => setCategory("AV")}
        >
          AV
        </button>
      </div>

      {/* BUSCADOR */}
      <input
        className="input"
        placeholder="Buscar SKU..."
        value={search}
        onChange={(e) => setSearch(e.target.value)}
      />

      {/* LISTA */}
   
      {Object.keys(grouped).map((family) => (
        <div key={family}><div className="card-dots">
          <div className="card-header-dots">
          <div className="family-title">{family}</div></div>

          {grouped[family].map((item: Item) => (
  <div key={item.sku} className="card-body-dots">
    <a
      href={`/mobile/${item.sku}?store=${storeCode}&category=${category}`}
      className="sku-row"
    >
      <div className={`status-dot ${statusDotClass(item.status)}`} />

      <div className="sku-info">
        <div className="sku-text">{item.sku}</div>

        <div className="sku-icons">
          {item.stock > 0 ? (
            <CheckCircleIcon className="icon icon-ok" />
          ) : (
            <XCircleIcon className="icon icon-zero" />
          )}

          {item.exhib && <TvIcon className="icon icon-tv" />}

          <span className="stock-number">{item.stock}</span>
        </div>
      </div>
    </a>
  </div>
))}</div>
        </div>
      ))}
    </div>
  );
}
