import { $isStickyNode, ElementNode, ParagraphNode, StickyNode } from "@/editor";
import { convertInchesToTwip, IParagraphOptions, Paragraph, ParagraphChild, Table, TableCell, TableRow } from "docx";
import { $convertEditortoDocx, $convertNodeToDocx } from ".";
import { $getNodeStyleValueForProperty } from "@/editor/nodes/utils";

export function $convertStickyNode(node: StickyNode) {
  const nestedEditor = node.__editor;
  const children = nestedEditor.getEditorState().read($convertEditortoDocx);
  const color = $getNodeStyleValueForProperty(node, 'color').replace('inherit', '') || undefined;
  const backgroundColor = $getNodeStyleValueForProperty(node, 'background-color', '#bceac4').replace('inherit', '');
  const float = $getNodeStyleValueForProperty(node, 'float', 'right');
  return new Table({
    rows: [
      new TableRow({
        children: [
          new TableCell({
            children,
            borders: { top: { size: 1, style: 'none' }, bottom: { size: 1, style: 'none' }, left: { size: 1, style: 'none' }, right: { size: 1, style: 'none' } },
            shading: { fill: backgroundColor, color },
          }),
        ],
        height: { value: 160 * 15, rule: 'atLeast' },
      })
    ],
    width: { size: 300 * 15, type: 'dxa' },
    borders: { top: { style: 'none' }, bottom: { style: 'none' }, left: { style: 'none' }, right: { style: 'none' } },
    layout: 'fixed',
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

export function $hasStickyChildren(node: ElementNode): boolean {
  return node.getChildren().some($isStickyNode);
}

export function $convertContainerNode(node: ParagraphNode) {
  const children = node.getChildren().map($convertNodeToDocx).filter(Boolean).flat() as (ParagraphChild | Table)[];
  const tableIndices = children.map((child, index) => child instanceof Table ? index : -1).filter(index => index !== -1);
  const grouppedChildren = Array.from({ length: tableIndices.length + 2 }, (_, index) => {
    if (index % 2 === 1) return children[tableIndices[Math.floor(index / 2)]];
    const prevTableIndex = tableIndices[Math.floor((index - 1) / 2)];
    const nextTableIndex = tableIndices[Math.ceil(index - 1 / 2)];
    const slice = children.slice(prevTableIndex + 1, nextTableIndex);
    return slice.length > 0 ? slice : null;
  }).filter(Boolean) as (ParagraphChild[] | Table)[];

  const alignment = node.getFormatType().replace('justify', 'both') as IParagraphOptions['alignment'];
  const indent = node.getIndent();

  const rootChildren = grouppedChildren.map((children) => {
    if (children instanceof Table) return children;
    return new Paragraph({ children, spacing: { after: 0 }, alignment, indent: { left: convertInchesToTwip(indent / 2) } });
  });

  return rootChildren;
}