import { namedSignals } from "@lexical/extension";
import { $isHeadingNode, type HeadingTagType } from "@lexical/rich-text";
import { $getRoot, $isElementNode, defineExtension, type EditorState, type ElementNode, type NodeKey } from "lexical";

export interface TableOfContentsEntry {
  key: NodeKey;
  text: string;
  tag: HeadingTagType;
  /** The fragment that links to the heading */
  id: string;
}

/** The fragment that links to a heading: its text, the way bookmarks are named */
export const formatId = (text: string) => text.trim().toLowerCase();

/** The headings of the document in order, including those in columns, tables and collapsibles */
export function $getTableOfContents(): TableOfContentsEntry[] {
  const entries: TableOfContentsEntry[] = [];
  const collect = (node: ElementNode) => {
    for (const child of node.getChildren()) {
      if ($isHeadingNode(child)) {
        const text = child.getTextContent();
        if (text.trim()) entries.push({ key: child.getKey(), text, tag: child.getTag(), id: formatId(text) });
      } else if ($isElementNode(child)) {
        collect(child);
      }
    }
  };
  collect($getRoot());
  return entries;
}

const isSameEntry = (a: TableOfContentsEntry, b: TableOfContentsEntry) => a.key === b.key && a.text === b.text && a.tag === b.tag;

/** The headings of the document, kept up to date as it is edited */
export const TableOfContentsExtension = defineExtension({
  name: "table-of-contents",
  build: () => namedSignals({ tableOfContents: [] as TableOfContentsEntry[] }),
  register(editor, _config, state) {
    const { tableOfContents } = state.getOutput();
    const update = (editorState: EditorState) => {
      const next = editorState.read($getTableOfContents);
      const prev = tableOfContents.peek();
      // only a change to the headings notifies, not every keystroke
      if (next.length === prev.length && next.every((entry, i) => isSameEntry(entry, prev[i]))) return;
      tableOfContents.value = next;
    };
    update(editor.getEditorState());
    return editor.registerUpdateListener(({ editorState, dirtyElements, dirtyLeaves }) => {
      if (dirtyElements.size === 0 && dirtyLeaves.size === 0) return;
      update(editorState);
    });
  },
});
