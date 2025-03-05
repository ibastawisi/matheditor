/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */
import { TableCellNode, TableDOMCell, TableMapType } from '@lexical/table';
import type { LexicalEditor, NodeKey } from 'lexical';
import type { CSSProperties, JSX, PointerEventHandler } from 'react';

import './index.css';

import { useLexicalComposerContext } from '@lexical/react/LexicalComposerContext';
import { useLexicalEditable } from '@lexical/react/useLexicalEditable';
import {
  $computeTableMapSkipCellCheck,
  $getTableNodeFromLexicalNodeOrThrow,
  $getTableRowIndexFromTableCellNode,
  $isTableCellNode,
  $isTableRowNode,
  getDOMCellFromTarget,
  getTableElement,
} from '@lexical/table';
import { $getNearestNodeOfType, calculateZoomLevel, mergeRegister } from '@lexical/utils';
import { $getNearestNodeFromDOMNode, $getSelection, $isRangeSelection, isHTMLElement } from 'lexical';
import * as React from 'react';
import {
  ReactPortal,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import { createPortal } from 'react-dom';
import { LexicalTableRowNode, TableNode } from '@/editor/nodes/TableNode';

type MousePosition = {
  x: number;
  y: number;
};

type MouseDraggingDirection = 'right' | 'bottom';

const MIN_ROW_HEIGHT = 33;
const MIN_COLUMN_WIDTH = 75;

function TableCellResizer({ editor }: { editor: LexicalEditor }): JSX.Element {
  const targetRef = useRef<HTMLElement | null>(null);
  const resizerRef = useRef<HTMLDivElement | null>(null);
  const tableRectRef = useRef<ClientRect | null>(null);
  const [hasTable, setHasTable] = useState(false);

  const mouseStartPosRef = useRef<MousePosition | null>(null);
  const [mouseCurrentPos, updateMouseCurrentPos] =
    useState<MousePosition | null>(null);

  const [activeCell, updateActiveCell] = useState<TableDOMCell | null>(null);
  const [draggingDirection, updateDraggingDirection] =
    useState<MouseDraggingDirection | null>(null);

  const resetState = useCallback(() => {
    updateActiveCell(null);
    targetRef.current = null;
    updateDraggingDirection(null);
    mouseStartPosRef.current = null;
    tableRectRef.current = null;
  }, []);

  useEffect(() => {
    const tableKeys = new Set<NodeKey>();
    return mergeRegister(
      editor.registerMutationListener(TableNode, (nodeMutations) => {
        for (const [nodeKey, mutation] of nodeMutations) {
          if (mutation === 'destroyed') {
            tableKeys.delete(nodeKey);
          } else {
            tableKeys.add(nodeKey);
          }
        }
        setHasTable(tableKeys.size > 0);
      }),
      editor.registerNodeTransform(TableNode, (tableNode) => {
        if (tableNode.getColWidths()) {
          return tableNode;
        }

        const firstRow = tableNode.getChildren<LexicalTableRowNode>()[0];
        const colWidths = firstRow.getChildren<TableCellNode>().map(cell => {
          const colSpan = cell.getColSpan();
          const width = cell.getWidth() || 0;
          return Array(colSpan).fill(width / colSpan);
        }).flat();

        tableNode.setColWidths(colWidths);
        return tableNode;
      }),
    );
  }, [editor]);

  useEffect(() => {
    if (!hasTable) {
      return;
    }

    const onPointerMove = (event: PointerEvent) => {
      if (event.pointerType === 'touch' && event.type !== 'click') return;
      const target = event.target;
      if (!isHTMLElement(target)) {
        return;
      }

      if (draggingDirection) {
        updateMouseCurrentPos({
          x: event.clientX,
          y: event.clientY,
        });
        return;
      }

      if (resizerRef.current && resizerRef.current.contains(target)) {
        return;
      }

      if (targetRef.current !== target) {
        targetRef.current = target;
        const cell = getDOMCellFromTarget(target);

        if (cell && activeCell !== cell) {
          editor.getEditorState().read(
            () => {
              const tableCellNode = $getNearestNodeFromDOMNode(cell.elem);
              if (!tableCellNode) {
                throw new Error('TableCellResizer: Table cell node not found.');
              }

              const tableNode =
                $getTableNodeFromLexicalNodeOrThrow(tableCellNode);
              const tableElement = getTableElement(
                tableNode,
                editor.getElementByKey(tableNode.getKey()),
              );

              if (!tableElement) {
                throw new Error('TableCellResizer: Table element not found.');
              }

              targetRef.current = target as HTMLElement;
              tableRectRef.current = tableElement.getBoundingClientRect();
              updateActiveCell(cell);
            },
            { editor },
          );
        } else if (cell == null) {
          resetState();
        }
      }
    };

    const onClick = (event: MouseEvent) => {
      const pointerEvent = event as PointerEvent;
      if (pointerEvent.pointerType !== 'touch') return;
      onPointerMove(pointerEvent);
    };

    const onTouchMove = (event: TouchEvent) => {
      event.preventDefault();
      event.stopPropagation();
      if (!event.touches || event.touches.length === 0) return;
      const touch = event.touches[0];
      updateMouseCurrentPos({
        x: touch.clientX,
        y: touch.clientY,
      });
    };

    resizerRef.current?.addEventListener('touchmove', onTouchMove, { capture: true });

    const removeRootListener = editor.registerRootListener(
      (rootElement, prevRootElement) => {
        prevRootElement?.removeEventListener('pointermove', onPointerMove);
        prevRootElement?.removeEventListener('click', onClick);
        rootElement?.addEventListener('pointermove', onPointerMove);
        rootElement?.addEventListener('click', onClick);
      },
    );

    return () => {
      removeRootListener();
      resizerRef.current?.removeEventListener('touchmove', onTouchMove);
    };
  }, [activeCell, draggingDirection, editor, resetState, hasTable]);

  const isHeightChanging = (direction: MouseDraggingDirection) => {
    if (direction === 'bottom') {
      return true;
    }
    return false;
  };

  const updateRowHeight = useCallback(
    (heightChange: number) => {
      if (!activeCell) {
        throw new Error('TableCellResizer: Expected active cell.');
      }

      editor.update(
        () => {
          const tableCellNode = $getNearestNodeFromDOMNode(activeCell.elem);
          if (!$isTableCellNode(tableCellNode)) {
            throw new Error('TableCellResizer: Table cell node not found.');
          }

          const tableNode = $getTableNodeFromLexicalNodeOrThrow(tableCellNode);

          const tableRowIndex =
            $getTableRowIndexFromTableCellNode(tableCellNode) +
            tableCellNode.getRowSpan() -
            1;

          const tableRows = tableNode.getChildren();

          if (tableRowIndex >= tableRows.length || tableRowIndex < 0) {
            throw new Error('Expected table cell to be inside of table row.');
          }

          const tableRow = tableRows[tableRowIndex];

          if (!$isTableRowNode(tableRow)) {
            throw new Error('Expected table row');
          }

          let height = tableRow.getHeight();
          if (height === undefined) {
            const rowCells = tableRow.getChildren<TableCellNode>();
            height = Math.min(
              ...rowCells.map(
                (cell) => getCellNodeHeight(cell, editor) ?? Infinity,
              ),
            );
          }

          const newHeight = Math.max(height + heightChange, MIN_ROW_HEIGHT);
          tableRow.setHeight(newHeight);
        },
        { tag: 'skip-scroll-into-view' },
      );
    },
    [activeCell, editor],
  );

  const getCellNodeWidth = (
    cell: TableCellNode,
    activeEditor: LexicalEditor,
  ): number | undefined => {
    const width = cell.getWidth();
    if (width !== undefined) {
      return width;
    }

    const domCellNode = activeEditor.getElementByKey(cell.getKey());
    if (domCellNode == null) {
      return undefined;
    }
    return domCellNode.clientWidth;
  };

  const getCellNodeHeight = (
    cell: TableCellNode,
    activeEditor: LexicalEditor,
  ): number | undefined => {
    const domCellNode = activeEditor.getElementByKey(cell.getKey());
    return domCellNode?.clientHeight;
  };

  const getCellColumnIndex = (
    tableCellNode: TableCellNode,
    tableMap: TableMapType,
  ) => {
    for (let row = 0; row < tableMap.length; row++) {
      for (let column = 0; column < tableMap[row].length; column++) {
        if (tableMap[row][column].cell === tableCellNode) {
          return column;
        }
      }
    }
  };

  const updateColumnWidth = useCallback(
    (widthChange: number) => {
      if (!activeCell) {
        throw new Error('TableCellResizer: Expected active cell.');
      }
      editor.update(
        () => {
          const tableCellNode = $getNearestNodeFromDOMNode(activeCell.elem);
          if (!$isTableCellNode(tableCellNode)) {
            throw new Error('TableCellResizer: Table cell node not found.');
          }

          const tableNode = $getTableNodeFromLexicalNodeOrThrow(tableCellNode);
          const [tableMap] = $computeTableMapSkipCellCheck(
            tableNode,
            null,
            null,
          );
          const columnIndex = getCellColumnIndex(tableCellNode, tableMap);
          if (columnIndex === undefined) {
            throw new Error('TableCellResizer: Table column not found.');
          }

          const colWidths = tableNode.getColWidths();
          if (!colWidths) {
            return;
          }
          const width = colWidths[columnIndex] || getCellNodeWidth(tableCellNode, editor);
          if (width === undefined) {
            return;
          }
          const newColWidths = [...colWidths];
          const newWidth = Math.max(width + widthChange, MIN_COLUMN_WIDTH);
          newColWidths[columnIndex] = newWidth;
          tableNode.setColWidths(newColWidths);
        },
        { tag: 'skip-scroll-into-view' },
      );
    },
    [activeCell, editor],
  );

  const pointerUpHandler = useCallback(
    (direction: MouseDraggingDirection) => {
      const handler = (event: PointerEvent) => {
        event.preventDefault();
        event.stopPropagation();

        if (!activeCell) {
          throw new Error('TableCellResizer: Expected active cell.');
        }

        if (mouseStartPosRef.current) {
          const { x, y } = mouseStartPosRef.current;

          if (activeCell === null) {
            return;
          }
          const zoom = calculateZoomLevel(event.target as Element);

          if (isHeightChanging(direction)) {
            const heightChange = (event.clientY - y) / zoom;
            updateRowHeight(heightChange);
          } else {
            const widthChange = (event.clientX - x) / zoom;
            updateColumnWidth(widthChange);
          }

          resetState();
        }
      };
      return handler;
    },
    [activeCell, resetState, updateColumnWidth, updateRowHeight],
  );

  const toggleResize = useCallback(
    (direction: MouseDraggingDirection): PointerEventHandler<HTMLDivElement> =>
      (event) => {
        event.preventDefault();
        event.stopPropagation();

        if (!activeCell) {
          throw new Error('TableCellResizer: Expected active cell.');
        }

        mouseStartPosRef.current = {
          x: event.clientX,
          y: event.clientY,
        };

        updateMouseCurrentPos(mouseStartPosRef.current);
        updateDraggingDirection(direction);

        document.addEventListener('pointerup', pointerUpHandler(direction), { once: true });
      },
    [activeCell, pointerUpHandler],
  );

  const getResizers = useCallback(() => {
    if (activeCell) {
      const { height, width, top, left } =
        activeCell.elem.getBoundingClientRect();
      const zoom = calculateZoomLevel(activeCell.elem);
      const zoneWidth = 16; // Pixel width of the zone where you can drag the edge
      const styles: Record<string, CSSProperties> = {
        bottom: {
          backgroundColor: 'none',
          cursor: 'row-resize',
          height: `${zoneWidth}px`,
          left: `${window.scrollX + left}px`,
          top: `${window.scrollY + top + height - zoneWidth / 2}px`,
          width: `${width}px`,
        },
        right: {
          backgroundColor: 'none',
          cursor: 'col-resize',
          height: `${height}px`,
          left: `${window.scrollX + left + width - zoneWidth / 2}px`,
          top: `${window.scrollY + top}px`,
          width: `${zoneWidth}px`,
        },
      };

      const tableRect = tableRectRef.current;
      if (!tableRect) return styles;
      styles.bottom.left = `${window.scrollX + tableRect.left}px`;
      styles.bottom.width = `${tableRect.width}px`;
      styles.right.top = `${window.scrollY + tableRect.top}px`;
      styles.right.height = `${tableRect.height}px`;

      if (!(draggingDirection && mouseCurrentPos)) return styles;
      if (isHeightChanging(draggingDirection)) {
        styles[draggingDirection].top = `${window.scrollY + mouseCurrentPos.y / zoom}px`;
        styles[draggingDirection].height = '2px';
      } else {
        styles[draggingDirection].left = `${window.scrollX + mouseCurrentPos.x / zoom}px`;
        styles[draggingDirection].width = '2px';
      }

      styles[draggingDirection].backgroundColor = '#adf';
      styles[draggingDirection].mixBlendMode = 'unset';
      return styles;
    }

    return {
      bottom: null,
      left: null,
      right: null,
      top: null,
    };
  }, [activeCell, draggingDirection, mouseCurrentPos]);

  const resizerStyles = getResizers();

  return (
    <div ref={resizerRef}>
      {activeCell != null && (
        <>
          <div
            className="TableCellResizer__resizer TableCellResizer__ui"
            style={resizerStyles.right || undefined}
            onPointerDown={toggleResize('right')}
          />
          <div
            className="TableCellResizer__resizer TableCellResizer__ui"
            style={resizerStyles.bottom || undefined}
            onPointerDown={toggleResize('bottom')}
          />
        </>
      )}
    </div>
  );
}

export default function TableCellResizerPlugin(): null | ReactPortal {
  const [editor] = useLexicalComposerContext();
  const isEditable = useLexicalEditable();

  return useMemo(
    () =>
      isEditable
        ? createPortal(<TableCellResizer editor={editor} />, document.body)
        : null,
    [editor, isEditable],
  );
}