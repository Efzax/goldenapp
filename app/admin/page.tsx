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

  // Protección por rol (solo ADMIN)
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
  const [search, setSearch] = useState("");


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
      console.error("Respuesta inválida de /api/my-stores:", json);
      setStores([]);
    }
  });

  }, []);

  // Cargar inventario por tienda
  useEffect(() => {
    if (!selectedStore) return;
        

    setLoading(true);
    fetch(`/api/dashboard/${selectedStore}?category=${category}`)
      .then((res) => res.json())
.then((json) => {
  const recalculated = (json.items || []).map(calculateDerived);
setData(recalculated);
  setLoading(false);
});

  }, [selectedStore, category]);

  // Cálculos locales (como Excel)
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

const filteredData = Array.isArray(data)
  ? data
      .filter((item) =>
        statusFilter === "ALL" ? true : item.status === statusFilter
      )
      .filter((item) =>
        item.sku.toLowerCase().includes(search.toLowerCase())
      )
  : [];


  return (
    
    <div className="page-dashboard">
      <div className="page-header">
<div className="header-left"></div>


  

  <button
    className="btn-logout"
    onClick={async () => {
      await fetch("/api/logout", { method: "POST" });
      location.href = "/mobile/login";
    }}
  >
    Logout
  </button> </div>
  <h2 className="page-title">Dashboard</h2>

      {/* Selector tienda */}
      
        <div className="dash-top-row">
        
        <select
          className="input-select"
          value={selectedStore}
          onChange={(e) => setSelectedStore(e.target.value)}
        >
          {stores.map((store) => (
            <option key={store.id} value={store.code}>
              {store.name}
            </option>
          ))}
        </select>
     

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
  </button> </div>
</div>


      {/* Selector status */}
      <div className="status-selector">
        <div className="status-label">
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
        </select></div>

              {/* BUSCADOR */}
      <input
        className="input"
        placeholder="Buscar SKU..."
        value={search}
        onChange={(e) => setSearch(e.target.value)}
      />

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

<td>
  <span className={`status-badge ${statusClass(item.status)}`}>
    {item.status}
  </span>
</td>

                  <td>{item.empuje}</td>

                  <td>
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

                        const res = await fetch(`/api/dashboard/${selectedStore}?category=${category}`);
const json = await res.json();
const recalculated = (json.items || []).map(calculateDerived);
setData(recalculated);
                      }}
                    >
                      Guardar
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
