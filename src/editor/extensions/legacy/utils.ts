import { $parseSerializedNode, ElementNode, SerializedLexicalNode } from "lexical";
import { getStyleObjectFromRawCSS } from "@/editor/extensions/shared/utils";

/**
 * Documents created before the move to Lexical extensions stored image captions
 * and sticky notes as nested editors, and node options as a css string.
 * These helpers convert those payloads while the node is being imported.
 */

type SerializedPartialNode = SerializedLexicalNode & {
  children?: SerializedPartialNode[];
  [key: string]: unknown;
};

export type LegacyNestedEditor = {
  editorState?: { root?: { children?: SerializedPartialNode[] } };
};

const INLINE_TYPES = new Set(["text", "linebreak", "tab", "math", "link", "autolink"]);

function collectInlineNodes(nodes: SerializedPartialNode[], output: SerializedPartialNode[]) {
  for (const node of nodes) {
    if (INLINE_TYPES.has(node.type)) {
      output.push(node);
      continue;
    }
    if (!Array.isArray(node.children)) continue;
    if (output.length > 0 && output[output.length - 1].type !== "linebreak") {
      output.push({ type: "linebreak", version: 1 });
    }
    collectInlineNodes(node.children, output);
  }
  return output;
}

export function getLegacyNestedEditorChildren(editor: unknown): SerializedPartialNode[] | null {
  if (!editor || typeof editor !== "object") return null;
  const children = (editor as LegacyNestedEditor).editorState?.root?.children;
  return Array.isArray(children) ? children : null;
}

/** Appends a legacy nested caption editor to an inline element node as inline children */
export function $appendLegacyCaption(node: ElementNode, caption: unknown) {
  const children = getLegacyNestedEditorChildren(caption);
  if (!children || node.getChildrenSize() > 0) return;
  const inlineNodes = collectInlineNodes(children, []);
  for (const child of inlineNodes) {
    try {
      node.append($parseSerializedNode(child));
    } catch (error) {
      console.error(error);
    }
  }
}

/** Appends a legacy nested editor to a shadow root element node as block children */
export function $appendLegacyNestedEditor(node: ElementNode, editor: unknown) {
  const children = getLegacyNestedEditorChildren(editor);
  if (!children || node.getChildrenSize() > 0) return;
  for (const child of children) {
    try {
      node.append($parseSerializedNode(child));
    } catch (error) {
      console.error(error);
    }
  }
}

export function getLegacyStyle(serializedNode: unknown): Record<string, string> | null {
  if (!serializedNode || typeof serializedNode !== "object") return null;
  const style = (serializedNode as { style?: unknown }).style;
  if (typeof style !== "string") return null;
  return getStyleObjectFromRawCSS(style);
}
