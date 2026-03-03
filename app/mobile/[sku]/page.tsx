"use client";
export const dynamic = "force-dynamic";

import { useEffect, useState } from "react";
import { useRouter, useSearchParams, useParams } from "next/navigation";
import { useMobileStore } from "../MobileStoreContext";
import "../../styles/ui.css";

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

  const { setStoreName } = useMobileStore();

  const storeCode = searchParams.get("store");
  const sku = params.sku as string;
  const category = searchParams.get("category") || "TV";

  const [item, setItem] = useState<Item | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");
  const [originalItem, setOriginalItem] = useState<any>(null);
  const [prevStock, setPrevStock] = useState<number | null>(null);
  const [stockAnim, setStockAnim] = useState<"" | "up" | "down">("");

  useEffect(() => {
    if (!storeCode) {
      router.replace("/mobile/select-store");
      return;
    }

    fetch(`/api/dashboard/${storeCode}?category=${category}`, {
      cache: "no-store",
    })
      .then((res) => res.json())
      .then((json) => {
        // ✅ Enviar nombre de tienda al layout
        setStoreName(json.storeName || "");

        const found = json.items?.find((i: Item) => i.sku === sku);
        setItem(found);
        setPrevStock(found?.stock ?? null);
        setOriginalItem({
          stock: found?.stock,
          exhib: found?.exhib,
        });
        setLoading(false);
      });
  }, [storeCode, sku, category, router, setStoreName]);

if (loading) return <div>Cargando...</div>;
if (!item) return <div>SKU no encontrado</div>;

  const hasChanges =
    originalItem &&
    (item.stock !== originalItem.stock ||
      item.exhib !== originalItem.exhib);

  function calculateDerived(stock: number, exhib: boolean, min: number) {
    const stockTotal = stock + (exhib ? 1 : 0);

    let status = "OK";
    if (stockTotal <= min * 0.5) status = "CRITICO";
    else if (stockTotal < min) status = "BAJO";

    const empuje = Math.max(min - stockTotal, 0);

    return { stockTotal, status, empuje };
  }

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

      setOriginalItem({
        stock: item!.stock,
        exhib: item!.exhib,
      });

      router.replace(`/mobile?store=${storeCode}&category=${category}`);
    } catch {
      setMessage("❌ Error al guardar");
    }

    setSaving(false);
  }

  return (
    <div>
      {/* CARD */}
      <div className="card">
        {/* HEADER */}
        <div className="card-header">
          <div className="sku-title">{item.sku}</div>
          <div
            className={`status-badge status-${item.status.toLowerCase()}`}
          >
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
                  const derived = calculateDerived(
                    newStock,
                    item.exhib,
                    item.min
                  );

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
                  const derived = calculateDerived(
                    newStock,
                    item.exhib,
                    item.min
                  );

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
                const derived = calculateDerived(
                  item.stock,
                  newExhib,
                  item.min
                );
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

      {/* ACTION BUTTONS */}
      <div className="mobile-actions">
        <button
          className="btn-secondary"
          onClick={() =>
            router.push(
              `/mobile?store=${storeCode}&category=${category}`
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
          {saving ? "Guardando..." : "Guardar cambios"}
        </button>
      </div>

      {message && <div className="save-message">{message}</div>}
    </div>
  );
}