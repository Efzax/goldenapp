"use client";

import { useRouter } from "next/navigation";
import "./header.css";

type HeaderProps = {
  title: string;
  showBack?: boolean;
};

export default function Header({ title, showBack = false }: HeaderProps) {
  const router = useRouter();

  return (
    <div className="app-header">
      <div className="header-left">
        {showBack && (
          <button className="header-back" onClick={() => router.back()}>
            ← Back
          </button>
        )}
      </div>

      <div className="header-title">{title}</div>

      <div className="header-right">
        <button
          className="header-logout"
          onClick={async () => {
            await fetch("/api/logout", { method: "POST" });
            router.replace("/mobile/login");
          }}
        >
          Logout
        </button>
      </div>
    </div>
  );
}
