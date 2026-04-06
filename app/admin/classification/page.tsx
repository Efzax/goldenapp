"use client";

import { useEffect, useState } from "react";
import * as XLSX from "xlsx";

type ClassificationRow = {
  chain_name: string;
  store_name: string;
  externalCode: string;
  sku: string;
  type: string;
};

type ImportResult = {
  externalCode: string;
  sku: string;
  status: string;
};

type SheetRow = {
  Mes?: string;
  ExternalCode?: string;
  SKU?: string;
  Type?: string;
};

export default function ClassificationPage() {
  const [data, setData] = useState<ClassificationRow[]>([]);
  const [loading, setLoading] = useState(true);
    const [month, setMonth] = useState("");
  const [error, setError] = useState("");
  const [canManage, setCanManage] = useState(false);
  const [showImport, setShowImport] = useState(false);
  const [showDelete, setShowDelete] = useState(false);
  const [importResults, setImportResults] = useState<ImportResult[]>([]);

  const [chainFilter, setChainFilter] = useState("ALL");
  const [storeFilter, setStoreFilter] = useState("ALL");
  const [typeFilter, setTypeFilter] = useState("ALL");
  const [search, setSearch] = useState("");

  const [sortKey, setSortKey] =
    useState<keyof ClassificationRow>("chain_name");
  const [sortAsc, setSortAsc] = useState(true);

  useEffect(() => {
    loadData();
  }, []);

async function loadData() {
  setLoading(true);
  setError("");

  try {
    const res = await fetch("/api/admin/classification");
    const json = await res.json();

    if (!res.ok) {
      throw new Error(json.error || "Error cargando clasificación");
    }

    setData(Array.isArray(json.data) ? json.data : []);
    setMonth(json.month || "SIN MES CARGADO");
    setCanManage(Boolean(json.canManage));
  } catch (err) {
    setData([]);
    setMonth("SIN MES CARGADO");
    setCanManage(false);
    setError(
      err instanceof Error
        ? err.message
        : "Error cargando clasificación"
    );
  }

  setLoading(false);
}

  async function handleFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();

    reader.onload = async (evt) => {
      const data = evt.target?.result;
      const workbook = XLSX.read(data, { type: "binary" });
      const sheet = workbook.Sheets[workbook.SheetNames[0]];
      const json = XLSX.utils.sheet_to_json<SheetRow>(sheet);

const cleaned = json
  .filter(
    (r) =>
      r["Mes"] &&
      r["ExternalCode"] &&
      r["SKU"] &&
      r["Type"]
  )
  .map((r) => ({
    month: String(r["Mes"]).trim(),
    externalCode: String(r["ExternalCode"]).trim(),
    sku: String(r["SKU"]).trim(),
    type: String(r["Type"]).trim(),
  }));

      setLoading(true);

      const res = await fetch("/api/admin/classification/import", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(cleaned),
      });

      const result = await res.json();
      setImportResults(result);
      await loadData();
      setLoading(false);
    };

    reader.readAsBinaryString(file);
  }

  async function clearClassification() {
    setLoading(true);

    await fetch("/api/admin/classification/clear", {
      method: "POST",
    });

    await loadData();

    setShowDelete(false);
    setLoading(false);
  }

  if (loading)
    return <div className="page-dashboard">Cargando...</div>;

  if (error) {
    return (
      <div className="page-dashboard">
        <h2 className="page-title">
          Classification Summary PS / PE
        </h2>
        <p className="status-error-info">{error}</p>
      </div>
    );
  }

  const chains = Array.from(
    new Set(data.map((d) => d.chain_name))
  ).sort();

