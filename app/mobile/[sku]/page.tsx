"use client";

import { useEffect, useState } from "react";
import { useRouter, useSearchParams, useParams } from "next/navigation";
import "../../styles/ui.css";
import { api } from "@/app/lib/api";


type Item = {
  sku: string;
  family: string;
  stock: number;
  exhib: boolean;
  min: number;
  stockTotal: number;
  status: string;
  empuje: number;
};

export default function MobileSkuPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const params = useParams();

  const storeCode = searchParams.get("store");
  const sku = params.sku as string;

  const [item, setItem] = useState<Item | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
const [message, setMessage] = useState("");
const [originalItem, setOriginalItem] = useState<any>(null);
const [storeName, setStoreName] = useState("");
const [canAccessAdmin, setCanAccessAdmin] = useState(false);
const [prevStock, setPrevStock] = useState<number | null>(null);
const [stockAnim, setStockAnim] = useState<"" | "up" | "down">("");
const [hasMultipleStores, setHasMultipleStores] = useState(false);

  const [menuOpen, setMenuOpen] = useState(false);
const [user, setUser] = useState<{
  name: string;
  email: string;
  role: string;
  image?: string | null; // 👈 agregar esto
} | null>(null);


useEffect(() => {
  fetch("/api/me")
    .then(res => res.json())
    .then(data => {
      if (data?.role) {
        setUser(data);

        if (data.role !== "USER") {
          setCanAccessAdmin(true);
        }
      }
    });
}, []);

useEffect(() => {
  fetch("/api/my-stores")
    .then(res => res.json())
    .then(data => {
      if (Array.isArray(data) && data.length > 1) {
        setHasMultipleStores(true);
      }
    });
}, []);

useEffect(() => {
  if (!storeCode) {
    router.replace("/mobile/select-store");
    return;
  }

  const currentCategory = searchParams.get("category") || "TV";

  fetch(`/api/dashboard/${storeCode}?category=${currentCategory}`)
    .then((res) => res.json())
    .then((json) => {
      setStoreName(json.storeName);
      const found = json.items?.find((i: Item) => i.sku === sku);
      setItem(found);
      setPrevStock(found?.stock ?? null);
      setOriginalItem({
  stock: found?.stock,
  exhib: found?.exhib,
});
      setLoading(false);
    });
}, [storeCode, sku, searchParams]);


  if (loading) return <div className="page-container">Cargando...</div>;
  if (!item) return <div className="page-container">SKU no encontrado</div>;
  const hasChanges =
  originalItem &&
  (item.stock !== originalItem.stock ||
    item.exhib !== originalItem.exhib);

async function saveChanges() {
  setSaving(true);
  setMessage("");

  try {
    const res = await fetch("/api/inventory/update", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        storeCode,
        sku: item!.sku,
        stock: item!.stock,
        exhib: item!.exhib,
      }),
    });

    if (!res.ok) throw new Error("Error");

    setMessage("✅ Guardado correctamente");

    setOriginalItem({
  stock: item!.stock,
  exhib: item!.exhib,
});

    router.replace(`/mobile?store=${storeCode}&category=${searchParams.get("category") || "TV"}`);
  } catch (e) {
    setMessage("❌ Error al guardar");
  }

  setSaving(false);
}


function calculateDerived(stock: number, exhib: boolean, min: number) {
  const stockTotal = stock + (exhib ? 1 : 0);

  let status = "OK";
  if (stockTotal <= min * 0.5) status = "CRITICO";
  else if (stockTotal < min) status = "BAJO";

  const empuje = Math.max(min - stockTotal, 0);

  return { stockTotal, status, empuje };
}


  return (
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
      {storeName || storeCode || "Selecciona tu tienda"}
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
          className="avatar-img"
        />
      ) : user.name ? (
        user.name.charAt(0).toUpperCase()
      ) : (
        user.email.charAt(0).toUpperCase()
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
            padding: "8px ",
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

{/* CARD */}
<div className="card">
  {/* HEADER */}
  <div className="card-header">
    <div className="sku-title">{item.sku}</div>
    <div className={`status-badge status-${item.status.toLowerCase()}`}>
      {item.status}
    </div>
  </div>

  {/* BODY */}
  <div className="card-body">

    <div className="row">
      <span>Familia</span>
      <strong>{item.family}</strong>
    </div>

  <div className="row">
          <span>Stock</span>
          <div className="stock-controls">
<button
  onClick={() => {
    const newStock = Math.max(item.stock - 1, 0);
    const derived = calculateDerived(newStock, item.exhib, item.min);

    if (prevStock !== null) {
      setStockAnim(newStock > prevStock ? "up" : "down");
      setTimeout(() => setStockAnim(""), 400);
    }

    setPrevStock(newStock);
    setItem({ ...item, stock: newStock, ...derived });
  }}
>
  -
</button>


<span className={`stock-value ${stockAnim}`}>
  {item.stock}
</span>


<button
  onClick={() => {
    const newStock = item.stock + 1;
    const derived = calculateDerived(newStock, item.exhib, item.min);

    if (prevStock !== null) {
      setStockAnim(newStock > prevStock ? "up" : "down");
      setTimeout(() => setStockAnim(""), 400);
    }

    setPrevStock(newStock);
    setItem({ ...item, stock: newStock, ...derived });
  }}
>
  +
</button>


          </div>
    </div>

    <div className="row">
<span>Exhibición</span>
          <button
            className={item.exhib ? "btn-on" : "btn-off"}
            onClick={() => {
  const newExhib = !item.exhib;
  const derived = calculateDerived(item.stock, newExhib, item.min);
  setItem({ ...item, exhib: newExhib, ...derived });
}}

          >
            {item.exhib ? "SI" : "NO"}
          </button>
    </div>

        <div className="row">
      <span>Stock Real</span>
      <strong>{item.stockTotal}</strong>
    </div>
    
    <div className="row">
      <span>Mínimo</span>
      <strong>{item.min}</strong>
    </div>



    <div className="row-end">
      <span>Empuje</span>
      <strong>{item.empuje}</strong>
    </div>

  </div>
</div>


      {/* GUARDAR */}
{/* ACTION BUTTONS */}
<div className="mobile-actions">

  <button
    className="btn-secondary"
    onClick={() =>
      router.push(
        `/mobile?store=${storeCode}&category=${
          searchParams.get("category") || "TV"
        }`
      )
    }
  >
    Volver
  </button>

  <button
    className="btn-primary"
    disabled={saving || !hasChanges}
    onClick={saveChanges}
  >
    <svg
      xmlns="http://www.w3.org/2000/svg"
      fill="none"
      viewBox="0 0 24 24"
      strokeWidth={1.5}
      stroke="currentColor"
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="m16.862 4.487 1.687-1.688a1.875 1.875 0 1 1 2.652 2.652L10.582 16.07a4.5 4.5 0 0 1-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 0 1 1.13-1.897l8.932-8.931Zm0 0L19.5 7.125M18 14v4.75A2.25 2.25 0 0 1 15.75 21H5.25A2.25 2.25 0 0 1 3 18.75V8.25A2.25 2.25 0 0 1 5.25 6H10"
      />
    </svg>
    {saving ? "Guardando..." : "Guardar cambios"}
  </button>

</div>

{message && <div className="save-message">{message}</div>}

    </div>
  );
}
