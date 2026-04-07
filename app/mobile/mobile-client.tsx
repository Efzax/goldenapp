"use client";
export const dynamic = "force-dynamic";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams, usePathname } from "next/navigation";
import {
  CheckCircleIcon,
  XCircleIcon,
  TvIcon,
} from "@heroicons/react/24/outline";
import { useMobileStore } from "./MobileStoreContext";
import "../styles/ui.css";

type Item = {
  sku: string;
  family: string;
  stock: number;
  exhib: boolean;
  status: string;
  type?: string | null; // 👈 agregado
};

export default function MobileClient() {
  const [data, setData] = useState<Item[]>([]);
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState<"TV" | "AV">("TV");
  const [month, setMonth] = useState<string | null>(null);
  const { setStoreName } = useMobileStore();

  const router = useRouter();
  const searchParams = useSearchParams();
  const pathname = usePathname();

  const storeCode = searchParams.get("store");

  useEffect(() => {
    if (!storeCode && pathname === "/mobile") {
      router.replace("/mobile/select-store");
      return;
    }

    if (storeCode) {
      fetch(`/api/dashboard/${storeCode}?category=${category}`, {
        cache: "no-store",
      })
        .then((res) => res.json())
.then((json) => {
  setStoreName(json.storeName || "");
  setData(json.items);
  setMonth(json.month || null); // 👈 NUEVO
});
    }
  }, [storeCode, pathname, category, router, setStoreName]);

  const statusDotClass = (status: string) => {
    if (status === "OK") return "dot-ok";
    if (status === "BAJO") return "dot-bajo";
    if (status === "CRITICO") return "dot-critico";
    return "";
  };

  const filtered = data.filter((item) =>
    item.sku.toLowerCase().includes(search.toLowerCase())
  );

  const grouped = filtered.reduce<Record<string, Item[]>>((acc, item) => {
    acc[item.family] = acc[item.family] || [];
    acc[item.family].push(item);
    return acc;
  }, {});

  return (
    <div>
            {month && (
  <div className="mobile-month">
    PS y PE del mes activo : <strong>{month}</strong>
  </div>
)}

      <div className="category-tabs">
        <button
          className={category === "TV" ? "tab active" : "tab"}
          onClick={() => setCategory("TV")}
        >
          TV
        </button>
        <button
          className={category === "AV" ? "tab active" : "tab"}
          onClick={() => setCategory("AV")}
        >
          AV
        </button>
      </div>

      <input
        className="input"
        placeholder="Buscar SKU..."
        value={search}
        onChange={(e) => setSearch(e.target.value)}
      />



      {Object.keys(grouped).map((family) => (
        <div key={family}>
          <div className="card-dots">
            <div className="card-header-dots">
              <div className="family-title">{family}</div>
            </div>

            {grouped[family].map((item: Item) => (
              <div key={item.sku} className="card-body-dots">
                <Link
                  href={`/mobile/${encodeURIComponent(item.sku)}?store=${storeCode}&category=${category}`}
                  className="sku-row"
                >
                  <div className={`status-dot ${statusDotClass(item.status)}`} />

                  <div className="sku-info">
                    <div className="sku-text-row">
  <div className="sku-text">{item.sku}</div>

  {item.type && (
    <span className={`sku-badge ${item.type}`}>
      {item.type === "PS_AUDIO"
        ? "PS Audio"
        : item.type}
    </span>
  )}
</div>

                    <div className="sku-icons">
                      {item.stock > 0 ? (
                        <CheckCircleIcon className="icon icon-ok" />
                      ) : (
                        <XCircleIcon className="icon icon-zero" />
                      )}

                      {item.exhib && <TvIcon className="icon icon-tv" />}

                      <span className="stock-number">
                        {item.stock}
                      </span>
                    </div>
                  </div>
                </Link>
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}
