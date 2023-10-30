"use client"
/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import {
  $convertFromMarkdownString,
  $convertToMarkdownString,
  CHECK_LIST,
  ELEMENT_TRANSFORMERS,
  ElementTransformer,
  TEXT_FORMAT_TRANSFORMERS,
  TEXT_MATCH_TRANSFORMERS,
  TextMatchTransformer,
  Transformer,
} from '@lexical/markdown';
import {
  $createTextNode,
  $isParagraphNode,
  $isTextNode,
  ElementNode,
  LexicalEditor,
  LexicalNode,
} from 'lexical';

import {
  $createHorizontalRuleNode,
  $isHorizontalRuleNode,
  HorizontalRuleNode,
} from '../../nodes/HorizontalRuleNode';

import {
  $createTableCellNode,
  $createTableNode,
  $createTableRowNode,
  $isTableCellNode,
  $isTableNode,
  $isTableRowNode,
  TableCellHeaderStates,
  TableCellNode,
  TableNode,
  TableRowNode,
} from '../../nodes/TableNode';
import { $createMathNode, $isMathNode, MathNode } from '../../nodes/MathNode';
import { $createImageNode, $isImageNode, ImageNode } from '../../nodes/ImageNode';
import { $createGraphNode, $isGraphNode, GraphNode } from '../../nodes/GraphNode';
import { $createSketchNode, $isSketchNode, SketchNode } from '../../nodes/SketchNode';
import { $createStickyNode, $isStickyNode, StickyNode } from '../../nodes/StickyNode';
import { $createCodeNode, $isCodeNode, CodeNode } from '../../nodes/CodeNode';

export const HR: ElementTransformer = {
  dependencies: [HorizontalRuleNode],
  export: (node: LexicalNode) => {
    return $isHorizontalRuleNode(node) ? '***' : null;
  },
  regExp: /^(---|\*\*\*|___)\s?$/,
  replace: (parentNode, _1, _2, isImport) => {
    const line = $createHorizontalRuleNode();

    // TODO: Get rid of isImport flag
    if (isImport || parentNode.getNextSibling() != null) {
      parentNode.replace(line);
    } else {
      parentNode.insertBefore(line);
    }

    line.selectNext();
  },
  type: 'element',
};

export const IMAGE: TextMatchTransformer = {
  dependencies: [ImageNode],
  export: (node) => {
    if (!$isImageNode(node)) {
      return null;
    }

    return `![${node.getAltText()}](${node.getSrc()})`;
  },
  importRegExp: /!(?:\[([^[]*)\])(?:\(([^(]+)\))/,
  regExp: /!(?:\[([^[]*)\])(?:\(([^(]+)\))$/,
  replace: (textNode, match) => {
    const [, altText, src] = match;
    const imageNode = $createImageNode({
      altText,
      src,
      width: 0,
      height: 0,
    });
    textNode.replace(imageNode);
  },
  trigger: ')',
  type: 'text-match',
};

export const GRAPH: TextMatchTransformer = {
  dependencies: [GraphNode],
  export: (node) => {
    if (!$isGraphNode(node)) {
      return null;
    }
    const src = node.getSrc();
    const altText = node.getType();
    const url = src.startsWith('data:image/svg+xml') ? svgtoBase64(src) : src;
    return `![${altText}](${url})`;
  },
  importRegExp: /<graph src="([^"]+?)" value="([^"]+?)"\s?\/>\s?/,
  regExp: /<graph src="([^"]+?)" value="([^"]+?)"\s?\/>\s?$/,
  replace: (textNode, match) => {
    const [, src, value] = match;
    const graphNode = $createGraphNode({ src, value, width: 0, height: 0 });
    textNode.replace(graphNode);
  },
  trigger: '>',
  type: 'text-match',
};

export const SKETCH: TextMatchTransformer = {
  dependencies: [SketchNode],
  export: (node) => {
    if (!$isSketchNode(node)) {
      return null;
    }
    const src = node.getSrc();
    const altText = node.getType();
    const url = svgtoBase64(src);
    return `![${altText}](${url})`;
  },
  importRegExp: /<sketch src="([^"]+?)"\s?\/>\s?/,
  regExp: /<sketch src="([^"]+?)"\s?\/>\s?$/,
  replace: (textNode, match) => {
    const [, src] = match;
    const sketchNode = $createSketchNode({ src, width: 0, height: 0 });
    textNode.replace(sketchNode);
  },
  trigger: '>',
  type: 'text-match',
};

