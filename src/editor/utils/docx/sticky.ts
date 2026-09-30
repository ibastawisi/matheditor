import { StickyNode } from "@/editor/extensions/sticky/nodes";
import { Table, TableBorders, TableCell, TableRow } from "docx";
import { $convertChildrenToDocx } from ".";

export function $convertStickyNode(node: StickyNode) {
  const children = $convertChildrenToDocx(node);
  const color = node.getColor().replace('inherit', '') || undefined;
  const backgroundColor = node.getBackgroundColor().replace('inherit', '');
  const float = node.getFloat();
  return new Table({
    rows: [
      new TableRow({
        children: [
          new TableCell({
            children,
            shading: { fill: backgroundColor, color },
          }),
        ],
        height: { value: 160 * 15, rule: 'atLeast' },
      })
    ],
    width: { size: 300 * 15, type: 'dxa' },
    borders: TableBorders.NONE,
    layout: 'fixed',
    columnWidths: [300 * 15],
    float: {
      horizontalAnchor: 'text',
      verticalAnchor: 'text',
      relativeHorizontalPosition: float === 'left' ? 'left' : 'right',
      relativeVerticalPosition: 'bottom',
      overlap: 'never',
      leftFromText: float === 'right' ? 16 * 15 : 0,
      rightFromText: float === 'left' ? 16 * 15 : 0,
      topFromText: 0,
      bottomFromText: 0,
    },
    margins: { top: 20 * 15, right: 20 * 15, bottom: 20 * 15, left: 20 * 15 },
  });
}
