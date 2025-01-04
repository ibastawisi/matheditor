import { LexicalEditor, LexicalNode } from "lexical";

const $isStickyNode = (node: LexicalNode): boolean => node.__type === 'sticky';
const $isImageNode = (node: LexicalNode): boolean => node.__type === 'image' || node.__type === 'graph' || node.__type === 'sketch';

export function getEditorNodes(editor: LexicalEditor): LexicalNode[] {
  const rootEditor = editor._parentEditor?._parentEditor ?? editor._parentEditor ?? editor;
  const rootNodes = [...rootEditor._editorState._nodeMap.values()];
  const allNodes = rootNodes.map((node: any) => {
    if ($isImageNode(node)) return [node, ...node.__caption._editorState._nodeMap.values()];
    if ($isStickyNode(node)) {
      const children = [...node.__editor._editorState._nodeMap.values()];
      return [node, ...children.map((child: any) => {
        if ($isImageNode(child)) return [child, ...child.__caption._editorState._nodeMap.values()];
        return child;
      }).flat()];
    }
    return node;
  }).flat();

  return allNodes;
}