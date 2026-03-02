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
      <div className="page-container">
     

      <div className="loginhome"><img src="/icon.png" alt="Logo" /></div>
 <div className="login-title">
        BIENVENIDO SPARTAN
        <h2>Golden App v0.1.9</h2>
        </div>
<input
  type="email"
  name="email"
  id="email"
  autoComplete="email"
  placeholder="Correo"
  value={email}
  onChange={(e) => setEmail(e.target.value)}
  className="input-field"
/>

<input
  type="password"
  name="password"
  id="password"
  autoComplete="current-password"
  placeholder="Clave"
  value={password}
  onChange={(e) => setPassword(e.target.value)}
  className="input-field"
/>

      <button
className="btn-primary"
        onClick={async () => {
          const res = await fetch("/api/login", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ email, password }),
          });

if (res.ok) {
  const json = await res.json();

  if (json.role === "USER") {
    router.push("/mobile");
  } else {
    router.push("/admin");
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
    </div>
  );
}
