"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import "../../styles/ui.css";

type ProductOption = {
  id: string;
  sku: string;
  name: string;
  family: string;
  category: string;
  inventoryCount: number;
  classificationCount: number;
};

type StoreConflict = {
  storeId: string;
  storeName: string;
  storeCode: string;
  externalCode: string | null;
  chainName: string;
};

type SkuPreview = {
  source: {
    sku: string;
    name: string;
    family: string;
    category: string;
    inventoryCount: number;
    classificationCount: number;
  };
  destination: {
    sku: string;
    name: string;
    family: string;
    category: string;
    inventoryCount: number;
    classificationCount: number;
  } | null;
  mode: "rename" | "merge";
  canApply: boolean;
  affected: {
    storeCount: number;
    inventoryCount: number;
    classificationCount: number;
  };
  conflicts: {
    inventory: StoreConflict[];
    classifications: StoreConflict[];
  };
  message: string;
};

export default function AdminProductsPage() {
  const router = useRouter();
  const [search, setSearch] = useState("");
  const [selectedProductSku, setSelectedProductSku] = useState("");
  const [products, setProducts] = useState<ProductOption[]>([]);
  const [fromSku, setFromSku] = useState("");
  const [toSku, setToSku] = useState("");
  const [preview, setPreview] = useState<SkuPreview | null>(null);
  const [loadingPreview, setLoadingPreview] = useState(false);
  const [applying, setApplying] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  useEffect(() => {
    fetch("/api/me").then(async (res) => {
      if (res.status === 401) {
        router.replace("/login");
        return;
      }

      const user = await res.json();
      if (user.role !== "ADMIN") {
        router.replace("/admin");
      }
    });
  }, [router]);

  useEffect(() => {
    const controller = new AbortController();

    if (search.trim().length < 2) {
      return;
    }

    if (search.trim().toUpperCase() === selectedProductSku) {
      return;
    }

    fetch(`/api/admin/products/sku-rename?q=${encodeURIComponent(search)}`, {
      signal: controller.signal,
    })
      .then((res) => res.json())
      .then((data) => {
        if (Array.isArray(data)) {
          setProducts(data);
        }
      })
      .catch((err) => {
        if (err.name !== "AbortError") {
          setError("No se pudo buscar productos");
        }
      });

    return () => controller.abort();
  }, [search, selectedProductSku]);

  function selectProduct(product: ProductOption) {
    setFromSku(product.sku);
    setSelectedProductSku(product.sku);
    setSearch(product.sku);
    setProducts([]);
    setPreview(null);
    setError("");
    setSuccess("");
  }

  async function handlePreview() {
    setError("");
    setSuccess("");
    setPreview(null);
    setLoadingPreview(true);

    const res = await fetch("/api/admin/products/sku-rename", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ fromSku, toSku }),
    });
    const data = await res.json();

    setLoadingPreview(false);

    if (!res.ok) {
      setError(data.error || "No se pudo generar la previsualizacion");
      return;
    }

    setPreview(data);
  }

  async function handleApply() {
    if (!preview?.canApply) return;

    const confirmed = window.confirm(
      `Confirmas cambiar ${preview.source.sku} por ${toSku.trim().toUpperCase()}?`
    );

    if (!confirmed) return;

    setApplying(true);
    setError("");
    setSuccess("");

    const res = await fetch("/api/admin/products/sku-rename", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ fromSku, toSku }),
    });
    const data = await res.json();

    setApplying(false);

    if (!res.ok) {
      setError(data.error || "No se pudo aplicar el cambio");
      return;
    }

    setSuccess(data.message || "SKU actualizado correctamente");
    setFromSku(toSku.trim().toUpperCase());
    setSearch(toSku.trim().toUpperCase());
    setToSku("");
    setPreview(null);
  }

  const inventoryConflicts = preview?.conflicts.inventory ?? [];
  const classificationConflicts = preview?.conflicts.classifications ?? [];

  return (
    <div className="page-dashboard">
      <h2 className="page-title">Productos / SKU</h2>

      <section className="sku-tools-card">
        <div>
          <h3>Renombrar SKU masivamente</h3>
          <p>
            Busca el SKU cargado por error, escribe el SKU correcto y revisa la
            previsualizacion antes de aplicar. Si hay conflictos por tienda, el
            cambio queda bloqueado.
          </p>
        </div>

        <div className="sku-rename-grid">
          <div className="sku-field-group">
            <label>SKU origen</label>
            <input
              className="input"
              value={search}
              onChange={(e) => {
                const value = e.target.value;
                setSearch(value);
                setSelectedProductSku("");
                setFromSku(value.trim().toUpperCase());
                if (value.trim().length < 2) {
                  setProducts([]);
                }
                setPreview(null);
              }}
              placeholder="Buscar SKU actual..."
            />

            {products.length > 0 && (
              <div className="sku-search-results">
                {products.map((product) => (
                  <button
                    key={product.id}
                    type="button"
                    onClick={() => selectProduct(product)}
                  >
                    <strong>{product.sku}</strong>
                    <span>
                      {product.family} - {product.category} -{" "}
                      {product.inventoryCount} tiendas
                    </span>
                  </button>
                ))}
              </div>
            )}
          </div>

          <div className="sku-field-group">
            <label>SKU destino</label>
            <input
              className="input"
              value={toSku}
              onChange={(e) => {
                setToSku(e.target.value.trim().toUpperCase());
                setPreview(null);
              }}
              placeholder="SKU correcto..."
            />
          </div>
        </div>

        <div className="sku-actions">
          <button
            className="btn-primary"
            onClick={handlePreview}
            disabled={!fromSku || !toSku || loadingPreview}
          >
            {loadingPreview ? "Revisando..." : "Previsualizar cambio"}
          </button>
        </div>

        {error && <p className="status-error">{error}</p>}
        {success && <p className="status-ook">{success}</p>}
      </section>

      {preview && (
        <section className="sku-tools-card">
          <div className="sku-preview-header">
            <div>
              <h3>Previsualizacion</h3>
              <p>{preview.message}</p>
            </div>

            <span
              className={`sku-preview-status ${
                preview.canApply ? "ready" : "blocked"
              }`}
            >
              {preview.canApply ? "Listo para aplicar" : "Bloqueado"}
            </span>
          </div>

          <div className="sku-summary-grid">
            <div>
              <span>SKU origen</span>
              <strong>{preview.source.sku}</strong>
              <p>
                {preview.source.family} - {preview.source.category}
              </p>
            </div>

            <div>
              <span>SKU destino</span>
              <strong>{toSku.trim().toUpperCase()}</strong>
              <p>
                {preview.destination
                  ? `${preview.destination.family} - ${preview.destination.category}`
                  : "Producto nuevo por renombre directo"}
              </p>
            </div>

            <div>
              <span>Tiendas afectadas</span>
              <strong>{preview.affected.storeCount}</strong>
              <p>{preview.affected.inventoryCount} inventarios</p>
            </div>

            <div>
              <span>Clasificaciones</span>
              <strong>{preview.affected.classificationCount}</strong>
              <p>{preview.mode === "merge" ? "Fusion segura" : "Renombre"}</p>
            </div>
          </div>

          {(inventoryConflicts.length > 0 ||
            classificationConflicts.length > 0) && (
            <div className="sku-conflicts">
              <h4>Conflictos detectados</h4>
              <p>
                Estas tiendas ya tienen registros con el SKU destino. Para esta
                primera version no se pisa ni suma informacion automaticamente.
              </p>

              {inventoryConflicts.length > 0 && (
                <ConflictList
                  title="Inventario"
                  conflicts={inventoryConflicts}
                />
              )}

              {classificationConflicts.length > 0 && (
                <ConflictList
                  title="Clasificacion"
                  conflicts={classificationConflicts}
                />
              )}
            </div>
          )}

          <div className="sku-actions">
            <button
              className="btn-primary"
              onClick={handleApply}
              disabled={!preview.canApply || applying}
            >
              {applying ? "Aplicando..." : "Aplicar cambio"}
            </button>
          </div>
        </section>
      )}
    </div>
  );
}

function ConflictList({
  title,
  conflicts,
}: {
  title: string;
  conflicts: StoreConflict[];
}) {
  return (
    <div className="sku-conflict-list">
      <strong>{title}</strong>
      {conflicts.map((conflict) => (
        <div key={`${title}-${conflict.storeId}`}>
          <span>{conflict.storeName}</span>
          <small>
            {conflict.chainName} - {conflict.externalCode || conflict.storeCode}
          </small>
        </div>
      ))}
    </div>
  );
}
