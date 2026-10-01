import { createYjsBinding, syncLexicalUpdateToYjs, type Provider } from "@lexical/yjs";
import type { SerializedEditorState } from "lexical";
import { Doc, encodeStateAsUpdate } from "yjs";
import { createHeadlessEditor } from "./createHeadlessEditor";

/** Seeding only writes the document, so nothing reads the provider's awareness */
const noopProvider = {
  awareness: {
    getLocalState: () => null,
    getStates: () => new Map(),
    off: () => {},
    on: () => {},
    setLocalState: () => {},
    setLocalStateField: () => {},
  },
  connect: () => {},
  disconnect: () => {},
  off: () => {},
  on: () => {},
} as Provider;

/**
 * Converts a serialized editor state into a Yjs update that live editors can
 * start from. Documents are seeded here, once, rather than by the first
 * client to connect, because two clients that both find an empty document
 * would each insert its content.
 */
export function createYjsState(data: SerializedEditorState): Uint8Array {
  const editor = createHeadlessEditor(null);
  const doc = new Doc();
  // the content goes in the doc's default root, which every binding reads whatever its id
  const id = "seed";
  const binding = createYjsBinding({ editor, id, doc, docMap: new Map([[id, doc]]) });
  const unregister = editor.registerUpdateListener(
    ({ prevEditorState, editorState, dirtyElements, dirtyLeaves, normalizedNodes, tags }) => {
      syncLexicalUpdateToYjs(
        binding,
        noopProvider,
        prevEditorState,
        editorState,
        dirtyElements,
        dirtyLeaves,
        normalizedNodes,
        tags
      );
    }
  );
  try {
    editor.setEditorState(editor.parseEditorState(data));
    // update listeners run in a microtask, flushed by a discrete update
    editor.update(() => {}, { discrete: true });
    return encodeStateAsUpdate(doc);
  } finally {
    unregister();
    editor.dispose();
    doc.destroy();
  }
}
