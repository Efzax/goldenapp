"use client";

import Link from "next/link";
import { ReactNode, useEffect, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import "../styles/ui.css";

type User = {
  name: string;
  email: string;
  image?: string | null;
};

export default function AdminLayout({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [role, setRole] = useState<string | null>(null);

useEffect(() => {
  fetch("/api/me")
    .then((res) => {
      if (res.status === 401) {
        router.replace("/login");
        return null;
      }
      return res.json();
    })
    .then((data) => {
      if (data?.email) {
        setUser(data);
        setRole(data.role);
      }
    });
}, [router]);

  async function handleLogout() {
    await fetch("/api/logout", { method: "POST" });
    router.replace("/login");
  }

const menu = [
  { name: "Dashboard", href: "/admin", roles: ["ADMIN", "SUPERVISOR"] },
  { name: "Summary Store", href: "/admin/store-summary", roles: ["ADMIN", "SUPERVISOR"] },
    { name: "Users", href: "/admin/users", roles: ["ADMIN", "SUPERVISOR"] },
  { name: "Import", href: "/admin/import", roles: ["ADMIN"] },
  { name: "Assign Stores", href: "/admin/user-stores", roles: ["ADMIN"] },

  { name: "Mobile Client", href: "/mobile", roles: ["ADMIN", "SUPERVISOR"] },
];

  return (
    <div className="admin-wrapper">
      <aside className="sidebar">
        <div>
          {/* USER INFO */}
          <div className="sidebar-user">
<div className="avatar">
  {user?.image ? (
    <img src={`${user.image}?t=${Date.now()}`} alt="Avatar" />
  ) : user?.name ? (
    user.name.charAt(0).toUpperCase()
  ) : (
    "?"
  )}
</div>
            <div className="user-info">
              <p className="user-name">{user?.name || "Cargando..."}</p>
              <p className="user-email">{user?.email || ""}</p>
            </div>
          </div>

          {/* MENU */}
<nav className="sidebar-nav">
  {menu
    .filter((item) => role && item.roles.includes(role))
    .map((item) => {
      const isActive =
        item.href === "/admin"
          ? pathname === "/admin"
          : pathname.startsWith(item.href);

      return (
        <Link
          key={item.href}
          href={item.href}
          className={`sidebar-link ${isActive ? "active" : ""}`}
        >
          {item.name}
        </Link>
      );
    })}
</nav>
        </div>

        {/* FOOTER */}
        <div className="sidebar-footer">

            <div
    className="mobile-menu-item-admin"
    onClick={() => {
      location.href = "/mobile/profile";
    }}
  >
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" >
  <path stroke-linecap="round" stroke-linejoin="round" d="M10.343 3.94c.09-.542.56-.94 1.11-.94h1.093c.55 0 1.02.398 1.11.94l.149.894c.07.424.384.764.78.93.398.164.855.142 1.205-.108l.737-.527a1.125 1.125 0 0 1 1.45.12l.773.774c.39.389.44 1.002.12 1.45l-.527.737c-.25.35-.272.806-.107 1.204.165.397.505.71.93.78l.893.15c.543.09.94.559.94 1.109v1.094c0 .55-.397 1.02-.94 1.11l-.894.149c-.424.07-.764.383-.929.78-.165.398-.143.854.107 1.204l.527.738c.32.447.269 1.06-.12 1.45l-.774.773a1.125 1.125 0 0 1-1.449.12l-.738-.527c-.35-.25-.806-.272-1.203-.107-.398.165-.71.505-.781.929l-.149.894c-.09.542-.56.94-1.11.94h-1.094c-.55 0-1.019-.398-1.11-.94l-.148-.894c-.071-.424-.384-.764-.781-.93-.398-.164-.854-.142-1.204.108l-.738.527c-.447.32-1.06.269-1.45-.12l-.773-.774a1.125 1.125 0 0 1-.12-1.45l.527-.737c.25-.35.272-.806.108-1.204-.165-.397-.506-.71-.93-.78l-.894-.15c-.542-.09-.94-.56-.94-1.109v-1.094c0-.55.398-1.02.94-1.11l.894-.149c.424-.07.765-.383.93-.78.165-.398.143-.854-.108-1.204l-.526-.738a1.125 1.125 0 0 1 .12-1.45l.773-.773a1.125 1.125 0 0 1 1.45-.12l.737.527c.35.25.807.272 1.204.107.397-.165.71-.505.78-.929l.15-.894Z" />
  <path stroke-linecap="round" stroke-linejoin="round" d="M15 12a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z" />
</svg>
    <span>Profile</span>
  </div>

          <button onClick={handleLogout} className="logout-btn">
            Logout
          </button>
                      <footer className="admin-footer">
        Desarrollado y creado por Efza y Orideken.cl
      </footer>

        </div>
      </aside>

      <main className="admin-content">{children}</main>

    </div>
  );
}