import { useMemo, useSyncExternalStore } from "react";
import type { ReadonlySignal } from "@lexical/extension";

/** Subscribes to a signal outside the editor's composer, where the drawer is rendered */
export function useSignalValue<T>(signal: ReadonlySignal<T>): T {
  const [subscribe, getSnapshot] = useMemo(() => [signal.subscribe.bind(signal), signal.peek.bind(signal)], [signal]);
  return useSyncExternalStore(subscribe, getSnapshot, getSnapshot);
}
