import { LayoutContainerNode, LayoutItemNode } from "@/editor";
import { Table, TableCell, TableRow } from "docx";
import { $convertNodeToDocx } from ".";

export function $convertLayoutNode(node: LayoutContainerNode) {
  const template = node.getTemplateColumns();
  const layoutItemNodes = node.getChildren<LayoutItemNode>();
  const tableCellsChildren = layoutItemNodes.map(node => $convertNodeToDocx(node));
  return new Table({
    rows: [
      new TableRow({
        children: layoutItemNodes.map((node, index) => new TableCell({
          children: tableCellsChildren[index] as any,
          width: { size: 100 * parseInt(template.split(' ')[index]) / layoutItemNodes.length, type: 'pct' },
          borders: { top: { size: 1, style: 'none' }, bottom: { size: 1, style: 'none' }, left: { size: 1, style: 'none' }, right: { size: 1, style: 'none' } },
        })),
      })
    ],
    width: { size: 100, type: 'pct', },
    borders: { top: { style: 'none' }, bottom: { style: 'none' }, left: { style: 'none' }, right: { style: 'none' } },
    layout: 'fixed',
  });
}