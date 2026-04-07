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

type ProductFamily = {
  id: string;
  name: string;
};

export default function DashboardPage() {
    const router = useRouter();
  const [role, setRole] = useState<string | null>(null);

// Protección por rol (bloquear solo USER)
useEffect(() => {
  fetch("/api/me").then(async (res) => {
    if (res.status === 401) {
      router.replace("/mobile/login");
      return;
    }

    const user = await res.json();
    setRole(user.role);

    if (user.role === "USER") {
      router.replace("/mobile");
    }
  });
}, [router]);



  const [stores, setStores] = useState<Store[]>([]);
  const [selectedStore, setSelectedStore] = useState<string>("");
  const [data, setData] = useState<Item[]>([]);
  const [originalData, setOriginalData] = useState<Item[]>([]);
  const [savingSku, setSavingSku] = useState<string | null>(null);
  const [savedSku, setSavedSku] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState<string>("ALL");
  const [familyFilter, setFamilyFilter] = useState<string>("ALL");
  const [category, setCategory] = useState<"TV" | "AV">("TV");
  const [search, setSearch] = useState("");
  const [sortField, setSortField] = useState<keyof Item | null>(null);
  const [sortDirection, setSortDirection] = useState<"asc" | "desc">("asc"); 
  const [skuToDelete, setSkuToDelete] = useState<string | null>(null);
  const [showAddModal, setShowAddModal] = useState(false);
  const [familyOptions, setFamilyOptions] = useState<ProductFamily[]>([]);
const [newItem, setNewItem] = useState({
  sku: "",
  family: "",
  stock: 0,
  exhib: false,
  min: 0,
});
const canManageInventory = role === "ADMIN" || role === "SUPERVISOR";


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

  fetch("/api/families")
    .then((res) => res.json())
    .then((json) => {
      if (Array.isArray(json)) {
        setFamilyOptions(json);
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
setOriginalData(recalculated);
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

// 👇 NUEVO — familias únicas
const families = Array.from(
  new Set(data.map((item) => item.family))
);

const addProductFamilies = Array.from(
  new Set([
    ...familyOptions.map((family) => family.name),
    ...families,
  ].filter(Boolean))
).sort();

const filteredData = Array.isArray(data)
  ? data
      .filter((item) =>
        statusFilter === "ALL" ? true : item.status === statusFilter
      )
      .filter((item) =>
        familyFilter === "ALL" ? true : item.family === familyFilter
      )
      .filter((item) =>
        item.sku.toLowerCase().includes(search.toLowerCase())
      )
  : [];

  const sortedData = [...filteredData].sort((a, b) => {
  if (!sortField) return 0;

  const valueA = a[sortField];
  const valueB = b[sortField];

  if (valueA < valueB) return sortDirection === "asc" ? -1 : 1;
  if (valueA > valueB) return sortDirection === "asc" ? 1 : -1;
  return 0;
});

const handleSort = (field: keyof Item) => {
  if (sortField === field) {
    setSortDirection(sortDirection === "asc" ? "desc" : "asc");
  } else {
    setSortField(field);
    setSortDirection("asc");
  }
};
const renderSortIcon = (field: keyof Item) => {
  if (sortField !== field) return null;

  return (
    <span className="sort-arrow">
      {sortDirection === "asc" ? " ▲" : " ▼"}
    </span>
  );
};

  const hasChanges = (item: Item) => {
  const original = originalData.find((o) => o.sku === item.sku);
  if (!original) return false;

  return (
    item.stock !== original.stock ||
    item.min !== original.min ||
    item.exhib !== original.exhib
  );
};

const kpis = {
  total: filteredData.length,
  stockTotal: filteredData.reduce((acc, i) => acc + i.stockTotal, 0),
  ok: filteredData.filter(i => i.status === "OK").length,
  bajo: filteredData.filter(i => i.status === "BAJO").length,
  critico: filteredData.filter(i => i.status === "CRITICO").length,
  empujeTotal: filteredData.reduce((acc, i) => acc + i.empuje, 0),
};

const criticalPercent =
  kpis.total > 0
    ? ((kpis.critico / kpis.total) * 100).toFixed(1)
    : "0";

let criticalClass = "kpi-ok";

if (Number(criticalPercent) >= 20) {
  criticalClass = "kpi-critico";
} else if (Number(criticalPercent) >= 10) {
  criticalClass = "kpi-bajo";
}


  return (
    
    <div className="page-dashboard">
      




  <h2 className="page-title">Dashboard</h2>







  <div className="kpi-container">
  <div className="kpi-card kpi-total">
    <span>Total SKUs</span>
    <strong>{kpis.total}</strong>
  </div>

  <div className="kpi-card kpi-total">
  <span>Stock Total</span>
  <strong>{kpis.stockTotal}</strong>
</div>

  <div className="kpi-card kpi-ok">
    <span>OK</span>
    <strong>{kpis.ok}</strong>
  </div>

  <div className="kpi-card kpi-bajo">
    <span>Bajo</span>
    <strong>{kpis.bajo}</strong>
  </div>

<div className={`kpi-card ${criticalClass}`}>
  <span>Crítico</span>
  <strong>
    {kpis.critico} ({criticalPercent}%)
  </strong>
</div>

  <div className="kpi-card kpi-empuje">
    <span>Empuje Total</span>
    <strong>{kpis.empujeTotal}</strong>
  </div>
</div>

      {/* Selector tienda */}
      
        <div className="dash-top-row">
        
        <div className="filter-pill">
  <span className="filter-label">Store:</span>
        <select
          className="filter-select-clean"
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

  <div className="status-left">
<div className="filter-pill">
  <span className="filter-label">Status:</span>
  <select
    className="filter-select-clean"
    value={statusFilter}
    onChange={(e) => setStatusFilter(e.target.value)}
  >
    <option value="ALL">Todos</option>
    <option value="OK">OK</option>
    <option value="BAJO">Bajo</option>
    <option value="CRITICO">Crítico</option>
  </select>
</div>

<div className="filter-pill">
  <span className="filter-label">Familia:</span>
  <select
    className="filter-select-clean"
    value={familyFilter}
    onChange={(e) => setFamilyFilter(e.target.value)}
  >
    <option value="ALL">Todas</option>
    {families.map((fam) => (
      <option key={fam} value={fam}>
        {fam}
      </option>
    ))}
  </select>
</div>

  </div>

  <input
    className="input search-input"
    placeholder="Buscar SKU..."
    value={search}
    onChange={(e) => setSearch(e.target.value)}
  />

  {canManageInventory && (
    <button
      className="btn-add"
      onClick={() => {
        setNewItem({
          sku: "",
          family: "",
          stock: 0,
          exhib: false,
          min: 0,
        });
        setShowAddModal(true);
      }}
    >
      <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" >
    <path stroke-linecap="round" stroke-linejoin="round" d="m16.862 4.487 1.687-1.688a1.875 1.875 0 1 1 2.652 2.652L10.582 16.07a4.5 4.5 0 0 1-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 0 1 1.13-1.897l8.932-8.931Zm0 0L19.5 7.125M18 14v4.75A2.25 2.25 0 0 1 15.75 21H5.25A2.25 2.25 0 0 1 3 18.75V8.25A2.25 2.25 0 0 1 5.25 6H10" />
  </svg>
      Agregar producto
    </button>
  )}

</div>

      {loading ? (
        <p>Cargando...</p>
      ) : (
        <div className="table-container">

         <div className="table-wrapper">
          <table className="dashboard-table">
            <thead>
              <tr>
                <th onClick={() => handleSort("sku")} 
                className="sortable">SKU {renderSortIcon("sku")}</th>
               <th onClick={() => handleSort("family")} 
               className="sortable">Familia {renderSortIcon("family")}  </th>
                <th onClick={() => handleSort("stock")} className="sortable">Stock {renderSortIcon("stock")}</th>
                <th>Exhib</th>
                <th onClick={() => handleSort("min")} className="sortable">Min {renderSortIcon("min")}</th>
                <th>Total</th>
                <th onClick={() => handleSort("status")} className="sortable">Status {renderSortIcon("status")}</th>
                <th onClick={() => handleSort("empuje")} className="sortable">Empuje {renderSortIcon("empuje")}</th>
                {canManageInventory && <th>Acción</th>}
              </tr>
            </thead>
            <tbody>
              {sortedData.map((item) => (
                <tr key={item.sku}>
                  <td>{item.sku}</td>
                  <td>{item.family}</td>

                  <td>
                    <input
                      type="number"
                      className="input-stock"
                      value={item.stock}
                      disabled={!canManageInventory}
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
                      disabled={!canManageInventory}
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
    disabled={!canManageInventory}
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

                  {canManageInventory && (
                  <td>
                    <div className="action-cell">
                    <button
    className="icon-btn save-btn"
  title="Guardar cambios"
  disabled={!hasChanges(item) || savingSku === item.sku}
  onClick={async () => {
    try {
      setSavingSku(item.sku);
      setSavedSku(null);

      const res = await fetch("/api/inventory/update", {
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

      if (!res.ok) throw new Error("Error");

      setOriginalData((prev) =>
        prev.map((o) =>
          o.sku === item.sku ? { ...item } : o
        )
      );

      setSavedSku(item.sku);
      setTimeout(() => setSavedSku(null), 2000);

    } catch {
      alert("Error al guardar");
    } finally {
      setSavingSku(null);
    }
  }}
>
  {savingSku === item.sku ? (
    // 🟡 GUARDANDO
    <svg className="icon spin" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
      <path strokeLinecap="round" strokeLinejoin="round"
        d="M6 12 3.269 3.125A59.769 59.769 0 0 1 21.485 12 
        59.768 59.768 0 0 1 3.27 20.875L5.999 12Zm0 0h7.5" />
    </svg>
  ) : savedSku === item.sku ? (
    // 🟢 GUARDADO
    <svg className="icon success" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
      <path strokeLinecap="round" strokeLinejoin="round"
        d="M9 12.75 11.25 15 15 9.75" />
    </svg>
  ) : (
    // ✏️ GUARDAR
    <svg className="icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
      <path strokeLinecap="round" strokeLinejoin="round"
        d="m16.862 4.487 1.687-1.688a1.875 1.875 0 1 1 2.652 2.652L10.582 16.07a4.5 4.5 0 0 1-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 0 1 1.13-1.897l8.932-8.931Z" />
    </svg>
  )}
</button>
<button
  className="icon-btn delete-btn"
  title="Eliminar producto"
  onClick={() => setSkuToDelete(item.sku)}
>
  <svg className="icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
    <path strokeLinecap="round" strokeLinejoin="round"
      d="m14.74 9-.346 9m-4.788 0L9.26 9m9.968-3.21
      c.342.052.682.107 1.022.166m-1.022-.165L18.16
      19.673a2.25 2.25 0 0 1-2.244 2.077H8.084
      a2.25 2.25 0 0 1-2.244-2.077L4.772 5.79" />
  </svg>
</button>
</div>

                  </td>
                  )}
                </tr>
              ))}
            </tbody>
          </table></div>
        </div>
            )}

      {/* MODAL ELIMINAR */}
      {skuToDelete && (
        <div className="modal-overlay">
          <div className="modal">
            <h3>Eliminar producto</h3>
            <p>¿Estás seguro que deseas eliminar el SKU {skuToDelete}?</p>

            <div className="modal-actions">
              <button
                className="btn-cancel"
                onClick={() => setSkuToDelete(null)}
              >
                Cancelar
              </button>

              <button
                className="btn-confirm"
                onClick={async () => {
                  await fetch("/api/inventory/delete", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({
                      storeCode: selectedStore,
                      sku: skuToDelete,
                    }),
                  });

                  setData(prev => prev.filter(d => d.sku !== skuToDelete));
                  setOriginalData(prev => prev.filter(d => d.sku !== skuToDelete));
                  setSkuToDelete(null);
                }}
              >
                Eliminar
              </button>
            </div>
          </div>
        </div>
        
      )}
      {showAddModal && (
  <div className="modal-overlay">
    <div className="modal add-product-modal">
      <h3>Agregar nuevo producto</h3>
      <p className="modal-description">
        Completa la informacion para crear el SKU en la tienda seleccionada.
      </p>

      <div className="modal-form">
        <label className="modal-field">
          <span>SKU</span>
          <input
            className="input"
            placeholder="Ej: MX-ST40F/ZS"
            value={newItem.sku}
            onChange={(e) =>
              setNewItem({ ...newItem, sku: e.target.value.toUpperCase() })
            }
          />
        </label>

        <label className="modal-field">
          <span>Familia</span>
          <select
            className="input"
            value={newItem.family}
            onChange={(e) =>
              setNewItem({ ...newItem, family: e.target.value })
            }
          >
            <option value="">Selecciona una familia</option>
            {addProductFamilies.map((family) => (
              <option key={family} value={family}>
                {family}
              </option>
            ))}
          </select>
        </label>

        <label className="modal-field">
          <span>Stock actual</span>
          <input
            className="input"
            type="number"
            min="0"
            value={newItem.stock}
            onChange={(e) =>
              setNewItem({ ...newItem, stock: Number(e.target.value) })
            }
          />
        </label>

        <label className="modal-field">
          <span>Minimo requerido</span>
          <input
            className="input"
            type="number"
            min="0"
            value={newItem.min}
            onChange={(e) =>
              setNewItem({ ...newItem, min: Number(e.target.value) })
            }
          />
        </label>

        <label className="checkbox-line add-product-check">
          <span>Exhibicion</span>
          <input
            type="checkbox"
            checked={newItem.exhib}
            onChange={(e) =>
              setNewItem({ ...newItem, exhib: e.target.checked })
            }
          />
          Exhibición
        </label>

        <input
          type="number"
          placeholder="Mínimo"
          value={newItem.min}
          onChange={(e) =>
            setNewItem({ ...newItem, min: Number(e.target.value) })
          }
        />
      </div>

      <div className="modal-actions">
        <button
          className="btn-cancel"
          onClick={() => setShowAddModal(false)}
        >
          Cancelar
        </button>

        <button
          className="btn-confirm"
          onClick={async () => {
            if (!newItem.sku || !newItem.family) {
              alert("Completa todos los campos");
              return;
            }

            const calculated = calculateDerived({
              ...newItem,
              sku: newItem.sku.trim().toUpperCase(),
              stockTotal: 0,
              status: "OK",
              empuje: 0,
            });

            // 👉 Aquí luego puedes conectar a API
const res = await fetch("/api/inventory/create", {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({
    storeCode: selectedStore,
    sku: newItem.sku.trim().toUpperCase(),
    familyName: newItem.family,
    stock: newItem.stock,
    exhib: newItem.exhib,
    minStock: newItem.min,
    category: category, // TV o AV
  }),
});

            const result = await res.json();

            if (!res.ok) {
              alert(result.error || "Error al agregar producto");
              return;
            }

            setData(prev => [...prev, calculated]);
            setOriginalData(prev => [...prev, calculated]);

            setNewItem({
              sku: "",
              family: "",
              stock: 0,
              exhib: false,
              min: 0,
            });

            setShowAddModal(false);
          }}
        >
          Agregar
        </button>
      </div>
    </div>
  </div>
)}

    </div>
  );
}
