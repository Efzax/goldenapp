"use client";

import { useEffect, useState, useMemo } from "react";
import * as XLSX from "xlsx";
import "../../styles/ui.css";

type Store = {
  id: string;
  name: string;
  externalCode: string;
  chain: {
    name: string;
  };
};

export default function AdminStoresPage() {
  const [stores, setStores] = useState<Store[]>([]);
  const [search, setSearch] = useState("");
  const [chainFilter, setChainFilter] = useState("ALL");
  const [showImport, setShowImport] = useState(false);
  const [importResults, setImportResults] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    loadStores();
  }, []);

  async function loadStores() {
    const res = await fetch("/api/admin/stores");
    const data = await res.json();
    setStores(data);
  }

  // 🔹 Extraer cadenas únicas dinámicamente
  const chains = useMemo(() => {
    const unique = Array.from(
      new Set(stores.map((s) => s.chain.name))
    );
    return unique.sort();
  }, [stores]);

  async function handleFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();

    reader.onload = async (evt) => {
      const data = evt.target?.result;
      const workbook = XLSX.read(data, { type: "binary" });
      const sheet = workbook.Sheets[workbook.SheetNames[0]];
      const json = XLSX.utils.sheet_to_json<any>(sheet);

      const cleaned = json
        .filter(
          (r) =>
            r["Cadena"] &&
            r["ExternalCode"] &&
            r["Tienda"]
        )
        .map((r) => ({
          chain: String(r["Cadena"]).trim(),
          externalCode: String(r["ExternalCode"]).trim(),
          storeName: String(r["Tienda"]).trim(),
        }));

      setLoading(true);

      const res = await fetch("/api/admin/stores/import", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(cleaned),
      });

      const result = await res.json();
      setImportResults(result);
      setLoading(false);
      loadStores();
    };

    reader.readAsBinaryString(file);
  }

  async function deleteStore(id: string) {
    if (!confirm("¿Eliminar tienda?")) return;

    const res = await fetch(`/api/admin/stores/${id}`, {
      method: "DELETE",
    });

    const data = await res.json();

    if (!res.ok) {
      alert(data.error);
      return;
    }

    loadStores();
  }

  // 🔹 Filtro combinado (cadena + search)
  const filteredStores = stores.filter((store) => {
    const matchesChain =
      chainFilter === "ALL" ||
      store.chain.name === chainFilter;

    const matchesSearch =
      store.name.toLowerCase().includes(search.toLowerCase()) ||
      store.externalCode
        .toLowerCase()
        .includes(search.toLowerCase()) ||
      store.chain.name
        .toLowerCase()
        .includes(search.toLowerCase());

    return matchesChain && matchesSearch;
  });

  const summary = {
    created: importResults.filter((r) => r.status === "CREATED").length,
    updated: importResults.filter((r) => r.status === "UPDATED").length,
    unchanged: importResults.filter((r) => r.status === "UNCHANGED").length,
    errors: importResults.filter((r) => r.status === "ERROR").length,
  };

  return (
    <div className="page-dashboard">
      <h2 className="page-title">Tiendas</h2>

      <div className="table-toolbar">

        {/* FILTRO CADENA */}
        <div className="filter-pill">
          <span className="filter-label">Cadena:</span>
          <select
            className="filter-select-clean"
            value={chainFilter}
            onChange={(e) => setChainFilter(e.target.value)}
          >
            <option value="ALL">Todas</option>
            {chains.map((chain) => (
              <option key={chain} value={chain}>
                {chain}
              </option>
            ))}
          </select>
        </div>

        {/* SEARCH */}
        <div className="toolbar-left">
          <input
            type="text"
            placeholder="Buscar tienda..."
            className="search-input"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>

        {/* BOTONES */}
        <div className="toolbar-right">
          <button
            className="btn-add2"
            onClick={() =>
              window.open("/api/admin/stores/template")
            }
          >
            Descargar plantilla
          </button>

          <button
            className="btn-add"
            onClick={() => setShowImport(true)}
          >
            Importar
          </button>
        </div>
      </div>

      {/* TABLA */}
      <div className="table-container">
        <div className="table-wrapper-stores">
          <table className="dashboard-table">
            <thead>
              <tr>
                <th>Cadena</th>
                <th>ExternalCode</th>
                <th>Tienda</th>
                <th>Acciones</th>
              </tr>
            </thead>
            <tbody>
              {filteredStores.map((store) => (
                <tr key={store.id}>
                  <td>{store.chain.name}</td>
                  <td>{store.externalCode}</td>
                  <td>{store.name}</td>
                  <td>
                    <button
                      className="icon-btn delete-btn"
                      onClick={() =>
                        deleteStore(store.id)
                      }
                    >
                      🗑
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* MODAL IMPORT */}
      {showImport && (
        <div className="modal-overlay">
          <div className="modal">
            <h3>Importar Tiendas</h3>

            <input
              type="file"
              accept=".xlsx,.xls"
              onChange={handleFile}
              className="input"
            />

            {loading && <p>Procesando...</p>}

            {importResults.length > 0 && (
              <>
                <div style={{ marginTop: 10 }}>
                  <strong>Resumen:</strong>{" "}
                  🟢 {summary.created} | 🟡 {summary.updated} | ⚪ {summary.unchanged} | 🔴 {summary.errors}
                </div>

                <div
                  style={{
                    maxHeight: 200,
                    overflowY: "auto",
                    marginTop: 10,
                  }}
                >
                  {importResults.map((r, i) => (
                    <div key={i} style={{ fontSize: 12 }}>
                      {r.chain} - {r.externalCode} - {r.storeName} → {r.status}
                    </div>
                  ))}
                </div>
              </>
            )}

            <div className="modal-actions">
              <button
                className="btn-secondary"
                onClick={() => {
                  setShowImport(false);
                  setImportResults([]);
                }}
              >
                Cerrar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}