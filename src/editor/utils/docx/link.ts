import { LinkNode } from "@/editor";
import { BookmarkEnd, BookmarkStart, bookmarkUniqueNumericIdGen, ExternalHyperlink, ParagraphChild } from "docx";
import { $convertNodeToDocx } from ".";

export function $convertLinkNode(node: LinkNode): any {
  const url = node.getURL();
  const children = node.getChildren().map($convertNodeToDocx).filter(Boolean).flat() as ParagraphChild[];
  const shouldAddBookmark = node.getRel() === 'bookmark';
  const link = new ExternalHyperlink({ link: url, children });
  if (!shouldAddBookmark) return link;
  const linkId = bookmarkUniqueNumericIdGen()();
  return [new BookmarkStart(url.slice(1), linkId), link, new BookmarkEnd(linkId)];
}
