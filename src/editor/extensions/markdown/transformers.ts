import {
  $convertFromMarkdownString,
  $convertToMarkdownString,
  CHECK_LIST,
  ELEMENT_TRANSFORMERS,
  ElementTransformer,
  MULTILINE_ELEMENT_TRANSFORMERS,
  MultilineElementTransformer,
  TEXT_FORMAT_TRANSFORMERS,
  TEXT_MATCH_TRANSFORMERS,
  TextMatchTransformer,
  Transformer,
} from "@lexical/markdown";
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
} from "@lexical/table";
import { $createParagraphNode, $isParagraphNode, $isTextNode, LexicalNode } from "lexical";
import { $wrapNodeInElement } from "@lexical/utils";

import {
  $createHorizontalRuleNode,
  $isHorizontalRuleNode,
  HorizontalRuleNode,
} from "@/editor/extensions/horizontal-rule/nodes";
import { $createMathNode, $isMathNode, MathNode } from "@/editor/extensions/math/nodes";
import { $createImageNode, $isImageNode, ImageNode } from "@/editor/extensions/image/nodes";
import { $createGraphNode, $isGraphNode, GraphNode } from "@/editor/extensions/graph/nodes";
import { $createSketchNode, $isSketchNode, SketchNode } from "@/editor/extensions/sketch/nodes";
import { $createStickyNode, $isStickyNode, StickyNode } from "@/editor/extensions/sticky/nodes";

const svgtoBase64 = (dataURI: string) => {
  const data = dataURI.split("data:image/svg+xml,")[1];
  const base64 = btoa(unescape(data));
  return `data:image/svg+xml;base64,${base64}`;
};

export const HR: ElementTransformer = {
  dependencies: [HorizontalRuleNode],
  export: (node: LexicalNode) => {
    return $isHorizontalRuleNode(node) ? "***" : null;
  },
  regExp: /^(---+|\*\*\*+|___+|===+)\s?$/,
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
  type: "element",
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
    const imageNode = $createImageNode({ altText, src, width: 0, height: 0 });
    textNode.replace(imageNode);
  },
  trigger: ")",
  type: "text-match",
};

