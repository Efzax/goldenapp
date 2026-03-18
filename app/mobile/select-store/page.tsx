"use client";
export const dynamic = "force-dynamic";

import { useDeferredValue, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useMobileStore } from "../MobileStoreContext";
import "../../styles/ui.css";
import { api } from "@/app/lib/api";

type Store = {
  id: string;
  name: string;
  code: string;
};

export default function SelectStorePage() {
  const [stores, setStores] = useState<Store[]>([]);
  const [search, setSearch] = useState("");
  const router = useRouter();
  const { setStoreName } = useMobileStore();
  const deferredSearch = useDeferredValue(search);

  const filteredStores = stores.filter((store) => {
    const term = deferredSearch.trim().toLowerCase();

    if (!term) return true;

    return (
      store.name.toLowerCase().includes(term) ||
      store.code.toLowerCase().includes(term)
    );
  });

  useEffect(() => {
    // ✅ Setear título del header
    setStoreName("Selecciona tu tienda");

    api<Store[]>("/api/my-stores")
      .then((json) => {
        setStores(json);

        // Si solo tiene 1 tienda, redirige automáticamente
        if (json.length === 1) {
          router.push(`/mobile?store=${json[0].code}`);
        }
      })
      .catch((err) => {
        console.error("Error loading stores:", err);
      });
  }, [router, setStoreName]);

  return (
    <div>
      <input
        type="text"
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        placeholder="Buscar tienda por nombre o código"
        className="input search-input-full"
      />

      {filteredStores.length > 0 ? (
        filteredStores.map((store) => (
          <button
            key={store.id}
            onClick={() => router.push(`/mobile?store=${store.code}`)}
            className="store-select-btn"
          >
            {store.name}
          </button>
        ))
      ) : (
        <p className="empty-text">No se encontraron tiendas.</p>
      )}
    </div>
  );
}