export const STICKY: TextMatchTransformer = {
  dependencies: [],
  export: (node) => {
    if (!$isStickyNode(node)) {
      return null;
    }
    const key = node.getKey();
    return `<sticky key="${key}" />`;
  },
  importRegExp: /<sticky\s?\/>\s?/,
  regExp: /<sticky\s?\/>\s?$/,
  replace: (textNode, match) => {
    const stickyNode = $createStickyNode();
    textNode.replace(stickyNode);
  },
  trigger: '>',
  type: 'text-match',
};

const svgtoBase64 = (dataURI: string) => {
  const data = dataURI.split("data:image/svg+xml,")[1];
  const base64 = btoa(unescape(data));
  return `data:image/svg+xml;base64,${base64}`;
}

export const MATH: TextMatchTransformer = {
  dependencies: [MathNode],
  export: (node, exportChildren, exportFormat) => {
    if (!$isMathNode(node)) {
      return null;
    }

    return `$${node.getValue()}$`;
  },
  importRegExp: /\$+(.*?)\$+/,
  regExp: /\$+(.*?)\$+$/,
  replace: (textNode, match) => {
    const [, value] = match;
    const mathNode = $createMathNode(value);
    textNode.replace(mathNode);
    mathNode.select();
  },
  trigger: '$',
  type: 'text-match',
};

const createBlockNode = (
  createNode: (match: Array<string>) => ElementNode,
): ElementTransformer['replace'] => {
  return (parentNode, children, match) => {
    const node = createNode(match);
    node.append(...children);
    parentNode.replace(node);
    node.select(0, 0);
  };
};

