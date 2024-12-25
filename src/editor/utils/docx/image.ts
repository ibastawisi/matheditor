import { ImageNode } from "@/editor";
import { ImageRun } from "docx";
import { $convertEditortoDocx } from ".";

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
  if (!showCaption || !caption) return imageRun;
  const captionChildren = caption.getEditorState().read($convertEditortoDocx);
  return [imageRun, ...captionChildren];
}