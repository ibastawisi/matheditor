import { useEffect, useState } from "react";

export function useHydration() {
  const [hydrated, setHydrated] = useState(typeof window === 'undefined');
  useEffect(() => { setHydrated(true); }, []);
  return hydrated;
}