"use client";

import { createContext, useContext, useState, ReactNode } from "react";

type StoreContextType = {
  storeName: string;
  setStoreName: (name: string) => void;
};

const MobileStoreContext = createContext<StoreContextType | undefined>(undefined);

export function MobileStoreProvider({ children }: { children: ReactNode }) {
  const [storeName, setStoreName] = useState("");

  return (
    <MobileStoreContext.Provider value={{ storeName, setStoreName }}>
      {children}
    </MobileStoreContext.Provider>
  );
}

export function useMobileStore() {
  const context = useContext(MobileStoreContext);
  if (!context) {
    throw new Error("useMobileStore must be used within MobileStoreProvider");
  }
  return context;
}