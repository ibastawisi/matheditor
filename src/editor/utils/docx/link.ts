import { $isElementNode, $isImageNode, $isLinkNode, $isMathNode, LexicalNode, LinkNode } from "@/editor";
import { Bookmark, ExternalHyperlink, ParagraphChild } from "docx";
import { $convertNodeToDocx } from ".";

export function $convertLinkNode(node: LinkNode): any {
  const url = node.getURL();
  const children = node.getChildren().map($convertNodeToDocx) as ParagraphChild[];
  const shouldAddBookmark = node.getRel() === 'bookmark';
  const link = new ExternalHyperlink({ link: url, children });
  if (!shouldAddBookmark) return link;
  return new Bookmark({ id: url.slice(1), children: [link] });
}

export function $hasBookmark(node: LexicalNode): boolean {
  return $isLinkNode(node) && node.getRel() === 'bookmark' || $isMathNode(node) || $isImageNode(node);
}

export function $hasBookmarkedChildren(node: LexicalNode): boolean {
  if (!$isElementNode(node)) return false;
  return node.getChildren().some($hasBookmark);
}