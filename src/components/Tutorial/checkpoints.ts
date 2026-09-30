import { $getNodeStyleValueForProperty } from "@/editor/extensions/shared/utils";
import { $isLinkNode } from "@lexical/link";
import { LexicalNode, $isParagraphNode, $isTextNode } from "lexical";
import { $isCodeNode } from "@lexical/code-core";
import { $isGraphNode } from "@/editor/extensions/graph/nodes";
import { $isHeadingNode, $isQuoteNode } from "@lexical/rich-text";
import { $isHorizontalRuleNode } from "@/editor/extensions/horizontal-rule/nodes";
import { $isMathNode } from "@/editor/extensions/math/nodes";
import { $isSketchNode } from "@/editor/extensions/sketch/nodes";
import { $isStickyNode } from "@/editor/extensions/sticky/nodes";
import { $isTableNode } from "@lexical/table";
import { $isListNode } from "@lexical/list";

export const checkpoints: Array<Array<(node: LexicalNode) => boolean>> = [
  [
    (node) => $isParagraphNode(node) && node.getChildren().filter($isTextNode).some(n => n.hasFormat('bold')),
    (node) => $isParagraphNode(node) && node.getChildren().filter($isTextNode).some(n => n.hasFormat('italic')),
    (node) => $isParagraphNode(node) && node.getChildren().filter($isTextNode).some(n => n.hasFormat('underline')),
    (node) => $isParagraphNode(node) && node.getChildren().filter($isTextNode).some(n => n.hasFormat('highlight')),
    (node) => $isParagraphNode(node) && node.getChildren().filter($isTextNode).some(n => n.hasFormat('code')),
    (node) => $isParagraphNode(node) && node.getChildren().filter($isTextNode).some(n => n.hasFormat('strikethrough')),
    (node) => $isParagraphNode(node) && node.getChildren().filter($isTextNode).some(n => n.getTextContent() === 'subscript' && n.hasFormat('subscript')),
    (node) => $isParagraphNode(node) && node.getChildren().filter($isTextNode).some(n => n.getTextContent() === 'superscript' && n.hasFormat('superscript')),
    (node) => $isParagraphNode(node) && node.getChildren().filter($isLinkNode).some(n => n.getTextContent() === 'Google' && n.getURL().includes('google.com')),
    (node) => $isParagraphNode(node) && node.getChildren().filter($isTextNode).some(n => !!$getNodeStyleValueForProperty(n, 'color', '')),
    (node) => $isParagraphNode(node) && node.getChildren().filter($isTextNode).some(n => !!$getNodeStyleValueForProperty(n, 'background-color', '')),
  ],
  [
    (node) => $isParagraphNode(node) && node.getChildren().filter($isTextNode).some(n => $getNodeStyleValueForProperty(n, 'font-size', '') === '20px'),
    (node) => $isParagraphNode(node) && node.getChildren().filter($isTextNode).some(n => $getNodeStyleValueForProperty(n, 'font-family', '') === 'KaTeX_Main'),
  ],
  [
    (node) => $isHeadingNode(node) && node.getTag() === 'h3',
    (node) => $isListNode(node) && node.getListType() === 'bullet',
    (node) => $isQuoteNode(node),
    (node) => $isCodeNode(node),
  ],
  [
    (node) => $isParagraphNode(node) && node.getFormat() === 2,
    (node) => $isParagraphNode(node) && node.getFormat() === 3,
    (node) => $isParagraphNode(node) && node.getIndent() === 1,
  ],
  [
    (node) => $isHorizontalRuleNode(node) || $isHorizontalRuleNode(node.getNextSibling()),
    (node) => $isParagraphNode(node) && node.getChildren().some($isMathNode),
    (node) => $isParagraphNode(node) && node.getChildren().some($isGraphNode),
    (node) => $isParagraphNode(node) && node.getChildren().some($isSketchNode),
    (node) => $isParagraphNode(node) && node.getChildren().some(n => n.getType() === 'image'),
    (node) => $isTableNode(node) || $isTableNode(node.getNextSibling()),
    (node) => $isStickyNode(node) || $isStickyNode(node.getNextSibling()) || ($isParagraphNode(node) && node.getChildren().some($isStickyNode)),
  ]
];
