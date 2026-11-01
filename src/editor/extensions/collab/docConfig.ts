import { defineNode, defineState, type Doc, type DocConfig, type DocNode, type UndoManagerConfig } from "@docukit/docnode";
import { createLexicalDocNodeConfig } from "@docukit/docnode-lexical";
import { $getRoot, COLLABORATION_TAG, type LexicalEditor, type SerializedRootNode } from "lexical";

/**
 * Extends the DocNode root node with Lexical's root metadata (`$` NodeStates
 * such as `pageSetup`, `pageHeader`, and `pageFooter`, plus `format`,
 * `direction`, and `indent`), which `@docukit/docnode-lexical` does not store
 * on its own because it only maps the root's child blocks.
 */
type RootAttributes = Omit<SerializedRootNode, "children" | "type" | "version">;

export const LexicalRootDocNode = defineNode({
  type: "docnode-lexical",
  state: {
    r: defineState({
      fromJSON: (json) => (json ?? null) as RootAttributes | null,
    }),
  },
});

export function createDocumentDocNodeConfig(options?: { undoManager?: UndoManagerConfig }): DocConfig {
  const base = createLexicalDocNodeConfig(options);
  return {
    ...base,
    extensions: [...base.extensions, { nodes: [LexicalRootDocNode] }],
  };
}

function getRootAttributes(): RootAttributes | null {
  const { children: _, type: __, version: ___, ...rest } = $getRoot().exportJSON();
  const hasState = rest.$ && Object.keys(rest.$).length > 0;
  const hasFormat = !!rest.format || !!rest.indent || !!rest.direction;
  if (!hasState && !hasFormat) return null;
  return rest;
}

/**
 * Syncs Lexical's `RootNode` attributes and NodeStates (page setup, headers,
 * footers, root alignment) with the DocNode root node's `r` state.
 *
 * Register this BEFORE `syncLexicalWithDoc` (or mount before `DocNodePlugin`)
 * so that its Lexical update listener runs inside the same transaction that
 * `syncLexicalToDocNode` commits.
 */
export function syncRootStateWithDoc(editor: LexicalEditor, doc: Doc): () => void {
  const rootDocNode = doc.root as DocNode<typeof LexicalRootDocNode>;
  let applyingOwn = false;

  const applyToLexical = (attrs: RootAttributes | null) => {
    applyingOwn = true;
    try {
      editor.update(
        () => {
          const root = $getRoot();
          const serialized = root.exportJSON();
          delete serialized.$;
          serialized.format = "";
          serialized.indent = 0;
          serialized.direction = null;
          if (attrs) Object.assign(serialized, attrs);
          root.getWritable().updateFromJSON(serialized);
        },
        { discrete: true, skipTransforms: true, tag: COLLABORATION_TAG }
      );
    } finally {
      applyingOwn = false;
    }
  };

  const offEditor = editor.registerUpdateListener(({ editorState, dirtyElements, tags }) => {
    if (tags.has(COLLABORATION_TAG) || applyingOwn || !dirtyElements.has("root")) return;
    editorState.read(() => {
      const next = getRootAttributes();
      const prev = rootDocNode.state.r.get();
      if (JSON.stringify(prev) !== JSON.stringify(next)) {
        rootDocNode.state.r.set(next);
      }
    });
  });

  const offDoc = doc.onChange(({ operations }) => {
    if (applyingOwn) return;
    if (!(rootDocNode.id in operations[1])) return;
    applyToLexical(rootDocNode.state.r.get());
  });

  const initial = rootDocNode.state.r.get();
  if (initial) applyToLexical(initial);

  return () => {
    offEditor();
    offDoc();
  };
}
