import { $findMatchingParent, $isHeadingNode, $isLinkNode, $isListItemNode, $isTableCellNode } from "@/editor";
import { $getNodeStyleValueForProperty } from "@/editor/nodes/utils";
import { TextRun } from "docx";
import { TextNode } from "lexical";

export function $convertTextNode(node: TextNode) {
  const textContent = node.getTextContent();
  const parent = node.getParent();
  const isHeadingText = $isHeadingNode(parent);
  const isCheckedText = $isListItemNode(parent) && parent.getChecked();
  const isLinkText = $isLinkNode(parent);
  const nearestTableCell = $findMatchingParent(node, $isTableCellNode);
  const tableCellColor = nearestTableCell ? $getNodeStyleValueForProperty(nearestTableCell, 'color').replace('inherit', '') : undefined;
  const fontsizeInPx = parseInt($getNodeStyleValueForProperty(node, 'font-size'));
  const backgroundColor = $getNodeStyleValueForProperty(node, 'background-color').replace('inherit', '') || undefined;
  const textRun = new TextRun({
    text: textContent,
    bold: node.hasFormat('bold') || isHeadingText,
    italics: node.hasFormat('italic'),
    strike: node.hasFormat('strikethrough') || isCheckedText,
    underline: node.hasFormat('underline') ? { type: "single" } : undefined,
    color: $getNodeStyleValueForProperty(node, 'color') || tableCellColor,
    highlight: node.hasFormat('highlight') ? 'yellow' : undefined,
    subScript: node.hasFormat('subscript'),
    superScript: node.hasFormat('superscript'),
    font: node.hasFormat('code') ? 'Consolas' : $getNodeStyleValueForProperty(node, 'font-family'),
    size: fontsizeInPx ? `${fontsizeInPx * 0.75}pt` : undefined,
    shading: backgroundColor || node.hasFormat('code') ? ({
      fill: node.hasFormat('code') ? '#F2F4F6' : backgroundColor,
    }) : undefined,
    style: isLinkText ? 'Hyperlink' : undefined,
  });

  return textRun;

}