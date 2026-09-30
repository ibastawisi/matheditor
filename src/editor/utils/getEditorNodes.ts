import { LexicalEditor, LexicalNode } from "lexical";

export function getEditorNodes(editor: LexicalEditor): LexicalNode[] {
  return [...editor.getEditorState()._nodeMap.values()];
}
