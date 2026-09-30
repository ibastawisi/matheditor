import {
  $create,
  $getRoot,
  $getSelection,
  $isRangeSelection,
  buildImportMap,
  type EditorConfig,
  type LexicalEditor,
  type LexicalNode,
  type SerializedEditorState,
  TextNode,
} from "lexical";

export const PAGE_NUMBER_ATTRIBUTE = "data-lexical-page-number";
export const PAGE_COUNT_ATTRIBUTE = "data-lexical-page-count";
const PAGE_NUMBER_TYPE = "page-number";
const PAGE_COUNT_TYPE = "page-count";
/** Text of a counter that has not been resolved to a page yet */
const PAGE_NUMBER_PLACEHOLDER = "#";
const PAGE_COUNT_PLACEHOLDER = "##";

/**
 * The number of the page a header or footer is drawn on, as a token text node,
 * so that it formats like any other text but cannot be edited character by
 * character. Its text is a placeholder until the page slots write the real
 * number: into the live editor of the page being edited, and into every
 * page's static copy.
 */
export class PageNumberNode extends TextNode {
  $config() {
    return this.config(PAGE_NUMBER_TYPE, {
      extends: TextNode,
      importDOM: buildImportMap({
        span: (domNode) => {
          if (!domNode.hasAttribute(PAGE_NUMBER_ATTRIBUTE)) return null;
          return { conversion: () => ({ node: $createPageNumberNode() }), priority: 2 };
        },
      }),
    });
  }

  constructor(text: string = PAGE_NUMBER_PLACEHOLDER, key?: string) {
    super(text, key);
  }

  createDOM(config: EditorConfig, editor?: LexicalEditor): HTMLElement {
    const dom = super.createDOM(config, editor);
    dom.setAttribute(PAGE_NUMBER_ATTRIBUTE, "true");
    return dom;
  }

  isTextEntity(): true {
    return true;
  }
}

/** The total number of pages, see {@link PageNumberNode} */
export class PageCountNode extends TextNode {
  $config() {
    return this.config(PAGE_COUNT_TYPE, {
      extends: TextNode,
      importDOM: buildImportMap({
        span: (domNode) => {
          if (!domNode.hasAttribute(PAGE_COUNT_ATTRIBUTE)) return null;
          return { conversion: () => ({ node: $createPageCountNode() }), priority: 2 };
        },
      }),
    });
  }

  constructor(text: string = PAGE_COUNT_PLACEHOLDER, key?: string) {
    super(text, key);
  }

  createDOM(config: EditorConfig, editor?: LexicalEditor): HTMLElement {
    const dom = super.createDOM(config, editor);
    dom.setAttribute(PAGE_COUNT_ATTRIBUTE, "true");
    return dom;
  }

  isTextEntity(): true {
    return true;
  }
}

export function $createPageNumberNode(): PageNumberNode {
  return $create(PageNumberNode).setMode("token");
}

export function $isPageNumberNode(node: LexicalNode | null | undefined): node is PageNumberNode {
  return node instanceof PageNumberNode;
}

export function $createPageCountNode(): PageCountNode {
  return $create(PageCountNode).setMode("token");
}

export function $isPageCountNode(node: LexicalNode | null | undefined): node is PageCountNode {
  return node instanceof PageCountNode;
}

/**
 * Writes the page number and page count into the rendered DOM of a header or
 * footer copy, outside any editor. The text sits inside whatever format
 * wrappers the text node rendered, so the number keeps its formatting.
 */
export function writeCountersIntoDOM(root: ParentNode, pageNumber: number, pageCount: number): void {
  const write = (selector: string, value: string) => {
    for (const el of root.querySelectorAll(selector)) {
      const walker = el.ownerDocument.createTreeWalker(el, NodeFilter.SHOW_TEXT);
      const text = walker.nextNode();
      if (text !== null && text.nodeValue !== value) {
        text.nodeValue = value;
      }
    }
  };
  write(`[${PAGE_NUMBER_ATTRIBUTE}]`, String(pageNumber));
  write(`[${PAGE_COUNT_ATTRIBUTE}]`, String(pageCount));
}

/**
 * Replaces a counter's text. `setTextContent` leaves the selection alone, so a
 * caret at the end of a longer old text would point past the end of the new
 * one and strand the next keystroke; keep such a caret at the end.
 */
function $setCounterText(node: TextNode, value: string): void {
  if (node.getTextContent() === value) return;
  node.setTextContent(value);
  const selection = $getSelection();
  if (!$isRangeSelection(selection)) return;
  const key = node.getKey();
  for (const point of [selection.anchor, selection.focus]) {
    if (point.type === "text" && point.key === key && point.offset > value.length) {
      point.set(key, value.length, "text");
    }
  }
}

/**
 * Sets the counters of a header or footer editor to the values of the page it
 * is being edited on, so that the author sees real numbers while editing
 */
export function $writeCountersIntoEditor(pageNumber: number, pageCount: number): void {
  for (const node of $getRoot().getAllTextNodes()) {
    if ($isPageNumberNode(node)) $setCounterText(node, String(pageNumber));
    else if ($isPageCountNode(node)) $setCounterText(node, String(pageCount));
  }
}

/**
 * A copy of a serialized header or footer with every counter's text reset to
 * its placeholder, so that the stored document does not depend on which page
 * the header was last edited from
 */
export function normalizeCounterText<T extends SerializedEditorState>(state: T): T {
  const visit = (node: unknown): unknown => {
    if (typeof node !== "object" || node === null) return node;
    const record = node as { children?: unknown[]; type?: unknown };
    const copy: Record<string, unknown> = { ...record };
    if (record.type === PAGE_NUMBER_TYPE) copy.text = PAGE_NUMBER_PLACEHOLDER;
    else if (record.type === PAGE_COUNT_TYPE) copy.text = PAGE_COUNT_PLACEHOLDER;
    if (Array.isArray(record.children)) copy.children = record.children.map(visit);
    return copy;
  };
  return { ...state, root: visit(state.root) } as T;
}