export const GRAPH: TextMatchTransformer = {
  dependencies: [GraphNode],
  export: (node) => {
    if (!$isGraphNode(node)) {
      return null;
    }
    const src = node.getSrc();
    const altText = node.getType();
    const url = src.startsWith("data:image/svg+xml") ? svgtoBase64(src) : src;
    return `![${altText}](${url})`;
  },
  importRegExp: /<graph src="([^"]+?)" value="([^"]+?)"\s?\/>\s?/,
  regExp: /<graph src="([^"]+?)" value="([^"]+?)"\s?\/>\s?/,
  replace: (textNode, match) => {
    const [, src, value] = match;
    const graphNode = $createGraphNode({ src, value, width: 0, height: 0 });
    textNode.replace(graphNode);
  },
  trigger: ">",
  type: "text-match",
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
  trigger: ">",
  type: "text-match",
};

export const STICKY: TextMatchTransformer = {
  dependencies: [StickyNode],
  export: (node) => {
    if (!$isStickyNode(node)) {
      return null;
    }
    const key = node.getKey();
    return `<sticky key="${key}" />`;
  },
  importRegExp: /<sticky\s?\/>\s?/,
  regExp: /<sticky\s?\/>\s?/,
  replace: (textNode) => {
    const stickyNode = $createStickyNode();
    stickyNode.append($createParagraphNode());
    textNode.replace(stickyNode);
  },
  trigger: ">",
  type: "text-match",
};

export const MATH: TextMatchTransformer = {
  dependencies: [MathNode],
  export: (node) => {
    if (!$isMathNode(node)) {
      return null;
    }

    return `$${node.getValue()}$`;
  },
  importRegExp: /\$+(.*?)(?:\$+|$)|\\\((.*?)(?:\\\)|$)|\\\[(.*?)(?:\\\]|$)/,
  regExp: /\$+(.*?)\$+/,
  replace: (textNode, match) => {
    const value = match[1] || match[2] || match[3];
    if (!value && match[0] !== "$$") return;
    const style = textNode.getStyle();
    const mathNode = $createMathNode(value, style);
    textNode.replace(mathNode);
    if (!value) mathNode.select();
  },
  trigger: "$",
  type: "text-match",
};

export const MULTILINE_MATH: MultilineElementTransformer = {
  dependencies: [MathNode],
  export: (node: LexicalNode) => {
    if (!$isMathNode(node)) {
      return null;
    }
    const textContent = node.getValue();
    return "$$\n" + textContent + "\n$$";
  },
  regExpEnd: {
    optional: true,
    regExp: /\$+\s?$|\\\]\s?$|\\\)\s?$/,
  },
  regExpStart: /^[ \t]*(\$+|\\\[|\\\()\s?/,
  replace: (rootNode, children, startMatch, endMatch, linesInBetween) => {
    if (children || !linesInBetween) return false;
    // skip if joined text partially matches single line math
    const total = (startMatch[0] + linesInBetween.join("") + endMatch?.[0]).trim();
    const partial = total.match(MATH.importRegExp!)?.[0];
    if (total !== partial) return false;

    const mathNode = $createMathNode("", "");
    let math: string;

    if (linesInBetween.length === 1) {
      // Single-line math blocks
      math = linesInBetween[0];
    } else {
      // Multi-line math blocks
      // Filter out all start and end lines that are length 0 until we find the first line with content
      while (linesInBetween.length > 0 && !linesInBetween[0].length) {
        linesInBetween.shift();
      }

      // Filter out all end lines that are length 0 until we find the last line with content
      while (linesInBetween.length > 0 && !linesInBetween[linesInBetween.length - 1].length) {
        linesInBetween.pop();
      }

      math = linesInBetween.join("\n");
    }

    mathNode.setValue(math);
    rootNode.append(mathNode);

    if (mathNode.getParent()?.is(rootNode)) {
      $wrapNodeInElement(mathNode, () => {
        const paragraphNode = $createParagraphNode();
        paragraphNode.setFormat("center");
        return paragraphNode;
      });
      rootNode.append($createParagraphNode());
    }
  },
  type: "multiline-element",
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
      const rowOutput: string[] = [];
      if (!$isTableRowNode(row)) {
        continue;
      }

      let isHeaderRow = false;
      for (const cell of row.getChildren()) {
        if ($isTableCellNode(cell)) {
          rowOutput.push($convertToMarkdownString(TRANSFORMERS, cell).replace(/\n/g, "\\n").trim());
          if (cell.getHeaderStyles() === TableCellHeaderStates.ROW) {
            isHeaderRow = true;
          }
        }
      }

      output.push(`| ${rowOutput.join(" | ")} |`);
      if (isHeaderRow) {
        output.push(`| ${rowOutput.map(() => "---").join(" | ")} |`);
      }
    }

    return output.join("\n");
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
        cell.setHeaderStyles(TableCellHeaderStates.ROW, TableCellHeaderStates.ROW);
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
        tableRow.append(i < cells.length ? cells[i] : $createTableCell(""));
      }
    }

    const previousSibling = parentNode.getPreviousSibling();
    if ($isTableNode(previousSibling) && getTableColumnsSize(previousSibling) === maxCells) {
      previousSibling.append(...table.getChildren());
      parentNode.remove();
    } else {
      parentNode.replace(table);
    }

    table.selectEnd();
  },
  type: "element",
};

function getTableColumnsSize(table: TableNode) {
  const row = table.getFirstChild();
  return $isTableRowNode(row) ? row.getChildrenSize() : 0;
}

const $createTableCell = (textContent: string): TableCellNode => {
  textContent = textContent.replace(/\\n/g, "\n");
  const cell = $createTableCellNode(TableCellHeaderStates.NO_STATUS);
  $convertFromMarkdownString(textContent, TRANSFORMERS, cell);
  return cell;
};

const mapToTableCells = (textContent: string): Array<TableCellNode> | null => {
  const match = textContent.match(TABLE_ROW_REG_EXP);
  if (!match || !match[1]) {
    return null;
  }
  return match[1].split("|").map((text) => $createTableCell(text));
};

export const TRANSFORMERS: Array<Transformer> = [
  STICKY,
  SKETCH,
  GRAPH,
  IMAGE,
  TABLE,
  MATH,
  MULTILINE_MATH,
  HR,
  CHECK_LIST,
  ...ELEMENT_TRANSFORMERS,
  ...MULTILINE_ELEMENT_TRANSFORMERS,
  ...TEXT_FORMAT_TRANSFORMERS,
  ...TEXT_MATCH_TRANSFORMERS,
];
