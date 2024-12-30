import { TableCellHeaderStates, TableCellNode, TableNode, TableRowNode } from "@/editor";
import { BookmarkEnd, BookmarkStart, bookmarkUniqueNumericIdGen, Table, TableCell, TableRow } from "docx";
import { $convertNodeToDocx } from ".";
import { $getNodeStyleValueForProperty } from "@/editor/nodes/utils";
import { editor } from "../generateDocx";

export function $convertTableNode(node: TableNode) {
  const rows = node.getChildren<TableRowNode>().map($convertTableRowNode);
  const { element } = node.exportDOM(editor);
  const id = (element as HTMLElement).id;
  const linkId = bookmarkUniqueNumericIdGen()();
  return [
    new BookmarkStart(id, linkId),
    new Table({
      rows: rows,
      width: { size: 100, type: 'pct', },
      margins: { top: 8 * 15, right: 8 * 15, bottom: 0, left: 8 * 15, },
      borders: { top: { color: '#cccccc', style: 'single' }, bottom: { color: '#cccccc', style: 'single' }, left: { color: '#cccccc', style: 'single' }, right: { color: '#cccccc', style: 'single' } },
    }),
    new BookmarkEnd(linkId),
  ];
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
  const children = node.getChildren().map($convertNodeToDocx);
  const colSpan = node.getColSpan();
  const rowSpan = node.getRowSpan();
  const width = node.getWidth();
  const writingMode = $getNodeStyleValueForProperty(node, 'writing-mode');
  const color = $getNodeStyleValueForProperty(node, 'color').replace('inherit', '') || undefined;
  const backgroundColor = $getNodeStyleValueForProperty(node, 'background-color').replace('inherit', '') || undefined;

  return new TableCell({
    columnSpan: colSpan,
    rowSpan: rowSpan,
    width: width ? { size: width * 15, type: 'dxa' } : { size: 100 / colCount, type: 'pct' },
    shading: { fill: backgroundColor, color },
    textDirection: writingMode === 'vertical-rl' ? 'tbRl' : undefined,
    verticalAlign: 'center',
    borders: { top: { color: '#cccccc', style: 'single' }, bottom: { color: '#cccccc', style: 'single' }, left: { color: '#cccccc', style: 'single' }, right: { color: '#cccccc', style: 'single' } },
    children: children as any,
  });
}