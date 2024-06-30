import { HeadingNode, QuoteNode } from "@lexical/rich-text";
import { TableCellNode, TableNode } from "../TableNode";
import { ListItemNode, ListNode } from "@lexical/list";
import { CodeHighlightNode, CodeNode } from "@lexical/code";
import { AutoLinkNode, LinkNode } from "@lexical/link";
import { HorizontalRuleNode } from "@/editor/nodes/HorizontalRuleNode";
import { MathNode } from "../MathNode";
import { ImageNode } from "../ImageNode";
import { SketchNode } from '../SketchNode';
import { GraphNode } from '../GraphNode';
import theme from "@/editor/theme";
import { IFrameNode } from "../IFrameNode";
import { LayoutContainerNode, LayoutItemNode } from "../LayoutNode";
import type { InitialConfigType } from "@lexical/react/LexicalComposer";
import type { CreateEditorArgs } from "lexical";
import { htmlConfig } from "@/editor/utils/htmlConfig";
import {
  TableCellNode as LexicalTableCellNode,
  TableNode as LexicalTableNode,
  TableRowNode as LexicalTableRowNode,
} from "@lexical/table";

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
    {
      replace: LexicalTableNode,
      with: (node: LexicalTableNode) => new TableNode(),
    },
    {
      replace: LexicalTableCellNode,
      with: (node: LexicalTableCellNode) =>
        new TableCellNode(
          node.__headerState,
          node.__colSpan,
          node.__width,
        ),
    },
    LexicalTableRowNode,
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
  html: htmlConfig,
} satisfies InitialConfigType & CreateEditorArgs;
