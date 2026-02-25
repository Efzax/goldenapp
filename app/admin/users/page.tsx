"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import "../../styles/ui.css";

type User = {
  id: string;
  name: string;
  email: string;
  role: string;
};

export default function AdminUsersPage() {
  const router = useRouter();

  const [users, setUsers] = useState<User[]>([]);
  const [deletingUser, setDeletingUser] = useState<User | null>(null);
  const [search, setSearch] = useState("");
  const [creating, setCreating] = useState(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);

  const [form, setForm] = useState({
    name: "",
    email: "",
    password: "",
    role: "USER",
  });

  // 🔐 Protección ADMIN
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

    loadUsers();
  }, []);

  async function loadUsers() {
    const res = await fetch("/api/admin/users");
    const data = await res.json();
    setUsers(data);
  }

  async function deleteUser(id: string) {
    if (!confirm("¿Eliminar usuario?")) return;

    await fetch(`/api/admin/users/${id}`, {
      method: "DELETE",
    });

    loadUsers();
  }

  function openEdit(user: User) {
    setEditingUser(user);
    setForm({
      name: user.name,
      email: user.email,
      password: "",
      role: user.role,
    });
  }

  async function updateUser() {
    if (!editingUser) return;

    await fetch(`/api/admin/users/${editingUser.id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    });

    setEditingUser(null);
    loadUsers();
  }
const filteredUsers = users.filter((user) =>
  user.name.toLowerCase().includes(search.toLowerCase()) ||
  user.email.toLowerCase().includes(search.toLowerCase())
);
  return (
    <div className="page-dashboard" >
      <h2 className="page-title">Usuarios</h2>


<div className="table-toolbar">
  <div className="toolbar-left">
    <input
      type="text"
      placeholder="Buscar usuario..."
      className="input"
      value={search}
      onChange={(e) => setSearch(e.target.value)}
    />
  </div>

  <div className="toolbar-right">
    <button
      className="btn-add"
      title="Crear usuario"
      onClick={() => {
        setCreating(true);
        setForm({
          name: "",
          email: "",
          password: "",
          role: "USER",
        });
      }}
    >
      <svg
        className="icon"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.5"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          d="M12 4.5v15m7.5-7.5h-15"
        />
      </svg>
    </button>
  </div>
</div>



      <table className="dashboard-table">
        <thead>
          <tr>
            <th>Usuario</th>
            <th>Correo</th>
            <th>Clave</th>
            <th>Rol</th>
            <th>Acciones</th>
          </tr>
        </thead>

        <tbody>
          {filteredUsers.map((user) => (
            <tr key={user.id}>
              <td className="user-cell">
                <div className="avatar">
                  {user.name.charAt(0).toUpperCase()}
                </div>
                {user.name}
              </td>

              <td>{user.email}</td>
              <td>••••••••</td>
              <td>
  <span className={`role-badge ${user.role}`}>
    {user.role}
  </span>
</td>

              <td>
  <div className="action-cell">

    {/* EDITAR */}
    <button
      className="icon-btn edit-btn"
      title="Editar usuario"
      onClick={() => openEdit(user)}
    >
      <svg
        className="icon"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.5"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          d="m16.862 4.487 1.687-1.688a1.875 
          1.875 0 1 1 2.652 2.652L10.582 
          16.07a4.5 4.5 0 0 1-1.897 
          1.13L6 18l.8-2.685a4.5 
          4.5 0 0 1 1.13-1.897l8.932-8.931Z"
        />
      </svg>
    </button>

    {/* ELIMINAR */}
    <button
      className="icon-btn delete-btn"
      title="Eliminar usuario"
      onClick={() => setDeletingUser(user)}
    >
      <svg
        className="icon"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.5"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          d="m14.74 9-.346 9m-4.788 
          0L9.26 9m9.968-3.21
          c.342.052.682.107 
          1.022.166m-1.022-.165L18.16
          19.673a2.25 2.25 0 0 
          1-2.244 2.077H8.084
          a2.25 2.25 0 0 
          1-2.244-2.077L4.772 5.79"
        />
      </svg>
    </button>

  </div>
</td>
            </tr>
          ))}
        </tbody>
      </table>

      {/* MODAL */}
      {editingUser && (
        <div className="modal-overlay">
          <div className="modal">
            <h3>Editar Usuario</h3>

            <input
              className="input"
              value={form.name}
              onChange={(e) =>
                setForm({ ...form, name: e.target.value })
              }
              placeholder="Nombre"
            />

            <input
              className="input"
              value={form.email}
              onChange={(e) =>
                setForm({ ...form, email: e.target.value })
              }
              placeholder="Email"
            />

            <input
              className="input"
              type="password"
              value={form.password}
              onChange={(e) =>
                setForm({ ...form, password: e.target.value })
              }
              placeholder="Nueva contraseña (opcional)"
            />

            <select
              className="input"
              value={form.role}
              onChange={(e) =>
                setForm({ ...form, role: e.target.value })
              }
            >
              <option value="USER">Usuario</option>
              <option value="ADMIN">Admin</option>
            </select>

            <div className="modal-actions">
              <button className="btn-primary" onClick={updateUser}>
                Guardar
              </button>

              <button
                className="btn-secondary"
                onClick={() => setEditingUser(null)}
              >
                Cancelar
              </button>
            </div>
          </div>
        </div>
      )}
      {deletingUser && (
  <div className="modal-overlay">
    <div className="modal">
      <h3>Eliminar Usuario</h3>

      <p>
        ¿Seguro que deseas eliminar a{" "}
        <strong>{deletingUser.name}</strong>?
      </p>

      <div className="modal-actions">
        <button
          className="btn-primary"
          onClick={async () => {
            await fetch(
              `/api/admin/users/${deletingUser.id}`,
              { method: "DELETE" }
            );
            setDeletingUser(null);
            loadUsers();
          }}
        >
          Eliminar
        </button>

        <button
          className="btn-secondary"
          onClick={() => setDeletingUser(null)}
        >
          Cancelar
        </button>
      </div>
    </div>
  </div>
)}

{creating && (
  <div className="modal-overlay">
    <div className="modal">
      <h3>Crear Usuario</h3>

      <input
        className="input"
        placeholder="Nombre"
        value={form.name}
        onChange={(e) =>
          setForm({ ...form, name: e.target.value })
        }
      />

      <input
        className="input"
        placeholder="Correo"
        value={form.email}
        onChange={(e) =>
          setForm({ ...form, email: e.target.value })
        }
      />

      <input
        className="input"
        type="password"
        placeholder="Contraseña"
        value={form.password}
        onChange={(e) =>
          setForm({ ...form, password: e.target.value })
        }
      />

      <select
        className="input"
        value={form.role}
        onChange={(e) =>
          setForm({ ...form, role: e.target.value })
        }
      >
        <option value="USER">Usuario</option>
        <option value="ADMIN">Admin</option>
      </select>

      <div className="modal-actions">
        <button
          className="btn-primary"
          onClick={async () => {
            await fetch("/api/admin/users", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify(form),
            });

            setCreating(false);
            loadUsers();
          }}
        >
          Crear
        </button>

        <button
          className="btn-secondary"
          onClick={() => setCreating(false)}
        >
          Cancelar
        </button>
      </div>
    </div>
  </div>
)}
    </div>
  );
}