"use client";

import { useState, useRef } from "react";
import * as XLSX from "xlsx";
import "../../../styles/ui.css";

type Row = {
  chain: string;
  externalCode: string;
  storeName: string;
  status?: string;
  message?: string;
};

export default function ImportStoresPage() {
  const [rows, setRows] = useState<Row[]>([]);
  const summary = {
  created: rows.filter(r => r.status === "CREATED").length,
  updated: rows.filter(r => r.status === "UPDATED").length,
  unchanged: rows.filter(r => r.status === "UNCHANGED").length,
  errors: rows.filter(r => r.status === "ERROR").length,
};
  const [loading, setLoading] = useState(false);
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
      setRows(result);
      setLoading(false);
    };

    reader.readAsBinaryString(file);
  }

  return (
    <div className="page-container">
      <h2 className="page-title">Importar Tiendas</h2>

<button
  onClick={() => window.open("/api/admin/stores/template")}
  className="btn-secondary"
>
  Descargar plantilla
</button>


      <div className="file-upload">
        <label className="btn-secondary">
          Seleccionar archivo
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
          Archivo: {fileName}
        </div>
      )}

      {loading && <p>Procesando...</p>}

{rows.length > 0 && (
  <div style={{ marginBottom: "16px" }}>
    <strong>Resumen:</strong>{" "}
    🟢 {summary.created} creadas |{" "}
    🟡 {summary.updated} actualizadas |{" "}
    ⚪ {summary.unchanged} sin cambios |{" "}
    🔴 {summary.errors} errores
  </div>
)}

      {rows.length > 0 && (

        
        <table className="dashboard-table">
          <thead>
            <tr>
              <th>Cadena</th>
              <th>ExternalCode</th>
              <th>Tienda</th>
              <th>Estado</th>
              <th>Mensaje</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((r, i) => (
              <tr
                key={i}
                style={{
                  background:
                    r.status === "ERROR"
                      ? "#ffe8e8"
                      : r.status === "CREATED"
                      ? "#e8fff0"
                      : r.status === "UPDATED"
                      ? "#fff8e1"
                      : "#f5f5f5",
                }}
              >
                <td>{r.chain}</td>
                <td>{r.externalCode}</td>
                <td>{r.storeName}</td>
                <td>{r.status}</td>
                <td>{r.message}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}