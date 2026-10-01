"use client"
import { createContext, useContext, useState, type FC, type PropsWithChildren } from "react";
import { useStore } from "zustand";
import { createAppStore, type AppStore, type AppStoreApi } from "./store";

const AppStoreContext = createContext<AppStoreApi | null>(null);

const StoreProvider: FC<PropsWithChildren> = ({ children }) => {
  const [store] = useState(createAppStore);
  return <AppStoreContext.Provider value={store}>{children}</AppStoreContext.Provider>;
};

export const useAppStore = <T,>(selector: (state: AppStore) => T): T => {
  const store = useContext(AppStoreContext);
  if (!store) throw new Error("useAppStore must be used within StoreProvider");
  return useStore(store, selector);
};

export default StoreProvider;
