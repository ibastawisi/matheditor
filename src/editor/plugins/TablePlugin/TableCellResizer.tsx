/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */
import { $getTableCellNodeFromLexicalNode, TableCellNode, TableDOMCell, TableMapType } from '@lexical/table';
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
import { calculateZoomLevel, mergeRegister } from '@lexical/utils';
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
import { TableRowNode, TableNode } from '@/editor/nodes/TableNode';

type PointerPosition = {
  x: number;
  y: number;
};

type PointerDraggingDirection = 'right' | 'bottom';

const MIN_ROW_HEIGHT = 33;
const MIN_COLUMN_WIDTH = 75;

const $getSelectedTableCell = (editor: LexicalEditor): TableCellNode | null => {
  const selection = $getSelection();
  const nativeSelection = window.getSelection();
  const activeElement = document.activeElement;

  if (selection == null) {
    return null;
  }

  const rootElement = editor.getRootElement();

  if (
    $isRangeSelection(selection) &&
    rootElement !== null &&
    nativeSelection !== null &&
    rootElement.contains(nativeSelection.anchorNode)
  ) {
    const tableCellNodeFromSelection = $getTableCellNodeFromLexicalNode(
      selection.anchor.getNode(),
    );

    if (!$isTableCellNode(tableCellNodeFromSelection)) {
      return null;
    }

    const tableCellParentNodeDOM = editor.getElementByKey(
      tableCellNodeFromSelection.getKey(),
    );

    if (tableCellParentNodeDOM == null) {
      return null;
    }

    return tableCellNodeFromSelection;
  } else if (!activeElement) {
    return null;
  }
  return null;
};


