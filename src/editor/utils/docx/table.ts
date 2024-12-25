import { TableCellHeaderStates, TableCellNode, TableNode, TableRowNode } from "@/editor";
import { Table, TableCell, TableRow } from "docx";
import { $exportNodeToDocx } from ".";
import { $getNodeStyleValueForProperty } from "@/editor/nodes/utils";

export function $convertTableNode(node: TableNode) {
  const rows = node.getChildren<TableRowNode>().map($convertTableRowNode);

  return new Table({
    rows: rows,
    width: {
      size: 100,
      type: 'pct',
    },
    margins: {
      top: 8 * 15,
      right: 8 * 15,
      bottom: 0,
      left: 8 * 15,
    },
  });
}

function $convertTableRowNode(node: TableRowNode) {
  const cellNodes = node.getChildren<TableCellNode>();
  const cells = cellNodes.map($convertTableCellNode);
  const isHeader = cellNodes.some((cell) => cell.getHeaderStyles() & TableCellHeaderStates.ROW);
  const height = node.getHeight();

  return new TableRow({
    children: cells,
    tableHeader: isHeader,
    height: height ? { value: height * 15, rule: 'atLeast' } : undefined,
  });
}


function $convertTableCellNode(node: TableCellNode) {
  const rowNode = node.getParent<TableRowNode>()!;
  const colCount = rowNode.getChildren().length;
  const children = node.getChildren().map($exportNodeToDocx);
  const colSpan = node.getColSpan();
  const rowSpan = node.getRowSpan();
  const width = node.getWidth();
  const writingMode = $getNodeStyleValueForProperty(node, 'writing-mode');
  const backgroundColor = $getNodeStyleValueForProperty(node, 'background-color').replace('inherit', '');

  return new TableCell({
    columnSpan: colSpan,
    rowSpan: rowSpan,
    width: width ? { size: width * 15, type: 'dxa' } : { size: 100 / colCount, type: 'pct' },
    shading: {
      fill: backgroundColor ? backgroundColor : undefined,
    },
    textDirection: writingMode === 'vertical-rl' ? 'tbRl' : undefined,
    verticalAlign: 'center',
    children: children as any,
  });
}