"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import "../../styles/ui.css";

export default function AdminUsersPage() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState("USER");
  const [message, setMessage] = useState("");

  // Protección: solo ADMIN
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

  async function createUser() {
    setMessage("");

    const res = await fetch("/api/admin/users", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name,
        email,
        password,
        role,
      }),
    });

    if (res.ok) {
      setMessage("Usuario creado correctamente");
      setName("");
      setEmail("");
      setPassword("");
    } else {
      const err = await res.json();
      setMessage(err.error || "Error al crear usuario");
    }
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
  </button> </div>
      <h2 className="page-title">Crear Usuario</h2>

      <input
        className="input"
        placeholder="Nombre"
        value={name}
        onChange={(e) => setName(e.target.value)}
      />

      <input
        className="input"
        placeholder="Email"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
      />

      <input
        className="input"
        placeholder="Password"
        type="password"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
      />

      <select
        className="input"
        value={role}
        onChange={(e) => setRole(e.target.value)}
      >
        <option value="USER">Usuario</option>
        <option value="ADMIN">Admin</option>
      </select>

      <button className="btn-primary" onClick={createUser}>
        Crear usuario
      </button>

      {message && <p className="admin-message">{message}</p>}
    </div>
  );
}
