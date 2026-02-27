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

  return (
    <div className="page-container">
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
        </button>
      </div>
<h2 className="page-title">Asignar Tiendas</h2>
      <select
        className="select"
        value={selectedUser}
onChange={async (e) => {
  const userId = e.target.value;
  setSelectedUser(userId);

  if (!userId) {
    setSelectedStores([]);
    return;
  }

  const res = await fetch(`/api/admin/user-stores?userId=${userId}`);
  const json = await res.json();
  setSelectedStores(json);
}}

      >
        <option value="">Selecciona usuario</option>
        {users.map((u) => (
          <option key={u.id} value={u.id}>
            {u.name} ({u.email})
          </option>
        ))}
      </select>

      {selectedUser && (
        <div className="list">
          {stores.map((store) => (
            <label key={store.id} className="list-item">
              <input
                type="checkbox"
                checked={selectedStores.includes(store.id)}
                onChange={() => toggleStore(store.id)}
              />
              {store.name}
            </label>
          ))}
        </div>
      )}

      {selectedUser && (
        <button className="btn-primary" onClick={save}>
          Guardar asignación
        </button>
      )}

      {message && <p className="admin-message">{message}</p>}
    </div>
  );
}
