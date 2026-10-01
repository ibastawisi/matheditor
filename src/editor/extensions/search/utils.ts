import { $getRoot, $isElementNode, $isTextNode, type ElementNode, type LexicalEditor, type LexicalNode, type NodeKey } from "lexical";
import type { SearchRange, SearchSource, TextBlock } from "./core";

function $collectBlocks(): TextBlock<NodeKey>[] {
  const blocks: TextBlock<NodeKey>[] = [];
  const walk = (element: ElementNode, block: TextBlock<NodeKey>) => {
    for (const child of element.getChildren<LexicalNode>()) {
      if ($isTextNode(child)) {
        const text = child.getTextContent();
        block.fragments.push({ target: child.getKey(), start: block.text.length, length: text.length });
        block.text += text;
      } else if ($isElementNode(child) && child.isInline()) {
        walk(child, block);
      } else if ($isElementNode(child)) {
        const nested: TextBlock<NodeKey> = { text: "", fragments: [] };
        blocks.push(nested);
        walk(child, nested);
      } else {
        // a line break or an inline decorator, like math, is not text but separates it
        block.text += "\n";
      }
    }
  };
  walk($getRoot(), { text: "", fragments: [] });
  return blocks;
}

/** The DOM text node and offset at an offset into an element's text, which may be wrapped in format tags */
export function findTextAt(element: Node, offset: number): { node: Text; offset: number } | null {
  const walker = document.createTreeWalker(element, NodeFilter.SHOW_TEXT);
  let consumed = 0;
  for (let node = walker.nextNode() as Text | null; node; node = walker.nextNode() as Text | null) {
    const length = node.data.length;
    if (consumed + length >= offset) return { node, offset: offset - consumed };
    consumed += length;
  }
  return null;
}

/** Searches the editor's text nodes, and finds their text in its DOM */
export function createEditorSearchSource(editor: LexicalEditor): SearchSource<NodeKey> {
  return {
    getBlocks: () => editor.getEditorState().read($collectBlocks),
    toDOMRange: ({ target, start, end }: SearchRange<NodeKey>) => {
      const element = editor.getElementByKey(target);
      const from = element && findTextAt(element, start);
      const to = element && findTextAt(element, end);
      if (!from || !to) return null;
      const range = document.createRange();
      try {
        range.setStart(from.node, from.offset);
        range.setEnd(to.node, to.offset);
      } catch {
        return null;
      }
      return range;
    },
  };
}
