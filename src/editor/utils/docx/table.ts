import { TableCellHeaderStates, TableCellNode, TableNode, TableRowNode } from "@/editor";
import { BookmarkEnd, BookmarkStart, bookmarkUniqueNumericIdGen, IParagraphOptions, Paragraph, Table, TableCell, TableRow } from "docx";
import { $convertNodeToDocx } from ".";
import { $getNodeStyleValueForProperty } from "@/editor/nodes/utils";

export function $convertTableNode(node: TableNode) {
  const rows = node.getChildren<TableRowNode>().map($convertTableRowNode);
  const columnCount = node.getColumnCount();
  const columnWidths = node.getColWidths();
  const float = $getNodeStyleValueForProperty(node, 'float').replace('none', '');
  const alignment = (node.getFormatType().replace('justify', 'both') || 'both') as IParagraphOptions['alignment'];
  const columnWidth = (float || alignment !== 'both') ? 75 * 15 : 600 * 15 / columnCount;
  const dir = node.getDirection();

  const table = new Table({
    rows: rows,
    visuallyRightToLeft: dir === 'rtl',
    width: (float || alignment !== 'both') ? undefined : { size: 100, type: 'pct', },
    columnWidths: columnWidths ? columnWidths.map((width) => width * 15) : Array(columnCount).fill(columnWidth),
    margins: { top: 8 * 15, right: 8 * 15, bottom: 8 * 15, left: 8 * 15, },
    borders: {
      top: { color: '#cccccc', style: 'single', size: 1, },
      bottom: { color: '#cccccc', style: 'single', size: 1, },
      left: { color: '#cccccc', style: 'single', size: 1, },
      right: { color: '#cccccc', style: 'single', size: 1, },
    },
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
    layout: (float || alignment !== 'both') ? 'autofit' : 'fixed',
    alignment,
  });

  const id = node.getId();
  if (!id) return [table, new Paragraph({ spacing: { before: float ? 0 : 8 * 15, after: 0, line: 0 } })];
  const linkId = bookmarkUniqueNumericIdGen()();
  return [
    new BookmarkStart(id, linkId),
    table,
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
  const TableNode = rowNode.getParent<TableNode>()!;
  const children = node.getChildren().map($convertNodeToDocx).filter(Boolean).flat();
  const colSpan = node.getColSpan();
  const rowSpan = node.getRowSpan();
  const width = node.getWidth();
  const writingMode = $getNodeStyleValueForProperty(node, 'writing-mode');
  const color = $getNodeStyleValueForProperty(node, 'color').replace('inherit', '') || undefined;
  const isHeader = node.getHeaderStyles() !== TableCellHeaderStates.NO_STATUS;
  const backgroundColor = $getNodeStyleValueForProperty(node, 'background-color', isHeader ? '#f5f5f5' : '').replace('inherit', '') || undefined;
  const float = $getNodeStyleValueForProperty(TableNode, 'float').replace('none', '');
  const alignment = TableNode.getFormatType().replace('justify', 'both') as IParagraphOptions['alignment'];
  const cellCount = rowNode.getChildrenSize();
  const cellWidth = width ? width * 15 : (float || alignment !== 'both') ? 75 * 15 : undefined;

  return new TableCell({
    columnSpan: colSpan,
    rowSpan: rowSpan,
    width: cellWidth ? { size: cellWidth, type: 'dxa' } : { size: 100 / cellCount, type: 'pct' },
    shading: { fill: backgroundColor, color },
    textDirection: writingMode === 'vertical-rl' ? 'tbRl' : undefined,
    verticalAlign: 'center',
    borders: {
      top: { color: '#cccccc', style: 'single', size: 1, },
      bottom: { color: '#cccccc', style: 'single', size: 1, },
      left: { color: '#cccccc', style: 'single', size: 1, },
      right: { color: '#cccccc', style: 'single', size: 1, },
    },
    children: children as any,
  });
}