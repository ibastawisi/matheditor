import { HeadingNode, QuoteNode } from "@lexical/rich-text";
import { TableCellNode, TableNode } from "./nodes/TableNode";
import { ListItemNode, ListNode } from "@lexical/list";
import { CodeHighlightNode, CodeNode } from "@lexical/code";
import 'prismjs/components/prism-csharp';
import { AutoLinkNode, LinkNode } from "@lexical/link";
import { HorizontalRuleNode } from "@/editor/nodes/HorizontalRuleNode";
import { MathNode } from "./nodes/MathNode";
import { ImageNode } from "./nodes/ImageNode";
import { SketchNode } from './nodes/SketchNode';
import { GraphNode } from './nodes/GraphNode';
import { StickyNode } from './nodes/StickyNode';
import theme from "./theme";
import { PageBreakNode } from "./nodes/PageBreakNode";
import { IFrameNode } from "./nodes/IFrameNode";
import { LayoutContainerNode, LayoutItemNode } from "./nodes/LayoutNode";
import type { InitialConfigType } from "@lexical/react/LexicalComposer";
import type { CreateEditorArgs } from "lexical";
import { htmlConfig } from "./utils/htmlConfig";
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
      with: (node: any) => new TableNode(),
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
    StickyNode,
    PageBreakNode,
    IFrameNode,
    LayoutContainerNode,
    LayoutItemNode,
  ],
  html: htmlConfig,
} satisfies InitialConfigType & CreateEditorArgs;