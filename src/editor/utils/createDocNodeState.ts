import { Doc } from "@docukit/docnode";
import { syncLexicalWithDoc } from "@docukit/docnode-lexical";
import type { SerializedEditorState } from "lexical";
import { createDocumentDocNodeConfig, syncRootStateWithDoc } from "@/editor/extensions/collab/docConfig";
import { createHeadlessEditor } from "./createHeadlessEditor";

/**
 * Converts a serialized editor state into a DocNode JSON snapshot that live
 * editors can start from. Documents are seeded here, once, rather than by the
 * first client to connect, because two clients that both find an empty
 * document would each insert its content.
 */
export function createDocNodeState(data: SerializedEditorState): string {
  const editor = createHeadlessEditor(null);
  const doc = new Doc(createDocumentDocNodeConfig());
  const unbindRoot = syncRootStateWithDoc(editor, doc);
  const unbind = syncLexicalWithDoc(editor, doc);
  try {
    editor.setEditorState(editor.parseEditorState(data));
    // update listeners run in a microtask, flushed by a discrete update
    editor.update(() => {}, { discrete: true });
    return JSON.stringify(doc.toJSON());
  } finally {
    unbind();
    unbindRoot();
    editor.dispose();
    doc.dispose();
  }
}
