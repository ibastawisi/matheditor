import { HeadingNode, QuoteNode } from "@lexical/rich-text";
import { TableCellNode, TableNode, TableRowNode } from "./nodes/TableNode";
import { ListItemNode, ListNode } from "./nodes/ListNode";
import { CodeHighlightNode, CodeNode } from "./nodes/CodeNode";
import { AutoLinkNode, LinkNode } from "@lexical/link";
import { HorizontalRuleNode } from "@/editor/nodes/HorizontalRuleNode";
import { MathNode } from "./nodes/MathNode";
import { $isImageNode, ImageNode } from "./nodes/ImageNode";
import { SketchNode } from './nodes/SketchNode';
import { GraphNode } from './nodes/GraphNode';
import { $isStickyNode, StickyNode } from './nodes/StickyNode';
import theme from "./theme";
import { PageBreakNode } from "./nodes/PageBreakNode";
import { IFrameNode } from "./nodes/IFrameNode";
import { LayoutContainerNode, LayoutItemNode } from "./nodes/LayoutNode";
import { ParagraphNode, isHTMLElement } from "lexical";
import type { InitialConfigType } from "@lexical/react/LexicalComposer";
import type { CreateEditorArgs } from "lexical";

export const editorConfig = {
  namespace: "matheditor",
  // The editor theme
  theme: theme,
  // Handling of errors during update
  onError(error: Error) {
    throw error;
  },
  // Any custom nodes go here
  nodes: [
    HeadingNode,
    ListNode,
    ListItemNode,
    QuoteNode,
    CodeNode,
    CodeHighlightNode,
    TableNode,
    TableCellNode,
    TableRowNode,
    AutoLinkNode,
    LinkNode,
    HorizontalRuleNode,
    MathNode,
    ImageNode,
    SketchNode,
    GraphNode,
    StickyNode,
    PageBreakNode,
    IFrameNode,
    LayoutContainerNode,
    LayoutItemNode,
  ],
  html: {
    export: new Map([
      [
        ParagraphNode,
        (editor, node) => {
          const paragraphNode = node as ParagraphNode;
          const output = paragraphNode.exportDOM(editor);
          const children = paragraphNode.getChildren();
          const hasDivs = children.some((child) => $isImageNode(child) || $isStickyNode(child));
          if (!hasDivs) return output;
          const element = output.element;
          if (!element || !isHTMLElement(element)) return output;
          const div = document.createElement("div");
          div.append(...element.childNodes);
          for (const attr of element.attributes) {
            div.setAttribute(attr.name, attr.value);
          }
          return { element: div };
        },
      ],
    ]),
  },
} satisfies InitialConfigType & CreateEditorArgs;