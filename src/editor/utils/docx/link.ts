import { $getEditor, $getRoot, $isElementNode, $isImageNode, $isLinkNode, $isMathNode, $isTableNode, $isTabNode, isHTMLElement, LexicalNode, LinkNode } from "@/editor";
import { Bookmark, ExternalHyperlink, Paragraph, ParagraphChild } from "docx";
import { $convertNodeToDocx } from ".";
import { editor } from "../generateDocx";

export function $convertLinkNode(node: LinkNode): any {
  const url = node.getURL();
  const children = node.getChildren().map($convertNodeToDocx);
  return new ExternalHyperlink({ link: url, children: children as any });
}

export function $hasBookmark(node: LexicalNode): boolean {
  return $isLinkNode(node) && node.getRel() === 'bookmark' || $isMathNode(node) || $isImageNode(node);
}

export function $hasBookmarkChildren(node: LexicalNode): boolean {
  if (!$isElementNode(node)) return false;
  return node.getChildren().some($hasBookmark);
}

export function $addBookmark(node: LexicalNode) {
  const shouldAddBookmark = $hasBookmark(node);
  const children = $convertNodeToDocx(node) as ParagraphChild;
  if (!shouldAddBookmark) return children;
  if ($isLinkNode(node)) return new Bookmark({ id: node.getURL().slice(1), children: [children] });
  const { element } = node.exportDOM(editor);
  if (!(isHTMLElement(element) && element.id)) return children;
  if ($isMathNode(node)) return new Bookmark({ id: element.id, children: [children] });
  if ($isImageNode(node)) return new Bookmark({ id: element.id, children: [children] });
  return children;
}