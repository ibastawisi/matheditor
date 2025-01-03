import { TableCellHeaderStates, TableCellNode, TableNode, TableRowNode } from "@/editor";
import { BookmarkEnd, BookmarkStart, bookmarkUniqueNumericIdGen, Paragraph, Table, TableCell, TableRow } from "docx";
import { $convertNodeToDocx } from ".";
import { $getNodeStyleValueForProperty } from "@/editor/nodes/utils";
import { editor } from "../generateDocx";

export function $convertTableNode(node: TableNode) {
  const rows = node.getChildren<TableRowNode>().map($convertTableRowNode);
  const { element } = node.exportDOM(editor);
  const id = (element as HTMLElement).id;
  const linkId = bookmarkUniqueNumericIdGen()();
  const float = $getNodeStyleValueForProperty(node, 'float').replace('none', '');
  return [
    new BookmarkStart(id, linkId),
    new Table({
      rows: rows,
      width: float ? undefined : { size: 100, type: 'pct', },
      margins: { top: 8 * 15, right: 8 * 15, bottom: 8 * 15, left: 8 * 15, },
      borders: { top: { color: '#cccccc', style: 'single' }, bottom: { color: '#cccccc', style: 'single' }, left: { color: '#cccccc', style: 'single' }, right: { color: '#cccccc', style: 'single' } },
      float: float ? {
        horizontalAnchor: 'text',
        verticalAnchor: 'text',
        relativeHorizontalPosition: float === 'left' ? 'left' : 'right',
        relativeVerticalPosition: 'bottom',
        overlap: 'never',
        leftFromText: float === 'right' ? 16 * 15 : 0,
        rightFromText: float === 'left' ? 16 * 15 : 0,
        topFromText: 0,
        bottomFromText: 8 * 15,
      } : undefined,
      layout: float ? 'autofit' : 'fixed',
    }),
    new BookmarkEnd(linkId),
    new Paragraph({ spacing: { before: float ? 0 : 8 * 15, after: 0, line: 0 } }),
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
  const children = node.getChildren().map($convertNodeToDocx).filter(Boolean).flat();
  const colSpan = node.getColSpan();
  const rowSpan = node.getRowSpan();
  const width = node.getWidth();
  const writingMode = $getNodeStyleValueForProperty(node, 'writing-mode');
  const color = $getNodeStyleValueForProperty(node, 'color').replace('inherit', '') || undefined;
  const isHeader = node.getHeaderStyles() !== TableCellHeaderStates.NO_STATUS;
  const backgroundColor = $getNodeStyleValueForProperty(node, 'background-color', isHeader ? '#f5f5f5' : '').replace('inherit', '') || undefined;

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