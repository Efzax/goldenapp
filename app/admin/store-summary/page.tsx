"use client";

import { useEffect, useState } from "react";

type StoreSummary = {
  store_id: string;
  store_name: string;
  category: "TV" | "AV";
  total_users: number;
  total_skus: number;
  total_stock: number;
  total_ok: number;
  total_bajo: number;
  total_critico: number;
  total_empuje: number;
};

export default function StoreSummaryPage() {
  const [data, setData] = useState<StoreSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [categoryFilter, setCategoryFilter] = useState<"ALL" | "TV" | "AV">("ALL");
const [sortKey, setSortKey] = useState<keyof StoreSummary>("store_name");
const [sortAsc, setSortAsc] = useState(true);
const [search, setSearch] = useState("");

  useEffect(() => {
    fetch("/api/store-summary")
      .then((res) => res.json())
      .then((json) => {
        setData(json);
        setLoading(false);
      });
  }, []);

  if (loading) return <div>Cargando...</div>;

  //Filter Data
const filteredData = data
  .filter((row) =>
    categoryFilter === "ALL" ? true : row.category === categoryFilter
  )
  .filter((row) =>
    row.store_name.toLowerCase().includes(search.toLowerCase())
  );

  //Shorted Data
const sortedData = [...filteredData].sort((a, b) => {
  const valueA = a[sortKey];
  const valueB = b[sortKey];

  if (valueA < valueB) return sortAsc ? -1 : 1;
  if (valueA > valueB) return sortAsc ? 1 : -1;
  return 0;
});

const totals = sortedData.reduce(
  (acc, row) => {
    acc.total_users += row.total_users;
    acc.total_skus += row.total_skus;
    acc.total_stock += row.total_stock;
    acc.total_ok += row.total_ok;
    acc.total_bajo += row.total_bajo;
    acc.total_critico += row.total_critico;
    acc.total_empuje += row.total_empuje;
    return acc;
  },
  {
    total_users: 0,
    total_skus: 0,
    total_stock: 0,
    total_ok: 0,
    total_bajo: 0,
    total_critico: 0,
    total_empuje: 0,
  }
);


const renderSortArrow = (column: keyof StoreSummary) => {
  if (sortKey !== column) return null;

  return (
    <span className="sort-arrow">
      {sortAsc ? " ▲" : " ▼"}
    </span>
  );
};



  return (
    <div className="page-dashboard">
     <h2 className="page-title">Store Summary</h2>

<div className="table-controls">
  <div className="filter-group">
    <label>Categoría:</label>
    <select
    className="store-select"
      value={categoryFilter}
      onChange={(e) =>
        setCategoryFilter(e.target.value as "ALL" | "TV" | "AV")
      }
    >
      <option value="ALL">Todas</option>
      <option value="TV">TV</option>
      <option value="AV">AV</option>
    </select>
  </div>

  <input
    type="text"
    placeholder="Buscar Tienda..."
    value={search}
    onChange={(e) => setSearch(e.target.value)}
    className="search-input"
  />
</div>


      <table className="dashboard-table">
        <thead>
          <tr>
  <th
    onClick={() => {
      setSortKey("store_name");
      setSortAsc(sortKey === "store_name" ? !sortAsc : true);
    }}
  >
    Tienda {renderSortArrow("store_name")}
  </th>

  <th>Categoría</th>

  <th
    onClick={() => {
      setSortKey("total_users");
      setSortAsc(sortKey === "total_users" ? !sortAsc : true);
    }}
  >
    Promotores {renderSortArrow("total_users")}
  </th>

  <th
    onClick={() => {
      setSortKey("total_skus");
      setSortAsc(sortKey === "total_skus" ? !sortAsc : true);
    }}
  >
    SKUs {renderSortArrow("total_skus")}
  </th>

  <th
    onClick={() => {
      setSortKey("total_stock");
      setSortAsc(sortKey === "total_stock" ? !sortAsc : true);
    }}
  >
    Total Stock {renderSortArrow("total_stock")}
  </th>

  <th
    onClick={() => {
      setSortKey("total_ok");
      setSortAsc(sortKey === "total_ok" ? !sortAsc : true);
    }}
  >
    OK {renderSortArrow("total_ok")}
  </th>

  <th
    onClick={() => {
      setSortKey("total_bajo");
      setSortAsc(sortKey === "total_bajo" ? !sortAsc : true);
    }}
  >
    Bajo {renderSortArrow("total_bajo")}
  </th>

  <th
    onClick={() => {
      setSortKey("total_critico");
      setSortAsc(sortKey === "total_critico" ? !sortAsc : true);
    }}
  >
    Crítico {renderSortArrow("total_critico")}
  </th>

  <th
    onClick={() => {
      setSortKey("total_empuje");
      setSortAsc(sortKey === "total_empuje" ? !sortAsc : true);
    }}
  >
    Empuje {renderSortArrow("total_empuje")}
  </th>
</tr>
          
        </thead>
        <tbody>
          {sortedData.map((row) => (
            <tr key={`${row.store_id}-${row.category}`}>
              <td>{row.store_name}</td>
              <td>{row.category}</td>
              <td>{row.total_users}</td>
              <td>{row.total_skus}</td>
              <td>{row.total_stock}</td>
              <td>{row.total_ok}</td>
              <td>{row.total_bajo}</td>
              <td>{row.total_critico}</td>
              <td>{row.total_empuje}</td>
            </tr>
          ))}
        </tbody>

        <tfoot>
  <tr style={{ fontWeight: "bold", background: "#f3f3f3" }}>
    <td>Total</td>
    <td>-</td>
    <td>{totals.total_users}</td>
    <td>{totals.total_skus}</td>
    <td>{totals.total_stock}</td>
    <td>{totals.total_ok}</td>
    <td>{totals.total_bajo}</td>
    <td>{totals.total_critico}</td>
    <td>{totals.total_empuje}</td>
  </tr>
</tfoot>

      </table>
    </div>
  );
}