import { HeadingNode, QuoteNode } from "@lexical/rich-text";
import { ListItemNode, ListNode } from "../ListNode";
import { CodeHighlightNode, CodeNode } from "../CodeNode";
import { AutoLinkNode, LinkNode } from "@lexical/link";
import { HorizontalRuleNode } from "@/editor/nodes/HorizontalRuleNode";
import { MathNode } from "../MathNode";
import theme from "../../theme";
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
    AutoLinkNode,
    LinkNode,
    HorizontalRuleNode,
    MathNode,
  ]
} satisfies InitialConfigType & CreateEditorArgs;
