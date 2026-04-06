"use client";
export const dynamic = "force-dynamic";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useMobileStore } from "../MobileStoreContext";
import "../../styles/ui.css";

type Store = {
  id: string;
  name: string;
  code: string;
};

type User = {
  id: string;
  name: string;
  email: string;
  role: string;
  image: string | null;
  stores: Store[];
};

export default function ProfilePage() {
  const router = useRouter();
  const { setStoreName } = useMobileStore();

  const [user, setUser] = useState<User | null>(null);
  const [uploading, setUploading] = useState(false);
  const [editingName, setEditingName] = useState(false);
  const [newName, setNewName] = useState("");
  const [savingName, setSavingName] = useState(false);

  // ✅ Setear título del header
  useEffect(() => {
    setStoreName("Bienvenido a tu perfil");
  }, [setStoreName]);

  // ✅ Cargar usuario
  useEffect(() => {
    const fetchUser = async () => {
      const res = await fetch("/api/me");
      if (res.ok) {
        const data = await res.json();
        setUser(data);
      }
    };

    fetchUser();
  }, []);

  const roleLabels: Record<string, string> = {
    ADMIN: "Administrador",
    SUPERVISOR: "Supervisor",
    MERCHAND: "Merchand",
    USER: "Promotor",
  };

  const handleAvatarChange = async (file: File) => {
    if (!file) return;

    const formData = new FormData();
    formData.append("file", file);

    setUploading(true);

    const res = await fetch("/api/profile/avatar", {
      method: "POST",
      body: formData,
    });

    if (res.ok) {
      const data = await res.json();

      setUser((prev) =>
        prev
          ? { ...prev, image: `${data.image}?t=${Date.now()}` }
          : prev
      );
    }

    setUploading(false);
  };

  const handleSaveName = async () => {
    if (!newName.trim()) return;

    setSavingName(true);

    const res = await fetch("/api/profile/update", {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ name: newName }),
    });

    if (res.ok) {
      const data = await res.json();
      setUser((prev) =>
        prev ? { ...prev, name: data.name } : prev
      );
      setEditingName(false);
    }

    setSavingName(false);
  };

  if (!user) {
    return (
      <div className="page-container">
        <p>Cargando...</p>
      </div>
    );
  }

  return (
    <div className="mobile-container">
      {/* ===== USER INFO ===== */}
      <div className="card">
        <div className="card-body" style={{ alignItems: "center" }}>
          {/* Avatar */}
          <div className="avatar-wrapper">
            {user.image ? (
              <img
                src={user.image}
                alt="Avatar"
                className="avatar-image"
              />
            ) : (
              <div className="avatar-placeholder">
                {user.name?.charAt(0)}
              </div>
            )}

            <label className="avatar-edit-btn">
              ✎
              <input
                type="file"
                accept="image/*"
                className="file-input-hidden"
                onChange={(e) => {
                  if (e.target.files && e.target.files[0]) {
                    handleAvatarChange(e.target.files[0]);
                  }
                }}
              />
            </label>
          </div>

          <div style={{ textAlign: "center" }}>
            {editingName ? (
              <div style={{ display: "flex", gap: "8px", justifyContent: "center" }}>
                <input
                  className="input-profile"
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                  style={{ maxWidth: "250px" }}
                />
                <button
                  className="btn-save"
                  onClick={handleSaveName}
                  disabled={savingName}
                >
                  {savingName ? "..." : "Guardar"}
                </button>
              </div>
            ) : (
              <div style={{ display: "flex", alignItems: "center", gap: "8px", justifyContent: "center" }}>
                <h2 style={{ margin: 0 }}>{user.name}</h2>
                <span
                  style={{ cursor: "pointer", fontSize: "14px" }}
                  onClick={() => {
                    setNewName(user.name);
                    setEditingName(true);
                  }}
                >
                  ✎
                </span>
              </div>
            )}

            <p style={{ margin: "4px 0", color: "#6b7280" }}>
              {user.email}
            </p>

            <span className={`role-badge ${user.role}`}>
              {roleLabels[user.role] || user.role}
            </span>
          </div>
        </div>
      </div>

      {/* ===== STORES ===== */}
      <div className="card">
        <div className="card-header">
          <span className="sku-title">Tiendas asignadas</span>
        </div>

        <div className="card-body">
          {user.stores.length === 0 ? (
            <p>No tiene tiendas asignadas.</p>
          ) : (
            <div className="profile-stores-grid">
              {user.stores.map((store) => (
                <div key={store.id} className="profile-store-card">
                  <div className="profile-store-name">
                    {store.name}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* ===== ACTION BUTTONS ===== */}
      <div style={{ marginTop: "30px", display: "flex", gap: "12px", flexWrap: "wrap" }}>
        <button
          className="btn-primary"
          onClick={() => router.push("/mobile")}
        >
          Mis Tiendas
        </button>

        {(user.role === "ADMIN" || user.role === "SUPERVISOR" || user.role === "MERCHAND") && (
          <button
            className="btn-secondary"
            onClick={() => router.push("/admin")}
          >
            Dashboard
          </button>
        )}
      </div>
    </div>
  );
}
