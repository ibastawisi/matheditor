import { LayoutContainerNode, LayoutItemNode } from "@/editor";
import { Table, TableBorders, TableCell, TableRow } from "docx";
import { $convertNodeToDocx } from ".";

export function $convertLayoutNode(node: LayoutContainerNode) {
  const template = node.getTemplateColumns().split(' ').map(parseFloat);
  const templateSum = template.reduce((a, b) => a + b, 0);
  const layoutItemNodes = node.getChildren<LayoutItemNode>();
  const tableCells = layoutItemNodes.map((node, index) => {
    const children = $convertNodeToDocx(node) as any;
    const width = 100 * template[index] / templateSum;
    return new TableCell({
      children: Array.isArray(children) ? children : [children],
      width: { size: width, type: 'pct' },
    })
  });

  return new Table({
    rows: [new TableRow({ children: tableCells, })],
    width: { size: 100, type: 'pct', },
    columnWidths: template.map((width) => 600 * 15 * width / templateSum),
    borders: TableBorders.NONE,
    layout: 'fixed',
  });
}