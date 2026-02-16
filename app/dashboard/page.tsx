"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import "../styles/ui.css";

type Store = {
  id: string;
  name: string;
  code: string;
};

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

export default function DashboardPage() {
  const router = useRouter();

  useEffect(() => {
    fetch("/api/me").then(async (res) => {
      if (res.status === 401) {
        router.replace("/mobile/login");
        return;
      }

      const user = await res.json();
      if (user.role !== "ADMIN") {
        router.replace("/mobile");
      }
    });
  }, []);

  const [stores, setStores] = useState<Store[]>([]);
  const [selectedStore, setSelectedStore] = useState<string>("");
  const [data, setData] = useState<Item[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState<string>("ALL");
  const [category, setCategory] = useState<"TV" | "AV">("TV");

  // Cargar tiendas
  useEffect(() => {
    fetch("/api/my-stores")
      .then((res) => res.json())
      .then((json) => {
        if (Array.isArray(json)) {
          setStores(json);
          if (json.length > 0) {
            setSelectedStore(json[0].code);
          }
        } else {
          setStores([]);
        }
      });
  }, []);

  // Cargar inventario
  useEffect(() => {
    if (!selectedStore) return;

    setLoading(true);

    fetch(`/api/dashboard/${selectedStore}?category=${category}`)
      .then((res) => res.json())
      .then((json) => {
        setData(json.items || []);
        setLoading(false);
      });
  }, [selectedStore, category]);

  const calculateDerived = (item: Item) => {
    const stockTotal = item.stock + (item.exhib ? 1 : 0);
    let status = "OK";
    if (stockTotal <= item.min * 0.5) status = "CRITICO";
    else if (stockTotal < item.min) status = "BAJO";

    const empuje = Math.max(item.min - stockTotal, 0);

    return {
      ...item,
      stockTotal,
      status,
      empuje,
    };
  };

  const statusClass = (status: string) => {
    if (status === "OK") return "status-ok";
    if (status === "BAJO") return "status-bajo";
    if (status === "CRITICO") return "status-critico";
    return "";
  };

  const filteredData =
    statusFilter === "ALL"
      ? Array.isArray(data)
        ? data
        : []
      : Array.isArray(data)
      ? data.filter((item) => item.status === statusFilter)
      : [];

  // 🔥 AGREGAR SKU
  async function handleAdd() {
    const sku = prompt("Ingrese SKU nuevo:");
    if (!sku) return;

    await fetch("/api/inventory/create", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        storeCode: selectedStore,
        sku,
        category,
      }),
    });

    const res = await fetch(`/api/dashboard/${selectedStore}?category=${category}`);
    const json = await res.json();
    setData(json.items || []);
  }

  // 🔥 ELIMINAR SKU (solo inventory)
  async function handleDelete(sku: string) {
    if (!confirm("¿Eliminar este SKU de esta tienda?")) return;

    await fetch("/api/inventory/delete", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        storeCode: selectedStore,
        sku,
      }),
    });

    const res = await fetch(`/api/dashboard/${selectedStore}?category=${category}`);
    const json = await res.json();
    setData(json.items || []);
  }

  return (
    <div className="page-container">
      <div className="page-header">
        <button className="btn-back" onClick={() => router.push("/admin")}>
          ← Back
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

      <h2 className="page-title">Dashboard</h2>



      {/* Selector tienda */}
      <div>
        <label>Tienda: </label>
        <select
          className="select"
          value={selectedStore}
          onChange={(e) => setSelectedStore(e.target.value)}
        >
          {stores.map((store) => (
            <option key={store.id} value={store.code}>
              {store.name}
            </option>
          ))}
        </select>

      </div>

      {/* Tabs */}
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
                      {/* AGREGAR SKU */}
      <button className="btn-primary" onClick={handleAdd}>
        + Agregar SKU
      </button>
      </div>

      {/* Status */}
      <div style={{ marginTop: "10px" }}>
        <label>Status: </label>
        <select
          className="store-select"
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
        >
          <option value="ALL">Todos</option>
          <option value="OK">OK</option>
          <option value="BAJO">Bajo</option>
          <option value="CRITICO">Crítico</option>
        </select>
      </div>

      {loading ? (
        <p>Cargando...</p>
      ) : (
        <div className="table-container">
          <table className="dashboard-table">
            <thead>
              <tr>
                <th>SKU</th>
                <th>Familia</th>
                <th>Stock</th>
                <th>Exhib</th>
                <th>Min</th>
                <th>Total</th>
                <th>Status</th>
                <th>Empuje</th>
                <th>Acción</th>
              </tr>
            </thead>
            <tbody>
              {filteredData.map((item) => (
                <tr key={item.sku}>
                  <td>{item.sku}</td>
                  <td>{item.family}</td>

                  <td>
                    <input
                      type="number"
                      className="input-stock"
                      value={item.stock}
                      onChange={(e) => {
                        const newData = data.map((d) =>
                          d.sku === item.sku
                            ? calculateDerived({
                                ...d,
                                stock: Number(e.target.value),
                              })
                            : d
                        );
                        setData(newData);
                      }}
                    />
                  </td>

                  <td>
                    <input
                      type="checkbox"
                      checked={item.exhib}
                      onChange={(e) => {
                        const newData = data.map((d) =>
                          d.sku === item.sku
                            ? calculateDerived({
                                ...d,
                                exhib: e.target.checked,
                              })
                            : d
                        );
                        setData(newData);
                      }}
                    />
                  </td>

                  <td>
                    <input
                      type="number"
                      className="input-stock"
                      value={item.min}
                      onChange={(e) => {
                        const newData = data.map((d) =>
                          d.sku === item.sku
                            ? calculateDerived({
                                ...d,
                                min: Number(e.target.value),
                              })
                            : d
                        );
                        setData(newData);
                      }}
                    />
                  </td>

                  <td>{item.stockTotal}</td>
                  <td className={statusClass(item.status)}>
                    {item.status}
                  </td>
                  <td>{item.empuje}</td>

                  <td style={{ display: "flex", gap: "8px" }}>
                    <button
                      className="btn-save"
                      onClick={async () => {
                        await fetch("/api/inventory/update", {
                          method: "POST",
                          headers: { "Content-Type": "application/json" },
                          body: JSON.stringify({
                            storeCode: selectedStore,
                            sku: item.sku,
                            stock: item.stock,
                            exhib: item.exhib,
                            minStock: item.min,
                          }),
                        });

                        const res = await fetch(
                          `/api/dashboard/${selectedStore}?category=${category}`
                        );
                        const json = await res.json();
                        setData(json.items || []);
                      }}
                    >
                      Guardar
                    </button>

                    <button
                      className="btn-delete"
                      onClick={() => handleDelete(item.sku)}
                    >
                      Eliminar
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
