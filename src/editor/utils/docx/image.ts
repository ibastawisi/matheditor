import { ImageNode, isHTMLElement } from "@/editor";
import { BookmarkEnd, BookmarkStart, bookmarkUniqueNumericIdGen, ImageRun, TextRun } from "docx";
import { $convertEditortoDocx } from ".";
import { editor } from "../generateDocx";

export function $convertImageNode(node: ImageNode) {
  const dataURI = node.getSrc();
  const type = dataURI.split(",")[0].split(";")[0].split("/")[1].split("+")[0] as any;
  const src = dataURI.split(",")[1];
  const data = type === 'svg' ? Buffer.from(decodeURIComponent(src), 'utf-8') : Buffer.from(src, 'base64');
  const altText = node.getAltText();
  const width = node.getWidth();
  const height = node.getHeight();
  const aspect = height / width;
  const newWidth = global.Math.min(width, 600);
  const newHeight = newWidth * aspect;

  const imageRun = new ImageRun({
    type,
    data,
    altText: { title: altText, description: altText, name: altText },
    transformation: {
      width: newWidth,
      height: newHeight,
    },
    fallback: {
      type: 'png',
      data,
    },
  });
  const showCaption = node.getShowCaption();
  const caption = node.__caption;
  const captionChildren = showCaption? caption.getEditorState().read($convertEditortoDocx) : [];
  const { element } = node.exportDOM(editor);
  const id = (isHTMLElement(element) && element.id) || '';
  const linkId = bookmarkUniqueNumericIdGen()();
  return [new BookmarkStart(id, linkId), imageRun, new BookmarkEnd(linkId), new TextRun({ text: '', break: 1, vanish: !showCaption }), ...captionChildren];
}