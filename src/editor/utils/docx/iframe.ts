import { IFrameNode } from "@/editor/extensions/iframe/nodes";
import { ExternalHyperlink, TextRun } from "docx";

export function $convertIFrameNode(node: IFrameNode) {
  const url = node.getSrc();
  return new ExternalHyperlink({ link: url, children: [new TextRun({ text: url, style: 'Hyperlink' })] });
}
