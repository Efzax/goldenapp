"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import "../../styles/ui.css";

type User = {
  id: string;
  name: string;
  email: string;
};

type Store = {
  id: string;
  name: string;
};

export default function AdminUserStoresPage() {
  const router = useRouter();
  const [users, setUsers] = useState<User[]>([]);
  const [stores, setStores] = useState<Store[]>([]);
  const [selectedUser, setSelectedUser] = useState("");
  const [selectedStores, setSelectedStores] = useState<string[]>([]);
  const [message, setMessage] = useState("");
  const [search, setSearch] = useState("");

  // Proteger ADMIN
  useEffect(() => {
    fetch("/api/me").then(async (res) => {
      if (res.status === 401) {
        router.replace("/mobile/login");
        return;
      }
      const user = await res.json();
if (user.role !== "ADMIN") {
  router.replace("/admin");
}
    });
  }, []);

  // Cargar usuarios
// Cargar usuarios
useEffect(() => {
  fetch("/api/admin/users").then(async (res) => {
    if (!res.ok) {
      console.error("Error cargando usuarios");
      return;
    }
    const json = await res.json();
    if (Array.isArray(json)) {
      setUsers(json);
    }
  });
}, []);

// Cargar tiendas
useEffect(() => {
  fetch("/api/stores").then(async (res) => {
    if (!res.ok) {
      console.error("Error cargando tiendas");
      return;
    }
    const json = await res.json();
    if (Array.isArray(json)) {
      setStores(json);
    }
  });
}, []);


  async function save() {
    setMessage("");

    await fetch("/api/admin/user-stores", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        userId: selectedUser,
        storeIds: selectedStores,
      }),
    });

    setMessage("Tiendas asignadas correctamente");
  }

  function toggleStore(id: string) {
    setSelectedStores((prev) =>
      prev.includes(id) ? prev.filter((s) => s !== id) : [...prev, id]
    );
  }

  const filteredStores = stores.filter((store) =>
  store.name.toLowerCase().includes(search.toLowerCase())
);

return (
  <div className="page-dashboard">

  <h2 className="page-title">Asignación de Tiendas</h2>

  <div className="assign-layout">

    {/* COLUMNA IZQUIERDA (SIEMPRE VISIBLE) */}
    <div className="assign-left">

      <div className="filter-pill">
        <span className="filter-label">Seleccionar Usuario:</span>
        <select
          className="filter-select-clean"
          value={selectedUser}
          onChange={async (e) => {
            const userId = e.target.value;
            setSelectedUser(userId);

            if (!userId) {
              setSelectedStores([]);
              return;
            }

            const res = await fetch(
              `/api/admin/user-stores?userId=${userId}`
            );
            const json = await res.json();
            setSelectedStores(json);
          }}
        >
          <option value="">Seleccionar</option>
          {users.map((u) => (
            <option key={u.id} value={u.id}>
              {u.name} ({u.email})
            </option>
          ))}
        </select>
      </div>

      {/* Chips solo si hay usuario */}
      {selectedUser && selectedStores.length > 0 && (
        <div className="chips-container">
          {stores
            .filter((s) => selectedStores.includes(s.id))
            .map((store) => (
              <div key={store.id} className="chip">
                {store.name}
                <button
                  className="chip-remove"
                  onClick={() => toggleStore(store.id)}
                >
                  ×
                </button>
              </div>
            ))}
        </div>
      )}

      <button
        className="btn-primary full-width"
        onClick={save}
        disabled={!selectedUser}
      >
        Guardar Asignación
      </button>

    </div>

    {/* COLUMNA DERECHA */}
    <div className="assign-right">

      {selectedUser ? (
        <>
          <input
            type="text"
            placeholder="Buscar tienda..."
            className="input"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />

          <div className="table-container">
            <div className="table-wrapper">
              <table className="dashboard-table">
                <thead>
                  <tr>
                    <th style={{ width: "60px" }}>✓</th>
                    <th>Nombre Tienda</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredStores.map((store) => (
                    <tr key={store.id}>
                      <td>
                        <input
                          type="checkbox"
                          checked={selectedStores.includes(store.id)}
                          onChange={() => toggleStore(store.id)}
                        />
                      </td>
                      <td className="col-store">{store.name}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </>
      ) : (
        <div className="empty-state">
          Selecciona un usuario para asignar tiendas
        </div>
      )}

    </div>

  </div>

  {message && <div className="success-message">{message}</div>}

</div>
);}