function TableCellResizer({ editor }: { editor: LexicalEditor }): JSX.Element {
  const targetRef = useRef<HTMLElement | null>(null);
  const resizerRef = useRef<HTMLDivElement | null>(null);
  const tableRectRef = useRef<ClientRect | null>(null);
  const [hasTable, setHasTable] = useState(false);

  const pointerStartPosRef = useRef<PointerPosition | null>(null);
  const [pointerCurrentPos, updatePointerCurrentPos] =
    useState<PointerPosition | null>(null);

  const [activeCell, updateActiveCell] = useState<TableDOMCell | null>(null);
  const [draggingDirection, updateDraggingDirection] =
    useState<PointerDraggingDirection | null>(null);

  const resetState = useCallback(() => {
    updateActiveCell(null);
    targetRef.current = null;
    updateDraggingDirection(null);
    pointerStartPosRef.current = null;
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

        const firstRow = tableNode.getChildren<TableRowNode>()[0];
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
      const target = event.target;
      if (!isHTMLElement(target)) {
        return;
      }

      if (draggingDirection) {
        event.preventDefault();
        event.stopPropagation();
        updatePointerCurrentPos({
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

        if (cell) {
          editor.getEditorState().read(
            () => {
              const tableCellNode = $getNearestNodeFromDOMNode(cell.elem);
              if (!tableCellNode) return;
              const selectedCell = $getSelectedTableCell(editor);
              if (event.pointerType === 'touch' && selectedCell && !selectedCell.is(tableCellNode)) {
                resetState();
              } else if (activeCell !== cell) {

                const tableNode =
                  $getTableNodeFromLexicalNodeOrThrow(tableCellNode);
                const tableElement = getTableElement(
                  tableNode,
                  editor.getElementByKey(tableNode.getKey()),
                );

                if (!tableElement) return;

                targetRef.current = target as HTMLElement;
                tableRectRef.current = tableElement.getBoundingClientRect();
                updateActiveCell(cell);
              }
            },
            { editor },
          );
        } else if (cell == null) {
          resetState();
        }
      }
    };

    const onPointerUp = (event: PointerEvent) => {
      const isTouchEvent = event.pointerType === 'touch';
      if (isTouchEvent) {
        onPointerMove(event);
      }
    };

    const resizerContainer = resizerRef.current;
    resizerContainer?.addEventListener('pointermove', onPointerMove, {
      capture: true,
    });

    const removeRootListener = editor.registerRootListener(
      (rootElement, prevRootElement) => {
        prevRootElement?.removeEventListener('pointermove', onPointerMove);
        prevRootElement?.removeEventListener('pointerup', onPointerUp);
        rootElement?.addEventListener('pointermove', onPointerMove);
        rootElement?.addEventListener('pointerup', onPointerUp);
      },
    );

    return () => {
      removeRootListener();
      resizerContainer?.removeEventListener('pointermove', onPointerMove);
    };
  }, [activeCell, draggingDirection, editor, resetState, hasTable]);

  const isHeightChanging = (direction: PointerDraggingDirection) => {
    if (direction === 'bottom') {
      return true;
    }
    return false;
  };

  const updateRowHeight = useCallback(
    (heightChange: number) => {
      if (!activeCell) return;

      editor.update(
        () => {
          const tableCellNode = $getNearestNodeFromDOMNode(activeCell.elem);
          if (!$isTableCellNode(tableCellNode)) return;

          const tableNode = $getTableNodeFromLexicalNodeOrThrow(tableCellNode);

          const baseRowIndex =
            $getTableRowIndexFromTableCellNode(tableCellNode);
          const tableRows = tableNode.getChildren();

          // Determine if this is a full row merge by checking colspan
          const isFullRowMerge =
            tableCellNode.getColSpan() === tableNode.getColumnCount();


          // For full row merges, apply to first row. For partial merges, apply to last row
          const tableRowIndex = isFullRowMerge
            ? baseRowIndex
            : baseRowIndex + tableCellNode.getRowSpan() - 1;

          if (tableRowIndex >= tableRows.length || tableRowIndex < 0) return;

          const tableRow = tableRows[tableRowIndex];

          if (!$isTableRowNode(tableRow)) return;

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
      if (!activeCell) return;
      editor.update(
        () => {
          const tableCellNode = $getNearestNodeFromDOMNode(activeCell.elem);
          if (!$isTableCellNode(tableCellNode)) return;

          const tableNode = $getTableNodeFromLexicalNodeOrThrow(tableCellNode);
          const [tableMap] = $computeTableMapSkipCellCheck(
            tableNode,
            null,
            null,
          );
          const columnIndex = getCellColumnIndex(tableCellNode, tableMap);
          if (columnIndex === undefined) return;

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
    (direction: PointerDraggingDirection) => {
      const handler = (event: PointerEvent) => {
        event.preventDefault();
        event.stopPropagation();

        if (!activeCell) return;

        if (pointerStartPosRef.current) {
          const { x, y } = pointerStartPosRef.current;

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
    (direction: PointerDraggingDirection): PointerEventHandler<HTMLDivElement> =>
      (event) => {
        event.preventDefault();
        event.stopPropagation();

        if (!activeCell) return;

        pointerStartPosRef.current = {
          x: event.clientX,
          y: event.clientY,
        };

        updatePointerCurrentPos(pointerStartPosRef.current);
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
          width: `${Math.min(width, window.innerWidth - left)}px`,
        },
        right: {
          backgroundColor: 'none',
          cursor: 'col-resize',
          height: `${Math.min(height, window.innerHeight - top)}px`,
          left: `${window.scrollX + left + width - zoneWidth / 2}px`,
          top: `${window.scrollY + top}px`,
          width: `${zoneWidth}px`,
        },
      };

      const tableRect = tableRectRef.current;
      if (!tableRect) return styles;
      styles.bottom.left = `${window.scrollX + tableRect.left}px`;
      styles.bottom.width = `${Math.min(tableRect.width, window.innerWidth - tableRect.left)}px`;
      styles.right.top = `${window.scrollY + tableRect.top}px`;
      styles.right.height = `${Math.min(tableRect.height, window.innerHeight - tableRect.top)}px`;

      if (!(draggingDirection && pointerCurrentPos)) return styles;
      if (isHeightChanging(draggingDirection)) {
        styles[draggingDirection].top = `${window.scrollY + pointerCurrentPos.y / zoom}px`;
        styles[draggingDirection].height = '2px';
      } else {
        styles[draggingDirection].left = `${window.scrollX + pointerCurrentPos.x / zoom}px`;
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
  }, [activeCell, draggingDirection, pointerCurrentPos]);

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