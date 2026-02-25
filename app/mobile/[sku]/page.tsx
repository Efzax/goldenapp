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
const [isAdmin, setIsAdmin] = useState(false);
const [prevStock, setPrevStock] = useState<number | null>(null);
const [stockAnim, setStockAnim] = useState<"" | "up" | "down">("");


useEffect(() => {
  fetch("/api/me")
    .then(res => res.json())
    .then(user => {
      if (user?.role?.toUpperCase() === "ADMIN") {
        setIsAdmin(true);
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
<button
  className="btn-primary btn-save-fixed"
  disabled={saving || !hasChanges}
  onClick={saveChanges}
>

        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="">
  <path strokeLinecap="round" strokeLinejoin="round" d="m16.862 4.487 1.687-1.688a1.875 1.875 0 1 1 2.652 2.652L10.582 16.07a4.5 4.5 0 0 1-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 0 1 1.13-1.897l8.932-8.931Zm0 0L19.5 7.125M18 14v4.75A2.25 2.25 0 0 1 15.75 21H5.25A2.25 2.25 0 0 1 3 18.75V8.25A2.25 2.25 0 0 1 5.25 6H10" />
</svg>
 {saving ? "Guardando..." : "Guardar cambios"}
      </button>
      {message && <div className="save-message">{message}</div>}

    </div>
  );
}
