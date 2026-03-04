"use client";

import { useState, useRef } from "react";
import * as XLSX from "xlsx";
import "../../styles/ui.css";

type Row = {
  category: string;
  storeName: string;
  sku: string;
  family: string;
  stock: number;
  exhib: boolean;
  minStock: number;
  valid?: boolean;
  error?: string;
};

export default function ImportPage() {
  const [rows, setRows] = useState<Row[]>([]);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [fileName, setFileName] = useState("");

  const fileInputRef = useRef<HTMLInputElement>(null);

  async function handleFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setFileName(file.name);

    const reader = new FileReader();

    reader.onload = async (evt) => {
      const data = evt.target?.result;
      const workbook = XLSX.read(data, { type: "binary" });
      const sheet = workbook.Sheets[workbook.SheetNames[0]];
      const json = XLSX.utils.sheet_to_json<any>(sheet);

      const cleaned: Row[] = json
.filter(
  (r) =>
    r["Cadena"] &&
    r["ExternalCode"] &&
    r["Categoria"] &&
    r["Tienda"] &&
    r["SKU"] &&
    r["Familia"]
)
.map((r) => ({
  chain: String(r["Cadena"]).trim().toUpperCase(),
  externalCode: String(r["ExternalCode"]).trim().toUpperCase(),
  category: String(r["Categoria"]).trim().toUpperCase(),
  storeName: String(r["Tienda"]).trim(),
  sku: String(r["SKU"]).trim(),
  family: String(r["Familia"]).trim().toUpperCase(),
  stock: Number(r["Stock"] || 0),
  exhib: r["Exhib"] === true || r["Exhib"] === "SI",
  minStock: Number(r["Min"] || 0),
}));


      // 🔍 Validar en backend
      const res = await fetch("/api/admin/import/validate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(cleaned),
      });

      const validated = await res.json();
      setRows(validated);
      setMessage("");
    };

    reader.readAsBinaryString(file);
  }

  async function importToSystem() {
    const validRows = rows.filter((r) => r.valid);

    if (validRows.length === 0) {
      setMessage("❌ No hay filas válidas para importar");
      return;
    }

    setLoading(true);
    setMessage("");

    const res = await fetch("/api/admin/import", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(validRows),
    });

    const json = await res.json();
    setLoading(false);

    if (json.ok) {
      setMessage(`✅ Importadas ${validRows.length} filas correctamente`);
      setRows([]);
      setFileName("");
      if (fileInputRef.current) fileInputRef.current.value = "";
    } else {
      setMessage("❌ Error al importar");
    }
  }

  return (
    <div className="page-dashboard">
      
      <h2 className="page-title">Importar Excel</h2>

      <div className="button-group">
        <button
          onClick={() => window.open("/api/admin/import/template")}
          className="btn-secondary"
        >
          {/* TU SVG */}
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="size-6">
  <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 7.5V6.108c0-1.135.845-2.098 1.976-2.192.373-.03.748-.057 1.123-.08M15.75 18H18a2.25 2.25 0 0 0 2.25-2.25V6.108c0-1.135-.845-2.098-1.976-2.192a48.424 48.424 0 0 0-1.123-.08M15.75 18.75v-1.875a3.375 3.375 0 0 0-3.375-3.375h-1.5a1.125 1.125 0 0 1-1.125-1.125v-1.5A3.375 3.375 0 0 0 6.375 7.5H5.25m11.9-3.664A2.251 2.251 0 0 0 15 2.25h-1.5a2.251 2.251 0 0 0-2.15 1.586m5.8 0c.065.21.1.433.1.664v.75h-6V4.5c0-.231.035-.454.1-.664M6.75 7.5H4.875c-.621 0-1.125.504-1.125 1.125v12c0 .621.504 1.125 1.125 1.125h9.75c.621 0 1.125-.504 1.125-1.125V16.5a9 9 0 0 0-9-9Z" />
</svg>

          Descargar plantilla
        </button>

        <button
          onClick={() => window.open("/api/admin/export")}
          className="btn-primary"
        >
          {/* TU SVG */}
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="size-6">
  <path strokeLinecap="round" strokeLinejoin="round" d="M12 9.75v6.75m0 0-3-3m3 3 3-3m-8.25 6a4.5 4.5 0 0 1-1.41-8.775 5.25 5.25 0 0 1 10.233-2.33 3 3 0 0 1 3.758 3.848A3.752 3.752 0 0 1 18 19.5H6.75Z" />
</svg>

          Exportar Datos
        </button>
      </div>

      <div className="file-upload">
        <label className="btn-secondary">
          {/* TU SVG */}
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="size-6">
  <path strokeLinecap="round" strokeLinejoin="round" d="M12 16.5V9.75m0 0 3 3m-3-3-3 3M6.75 19.5a4.5 4.5 0 0 1-1.41-8.775 5.25 5.25 0 0 1 10.233-2.33 3 3 0 0 1 3.758 3.848A3.752 3.752 0 0 1 18 19.5H6.75Z" />
</svg> Seleccionar archivo
          <input
            ref={fileInputRef}
            type="file"
            accept=".xlsx,.xls"
            onChange={handleFile}
            className="file-input-hidden"
          />
        </label>
      </div>

      {fileName && (
        <div className="btn-file">
          Has subido... <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="size-6">
  <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 0 0-3.375-3.375h-1.5A1.125 1.125 0 0 1 13.5 7.125v-1.5a3.375 3.375 0 0 0-3.375-3.375H8.25m0 12.75h7.5m-7.5 3H12M10.5 2.25H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 0 0-9-9Z" />
</svg>


{fileName}
        </div>
      )}

      {rows.length > 0 && (
        <>
          <table className="dashboard-table">
            <thead>
              <tr>
                <th>Categoria</th>
                <th>Tienda</th>
                <th>SKU</th>
                <th>Familia</th>
                <th>Stock</th>
                <th>Exhib</th>
                <th>Min</th>
                <th>Estado</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((r, i) => (
                <tr key={i} style={{ background: r.valid ? "#e8fff0" : "#ffe8e8" }}>
                  <td>{r.category}</td>
                  <td>{r.storeName}</td>
                  <td>{r.sku}</td>
                  <td>{r.family}</td>
                  <td>{r.stock}</td>
                  <td>{r.exhib ? "SI" : "NO"}</td>
                  <td>{r.minStock}</td>
                  <td>{r.valid ? "OK" : r.error}</td>
                </tr>
              ))}
            </tbody>
          </table>

          <button
            className="btn-primary"
            disabled={loading}
            onClick={importToSystem}
          >
            {loading ? "Importando..." : "Importar filas válidas"}
          </button>
        </>
      )}

      {message && <p className="import-message">{message}</p>}
    </div>
  );
}
