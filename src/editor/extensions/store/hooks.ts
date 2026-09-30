import { StoreExtension } from ".";
import { useExtensionSignalValue } from "@lexical/react/useExtensionSignalValue";
import { useLexicalComposerContext } from "@lexical/react/LexicalComposerContext";
import { getExtensionDependencyFromEditor, type ReadonlySignal, type Signal } from "@lexical/extension";
import type { LexicalExtensionOutput } from "lexical";
import { useCallback } from "react";

type SignalValue<S> = S extends ReadonlySignal<infer V> ? V : S extends Signal<infer V> ? V : never;

type StoreExtensionOutput = LexicalExtensionOutput<typeof StoreExtension>;

export const useStore = <K extends keyof StoreExtensionOutput>(
  key: K
): [SignalValue<StoreExtensionOutput[K]>, (value: SignalValue<StoreExtensionOutput[K]>) => void] => {
  const state = useExtensionSignalValue(StoreExtension, key);
  const [editor] = useLexicalComposerContext();
  const setState = useCallback(
    (value: SignalValue<StoreExtensionOutput[K]>) => {
      getExtensionDependencyFromEditor(editor, StoreExtension).output[key].value = value;
    },
    [editor, key]
  );
  return [state as SignalValue<StoreExtensionOutput[K]>, setState];
};
