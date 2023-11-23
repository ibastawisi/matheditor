/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import type { TableCellNode } from './LexicalTableCellNode';
import type { Cell, Grid } from './LexicalTableSelection';
import type {
  DOMConversionMap,
  DOMConversionOutput,
  DOMExportOutput,
  EditorConfig,
  LexicalEditor,
  LexicalNode,
  NodeKey,
  SerializedElementNode,
  Spread,
} from 'lexical';

import { addClassNamesToElement, isHTMLElement } from '@lexical/utils';
import {
  $applyNodeReplacement,
  $getNearestNodeFromDOMNode,
  DEPRECATED_GridNode,
} from 'lexical';

import { $isTableCellNode } from './LexicalTableCellNode';
import { $isTableRowNode, TableRowNode } from './LexicalTableRowNode';
import { getTableGrid } from './LexicalTableSelectionHelpers';

export type SerializedTableNode = Spread<
  {
    style?: string;
  },
  SerializedElementNode
>;

/** @noInheritDoc */
export class TableNode extends DEPRECATED_GridNode {
  /** @internal */
  __grid?: Grid;
  __style?: string

  static getType(): string {
    return 'table';
  }

  static clone(node: TableNode): TableNode {
    const tableNode = new TableNode(node.__key);
    tableNode.__style = node.__style;
    return tableNode;
  }

  static importDOM(): DOMConversionMap | null {
    return {
      table: (_node: Node) => ({
        conversion: convertTableElement,
        priority: 1,
      }),
    };
  }

  static importJSON(_serializedNode: SerializedTableNode): TableNode {
    const tableNode = $createTableNode();
    tableNode.__style = _serializedNode.style;
    return tableNode;
  }

  constructor(key?: NodeKey) {
    super(key);
  }

  exportJSON(): SerializedTableNode {
    return {
      ...super.exportJSON(),
      style: this.__style,
      type: 'table',
      version: 1,
    };
  }

  createDOM(config: EditorConfig, editor?: LexicalEditor): HTMLElement {
    const tableElement = document.createElement('table');

    addClassNamesToElement(tableElement, config.theme.table);

    if (this.__style) {
      tableElement.style.cssText = this.__style;
    }

    return tableElement;
  }

  updateDOM(prevNode: TableNode): boolean {
    return (
      this.__style !== prevNode.__style
    );
  }

  exportDOM(editor: LexicalEditor): DOMExportOutput {
    const { element } = super.exportDOM(editor);

    if (element) {
      const element_ = element as HTMLTableCellElement;
      const style = this.getStyle();
      if (style) {
        element_.style.cssText += style;
      }
    }

    return {
      element,
      after: (tableElement) => {
        if (tableElement) {
          const newElement = tableElement.cloneNode() as ParentNode;
          const colGroup = document.createElement('colgroup');
          const tBody = document.createElement('tbody');
          if (isHTMLElement(tableElement)) {
            tBody.append(...tableElement.children);
          }
          const firstRow = this.getFirstChildOrThrow<TableRowNode>();

          if (!$isTableRowNode(firstRow)) {
            throw new Error('Expected to find row node.');
          }

          const colCount = firstRow.getChildrenSize();

          for (let i = 0; i < colCount; i++) {
            const col = document.createElement('col');
            colGroup.append(col);
          }

          newElement.replaceChildren(colGroup, tBody);

          return newElement as HTMLElement;
        }
      },
    };
  }

  // TODO 0.10 deprecate
  canExtractContents(): false {
    return false;
  }

  canBeEmpty(): false {
    return false;
  }

  isShadowRoot(): boolean {
    return true;
  }

  getStyle(): string | undefined {
    const self = this.getLatest();
    return self.__style;
  }

  setStyle(style: string): this {
    const self = this.getWritable();
    self.__style = style;
    return self;
  }

  getCordsFromCellNode(
    tableCellNode: TableCellNode,
    grid: Grid,
  ): { x: number; y: number } {
    const { rows, cells } = grid;

    for (let y = 0; y < rows; y++) {
      const row = cells[y];

      if (row == null) {
        continue;
      }

      const x = row.findIndex((cell) => {
        if (!cell) return;
        const { elem } = cell;
        const cellNode = $getNearestNodeFromDOMNode(elem);
        return cellNode === tableCellNode;
      });

      if (x !== -1) {
        return { x, y };
      }
    }

    throw new Error('Cell not found in table.');
  }

  getCellFromCords(x: number, y: number, grid: Grid): Cell | null {
    const { cells } = grid;

    const row = cells[y];

    if (row == null) {
      return null;
    }

    const cell = row[x];

    if (cell == null) {
      return null;
    }

    return cell;
  }

  getCellFromCordsOrThrow(x: number, y: number, grid: Grid): Cell {
    const cell = this.getCellFromCords(x, y, grid);

    if (!cell) {
      throw new Error('Cell not found at cords.');
    }

    return cell;
  }

  getCellNodeFromCords(x: number, y: number, grid: Grid): TableCellNode | null {
    const cell = this.getCellFromCords(x, y, grid);

    if (cell == null) {
      return null;
    }

    const node = $getNearestNodeFromDOMNode(cell.elem);

    if ($isTableCellNode(node)) {
      return node;
    }

    return null;
  }

  getCellNodeFromCordsOrThrow(x: number, y: number, grid: Grid): TableCellNode {
    const node = this.getCellNodeFromCords(x, y, grid);

    if (!node) {
      throw new Error('Node at cords not TableCellNode.');
    }

    return node;
  }

  canSelectBefore(): true {
    return true;
  }

  canIndent(): false {
    return false;
  }
}

export function $getElementGridForTableNode(
  editor: LexicalEditor,
  tableNode: TableNode,
): Grid {
  const tableElement = editor.getElementByKey(tableNode.getKey());

  if (tableElement == null) {
    throw new Error('Table Element Not Found');
  }

  return getTableGrid(tableElement);
}

export function convertTableElement(_domNode: Node): DOMConversionOutput {
  return { node: $createTableNode() };
}

export function $createTableNode(): TableNode {
  return $applyNodeReplacement(new TableNode());
}

export function $isTableNode(
  node: LexicalNode | null | undefined,
): node is TableNode {
  return node instanceof TableNode;
}
