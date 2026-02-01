"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import "../../styles/ui.css";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const router = useRouter();

  return (
    <div style={{ padding: 20, fontFamily: "system-ui", color: "#384961", }}>
      <div className="page-title">Golden App v0.12</div>

      <input
        type="email"
        placeholder="Correo"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        style={{
          width: "100%",
          padding: "12px",
          marginTop: "20px",
          borderRadius: "8px",
          border: "1px solid #cbd5e1",
          color: "#384961",
        }}
      />

      <input
        type="password"
        placeholder="Clave"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
        style={{
          width: "100%",
          padding: "12px",
          marginTop: "12px",
          borderRadius: "8px",
          border: "1px solid #cbd5e1",
          color: "#384961",
        }}
      />

      <button
        style={{
          marginTop: "20px",
          width: "100%",
          padding: "12px",
          borderRadius: "8px",
          background: "#2563eb",
          color: "white",
          border: "none",
          fontSize: "16px",
          
        }}
        onClick={async () => {
          const res = await fetch("/api/login", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ email, password }),
          });

if (res.ok) {
  const json = await res.json();

  if (json.role === "ADMIN") {
    router.push("/admin");
  } else {
    router.push("/mobile");
  }
}
 else {
            alert("Usuario o clave incorrecta");
          }
        }}
      >
        Entrar
      </button>
    </div>
  );
}
