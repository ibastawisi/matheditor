import { LexicalEditor } from "lexical";

/** The positioned element wrapping the editor, used as the containing block of anchored toolbars */
export function getEditorContainer(editor: LexicalEditor): HTMLElement {
  const rootElement = editor.getRootElement();
  return rootElement?.closest<HTMLElement>(".editor-container") ?? document.body;
}

export function getNodeAnchorName(nodeKey: string) {
  return `--node-anchor-${nodeKey}`;
}
