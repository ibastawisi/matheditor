import { LayoutContainerNode, LayoutItemNode, TableCellHeaderStates, TableCellNode, TableRowNode } from "@/editor";
import { Table, TableCell, TableRow } from "docx";
import { $convertNodeToDocx } from ".";
import { $getNodeStyleValueForProperty } from "@/editor/nodes/utils";

export function $convertLayoutNode(node: LayoutContainerNode) {
  const template = node.getTemplateColumns();
  const layoutItemNodes = node.getChildren<LayoutItemNode>();
  const tableCellsChildren = layoutItemNodes.map(node => $convertNodeToDocx(node));
  return [
    new Table({
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
      borders: { top: { size: 0, style: 'none' }, bottom: { size: 0, style: 'none' }, left: { size: 0, style: 'none' }, right: { size: 0, style: 'none' } },
      layout: 'fixed',
    }),
  ];
}