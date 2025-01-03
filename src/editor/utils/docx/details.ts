import { $isDetailsSummaryNode, DetailsContainerNode, DetailsContentNode, DetailsSummaryNode } from "@/editor";
import { Table, TableCell, TableRow } from "docx";
import { $convertNodeToDocx } from ".";

export function $convertDetailsNode(node: DetailsContainerNode) {
  const rows = node.getChildren<DetailsSummaryNode | DetailsContentNode>().map($convertTableRowNode);
  return new Table({
    rows: rows,
    width: { size: 100, type: 'pct', },
    margins: { top: 8 * 15, right: 8 * 15, bottom: 8 * 15, left: 8 * 15, },
    borders: { top: { color: '#cccccc', style: 'single' }, bottom: { color: '#cccccc', style: 'single' }, left: { color: '#cccccc', style: 'single' }, right: { color: '#cccccc', style: 'single' } },
  });
}

function $convertTableRowNode(node: DetailsSummaryNode | DetailsContentNode) {
  const children = node.getChildren().map($convertNodeToDocx).filter(Boolean).flat();
  const isHeader = $isDetailsSummaryNode(node);
  return new TableRow({
    children: [
      new TableCell({
        children: children as any,
        verticalAlign: 'center',
        shading: { fill: isHeader ? '#f5f5f5' : undefined },
        borders: { top: { color: '#cccccc', style: 'single' }, bottom: { color: '#cccccc', style: 'single' }, left: { color: '#cccccc', style: 'single' }, right: { color: '#cccccc', style: 'single' } },
      }),
    ],
    tableHeader: isHeader,
  });
}