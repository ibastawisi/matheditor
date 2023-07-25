import { useMemo } from "react";
import { getActions } from "@/indexeddb/idb";

export default function useIndexedDBStore<T>(storeName: string) {
  const _actions = useMemo(() => getActions<T>(storeName), [storeName]);
  return _actions;
}