const stores = Array.from(
  new Set(
    data
      .filter((d) =>
        chainFilter === "ALL"
          ? true
          : d.chain_name === chainFilter
      )
      .map((d) => d.store_name)
  )
).sort();

  const filteredData = data
    .filter((row) =>
      chainFilter === "ALL"
        ? true
        : row.chain_name === chainFilter
    )
    .filter((row) =>
      storeFilter === "ALL"
        ? true
        : row.store_name === storeFilter
    )
    .filter((row) =>
      typeFilter === "ALL"
        ? true
        : row.type === typeFilter
    )
    .filter((row) =>
      row.sku.toLowerCase().includes(search.toLowerCase())
    );

  const sortedData = [...filteredData].sort((a, b) => {
    const valueA = a[sortKey];
    const valueB = b[sortKey];

    if (valueA < valueB) return sortAsc ? -1 : 1;
    if (valueA > valueB) return sortAsc ? 1 : -1;
    return 0;
  });

  const totalPS = filteredData.filter(
    (r) => r.type === "PS"
  ).length;
  const totalPE = filteredData.filter(
    (r) => r.type === "PE"
  ).length;
  const totalPSAudio = filteredData.filter(
    (r) => r.type === "PS_AUDIO"
  ).length;

  const totalStores = new Set(
    filteredData.map((r) => r.store_name)
  ).size;

  const totalChains = new Set(
    filteredData.map((r) => r.chain_name)
  ).size;

  const handleSort = (key: keyof ClassificationRow) => {
    setSortKey(key);
    setSortAsc(sortKey === key ? !sortAsc : true);
  };

  return (
    <div className="page-dashboard">
      <h2 className="page-title">
        Classification Summary PS / PE
      </h2>
<div className="month-indicator">
  Mes activo: <strong>{month}</strong>
</div>
      {/* KPI */}
      <div className="kpi-container">
        <div className="kpi-card kpi-total">
          Tiendas
          <strong>{totalStores}</strong>
        </div>

        <div className="kpi-card kpi-total">
          Cadenas
          <strong>{totalChains}</strong>
        </div>

        <div className="kpi-card kpi-ps">
          PS
          <strong>{totalPS}</strong>
        </div>

        <div className="kpi-card kpi-pe">
          PE
          <strong>{totalPE}</strong>
        </div>

        <div className="kpi-card kpi-audio">
          PS Audio
          <strong>{totalPSAudio}</strong>
        </div>
      </div>

{/* ===== FILTROS (FILA 1) ===== */}
<div className="filters-row">

  <div className="filter-pill">
    <span className="filter-label">Cadena:</span>
    <select
      className="filter-select-clean"
      value={chainFilter}
      onChange={(e) => {
  setChainFilter(e.target.value);
  setStoreFilter("ALL");
}}
    >
      <option value="ALL">Todas</option>
      {chains.map((chain) => (
        <option key={chain} value={chain}>
          {chain}
        </option>
      ))}
    </select>
  </div>

  <div className="filter-pill">
    <span className="filter-label">Tienda:</span>
    <select
      className="filter-select-clean"
      value={storeFilter}
      onChange={(e) => setStoreFilter(e.target.value)}
    >
      <option value="ALL">Todas</option>
      {stores.map((store) => (
        <option key={store} value={store}>
          {store}
        </option>
      ))}
    </select>
  </div>

  <div className="filter-pill">
    <span className="filter-label">Tipo:</span>
    <select
      className="filter-select-clean"
      value={typeFilter}
      onChange={(e) => setTypeFilter(e.target.value)}
    >
      <option value="ALL">Todos</option>
      <option value="PS">PS</option>
      <option value="PE">PE</option>
      <option value="PS_AUDIO">PS Audio</option>
    </select>
  </div>

<div className="filter-pill-reset">
<button 
className="filter-select-clean"
    onClick={() => {
      setChainFilter("ALL");
      setStoreFilter("ALL");
      setTypeFilter("ALL");
      setSearch("");
}}>
  Reset Filter X
</button></div>

</div>

{/* ===== SEARCH + BOTONES (FILA 2) ===== */}
<div className="toolbar-row">

  <div className="toolbar-left">
    <input
      type="text"
      placeholder="Buscar SKU..."
      value={search}
      onChange={(e) => setSearch(e.target.value)}
      className="search-input"
    />
  </div>

  {canManage && (
  <div className="toolbar-right">

    <button
      className="btn-add2"
      onClick={() =>
        window.open("/api/admin/classification/template")
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

    <button
      className="btn-danger"
      onClick={() => setShowDelete(true)}
    >
      Borrar Todo
    </button>

  </div>
  )}

</div>

      {/* TABLA */}
      <div className="table-wrapper">
      <table className="dashboard-table">
        <thead>
          <tr>
            <th onClick={() => handleSort("chain_name")}>
              Cadena
            </th>
            <th onClick={() => handleSort("store_name")}>
              Tienda
            </th>
            <th onClick={() => handleSort("externalCode")}>
              ExternalCode
            </th>
            <th onClick={() => handleSort("sku")}>
              SKU
            </th>
            <th onClick={() => handleSort("type")}>
              Type
            </th>
          </tr>
        </thead>
        <tbody>
          {sortedData.map((row, index) => (
            <tr key={index}>
              <td>{row.chain_name}</td>
              <td className="col-store">
                {row.store_name}
              </td>
              <td>{row.externalCode}</td>
              <td>{row.sku}</td>
              <td>
                <span
                  className={`role-badge ${row.type}`}
                >
                  {row.type}
                </span>
              </td>
            </tr>
          ))}
        </tbody>
        </table></div>

      {/* MODAL IMPORT */}
      {showImport && (
        <div className="modal-overlay">
          <div className="modal">
            <h3>Importar Clasificación</h3>

            <input
              type="file"
              accept=".xlsx,.xls"
              onChange={handleFile}
              className="input"
            />

            {importResults.length > 0 && (
              <div
                style={{
                  maxHeight: 200,
                  overflowY: "auto",
                  marginTop: 10,
                }}
              >
                {importResults.map((r, i) => (
                  <div
                    key={i}
                    style={{ fontSize: 12 }}
                  >
                    {r.externalCode} - {r.sku} →{" "}
                    {r.status}
                  </div>
                ))}
              </div>
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

      {/* MODAL BORRAR */}
      {showDelete && (
        <div className="modal-overlay">
          <div className="modal">
            <h3>
              ¿Borrar toda la clasificación?
            </h3>

            <div className="modal-actions">
              <button
                className="btn-secondary"
                onClick={() =>
                  setShowDelete(false)
                }
              >
                Cancelar
              </button>

              <button
                className="btn-danger-secondary"
                onClick={clearClassification}
              >
                Confirmar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