export const CODE: ElementTransformer = {
  dependencies: [CodeNode],
  export: (node: LexicalNode) => {
    if (!$isCodeNode(node)) {
      return null;
    }
    const textContent = node.getTextContent();
    return (
      '```' +
      (node.getLanguage() || '') +
      (textContent ? '\n' + textContent : '') +
      '\n' +
      '```'
    );
  },
  regExp: /^```(\w{1,10})?\s/,
  replace: createBlockNode((match) => {
    return $createCodeNode(match ? match[1] : undefined);
  }),
  type: 'element',
};

// Very primitive table setup
const TABLE_ROW_REG_EXP = /^(?:\|)(.+)(?:\|)\s?$/;
const TABLE_ROW_DIVIDER_REG_EXP = /^(\| ?:?-*:? ?)+\|\s?$/;

export const TABLE: ElementTransformer = {
  dependencies: [TableNode, TableRowNode, TableCellNode],
  export: (node: LexicalNode) => {
    if (!$isTableNode(node)) {
      return null;
    }

    const output: string[] = [];

    for (const row of node.getChildren()) {
      const rowOutput = [];
      if (!$isTableRowNode(row)) {
        continue;
      }

      let isHeaderRow = false;
      for (const cell of row.getChildren()) {
        // It's TableCellNode so it's just to make flow happy
        if ($isTableCellNode(cell)) {
          rowOutput.push(
            $convertToMarkdownString(TRANSFORMERS, cell).replace(
              /\n/g,
              '\\n',
            ),
          );
          if (cell.__headerState === TableCellHeaderStates.ROW) {
            isHeaderRow = true;
          }
        }
      }

      output.push(`| ${rowOutput.join(' | ')} |`);
      if (isHeaderRow) {
        output.push(`| ${rowOutput.map((_) => '---').join(' | ')} |`);
      }
    }

    return output.join('\n');
  },
  regExp: TABLE_ROW_REG_EXP,
  replace: (parentNode, _1, match) => {
    // Header row
    if (TABLE_ROW_DIVIDER_REG_EXP.test(match[0])) {
      const table = parentNode.getPreviousSibling();
      if (!table || !$isTableNode(table)) {
        return;
      }

      const rows = table.getChildren();
      const lastRow = rows[rows.length - 1];
      if (!lastRow || !$isTableRowNode(lastRow)) {
        return;
      }

      // Add header state to row cells
      lastRow.getChildren().forEach((cell) => {
        if (!$isTableCellNode(cell)) {
          return;
        }
        cell.toggleHeaderStyle(TableCellHeaderStates.ROW);
      });

      // Remove line
      parentNode.remove();
      return;
    }

    const matchCells = mapToTableCells(match[0]);

    if (matchCells == null) {
      return;
    }

    const rows = [matchCells];
    let sibling = parentNode.getPreviousSibling();
    let maxCells = matchCells.length;

    while (sibling) {
      if (!$isParagraphNode(sibling)) {
        break;
      }

      if (sibling.getChildrenSize() !== 1) {
        break;
      }

      const firstChild = sibling.getFirstChild();

      if (!$isTextNode(firstChild)) {
        break;
      }

      const cells = mapToTableCells(firstChild.getTextContent());

      if (cells == null) {
        break;
      }

      maxCells = Math.max(maxCells, cells.length);
      rows.unshift(cells);
      const previousSibling = sibling.getPreviousSibling();
      sibling.remove();
      sibling = previousSibling;
    }

    const table = $createTableNode();

    for (const cells of rows) {
      const tableRow = $createTableRowNode();
      table.append(tableRow);

      for (let i = 0; i < maxCells; i++) {
        tableRow.append(i < cells.length ? cells[i] : createTableCell(''));
      }
    }

    const previousSibling = parentNode.getPreviousSibling();
    if (
      $isTableNode(previousSibling) &&
      getTableColumnsSize(previousSibling) === maxCells
    ) {
      previousSibling.append(...table.getChildren());
      parentNode.remove();
    } else {
      parentNode.replace(table);
    }

    table.selectEnd();
  },
  type: 'element',
};

function getTableColumnsSize(table: TableNode) {
  const row = table.getFirstChild();
  return $isTableRowNode(row) ? row.getChildrenSize() : 0;
}

const createTableCell = (textContent: string): TableCellNode => {
  textContent = textContent.replace(/\\n/g, '\n');
  const cell = $createTableCellNode(TableCellHeaderStates.NO_STATUS);
  $convertFromMarkdownString(textContent, TRANSFORMERS, cell);
  return cell;
};

const mapToTableCells = (textContent: string): Array<TableCellNode> | null => {
  const match = textContent.match(TABLE_ROW_REG_EXP);
  if (!match || !match[1]) {
    return null;
  }
  return match[1].split('|').map((text) => createTableCell(text));
};

export const TRANSFORMERS: Array<Transformer> = [
  TABLE,
  HR,
  IMAGE,
  GRAPH,
  SKETCH,
  MATH,
  STICKY,
  CHECK_LIST,
  ...ELEMENT_TRANSFORMERS,
  ...TEXT_FORMAT_TRANSFORMERS,
  ...TEXT_MATCH_TRANSFORMERS,
  CODE,
];

export default function createMarkdownTransformers(editor: LexicalEditor): Array<Transformer> {
  const TRANSFORMERS: Array<Transformer> = [
    HR,
    MATH,
    CHECK_LIST,
    ...ELEMENT_TRANSFORMERS,
    ...TEXT_FORMAT_TRANSFORMERS,
    ...TEXT_MATCH_TRANSFORMERS,
    CODE,
  ];
  if (editor.hasNode(TableNode)) TRANSFORMERS.unshift(TABLE);
  if (editor.hasNode(ImageNode)) TRANSFORMERS.unshift(IMAGE);
  if (editor.hasNode(GraphNode)) TRANSFORMERS.unshift(GRAPH);
  if (editor.hasNode(SketchNode)) TRANSFORMERS.unshift(SKETCH);
  if (editor.hasNode(StickyNode)) TRANSFORMERS.unshift(STICKY);
  return TRANSFORMERS;
} 