import { createYjsBinding, syncLexicalUpdateToYjs, type ExcludedProperties, type Provider } from "@lexical/yjs";
import type { Klass, LexicalNode, SerializedEditorState } from "lexical";
import { Doc, encodeStateAsUpdate } from "yjs";
import { ImageNode } from "@/editor/extensions/image/nodes";
import { SketchNode } from "@/editor/extensions/sketch/nodes";
import { GraphNode } from "@/editor/extensions/graph/nodes";
import { createHeadlessEditor } from "./createHeadlessEditor";

const excludedProperties: ExcludedProperties = new Map<Klass<LexicalNode>, Set<string>>([
  [ImageNode, new Set(["__signedUrl"])],
  [SketchNode, new Set(["__signedUrl"])],
  [GraphNode, new Set(["__signedUrl"])],
]);

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
  const binding = createYjsBinding({ editor, id, doc, docMap: new Map([[id, doc]]), excludedProperties });
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
