import { $isImageNode, ElementNode, ImageNode, isHTMLElement, ParagraphNode } from "@/editor";
import { Bookmark, convertInchesToTwip, ImageRun, IParagraphOptions, Paragraph, Table, TableBorders, TableCell, TableRow, TextRun } from "docx";
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
  const newWidth = Math.min(width, 600);
  const newHeight = newWidth * aspect;

  const imageRun = new ImageRun({
    type,
    data,
    altText: { title: altText, description: altText, name: altText },
    transformation: { width: newWidth, height: newHeight, },
    fallback: { type: 'png', data, },
  });
  const showCaption = node.getShowCaption();
  const caption = node.__caption;
  const captionChildren = showCaption ? caption.getEditorState().read($convertEditortoDocx) : [];
  const { element } = node.exportDOM(editor);
  const id = (isHTMLElement(element) && element.id) || '';

  const parent = node.getParent() as ParagraphNode;
  const alignment = parent.getFormatType().replace('justify', 'both') as IParagraphOptions['alignment'];
  const indent = parent.getIndent();

  if (!showCaption) return new Bookmark({ id, children: [imageRun] });

  return new Table({
    rows: [
      new TableRow({
        children: [
          new TableCell({
            children: [
              new Paragraph({
                children: [new Bookmark({ id, children: [imageRun] })],
                alignment, indent: { left: convertInchesToTwip(indent / 2) },
              })],
          }),
        ],
      }),
      new TableRow({
        children: [
          new TableCell({
            children: captionChildren,
          })
        ],
      }),
    ],
    borders: TableBorders.NONE,
    layout: 'fixed',
    width: { size: 100, type: 'pct' },
  });
}

export function $hasImageChildren(node: ElementNode): boolean {
  return node.getChildren().some($isImageNode);
}