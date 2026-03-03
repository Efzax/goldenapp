"use client";
export const dynamic = "force-dynamic";

import { useEffect, useState } from "react";
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
  const router = useRouter();
  const { setStoreName } = useMobileStore();

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

      <div className="card">


        <div className="card-body">
          {stores.map((store) => (
            <button
              key={store.id}
              onClick={() =>
                router.push(`/mobile?store=${store.code}`)
              }
              className="store-select-btn"
            >
              {store.name}
            </button>
          ))}
        </div>
      </div>
   
  );
}