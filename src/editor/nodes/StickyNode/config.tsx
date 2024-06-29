import { HeadingNode, QuoteNode } from "@lexical/rich-text";
import { TableCellNode, TableNode, TableRowNode } from "../TableNode";
import { ListItemNode, ListNode } from "../ListNode";
import { CodeHighlightNode, CodeNode } from "../CodeNode";
import { AutoLinkNode, LinkNode } from "@lexical/link";
import { HorizontalRuleNode } from "@/editor/nodes/HorizontalRuleNode";
import { MathNode } from "../MathNode";
import { $isImageNode, ImageNode } from "../ImageNode";
import { SketchNode } from '../SketchNode';
import { GraphNode } from '../GraphNode';
import theme from "../../theme";
import { IFrameNode } from "../IFrameNode";
import { LayoutContainerNode, LayoutItemNode } from "../LayoutNode";
import { ParagraphNode, isHTMLElement } from "lexical";
import { $isStickyNode } from ".";
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
