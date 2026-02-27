"use client";

import Link from "next/link";
import { ReactNode, useEffect, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import "../styles/ui.css";

type User = {
  name: string;
  email: string;
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
        router.replace("/mobile/login");
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
    router.replace("/mobile/login");
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
              {user?.name?.charAt(0).toUpperCase() || "?"}
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
          <button onClick={handleLogout} className="logout-btn">
            Logout
          </button>
        </div>
      </aside>

      <main className="admin-content">{children}</main>
    </div>
  );
}