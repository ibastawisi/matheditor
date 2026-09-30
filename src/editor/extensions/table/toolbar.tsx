"use client"
import { $createParagraphNode, $getNodeByKey, $getSelection, $isElementNode, $isParagraphNode, $isRangeSelection, $isTextNode, ElementFormatType, ElementNode, LexicalEditor, NodeKey } from "lexical";
import { useCallback, useEffect, useState } from "react";
import { useLexicalComposerContext } from "@lexical/react/LexicalComposerContext";
import { ToggleButtonGroup, ToggleButton, SvgIcon, Menu, MenuItem, ListItemIcon, ListItemText, Divider } from "@mui/material";
import { AnchoredToolbar } from "@/editor/extensions/shared/components/AnchoredToolbar";
import { ViewHeadline, Delete, Texture, MoreHoriz } from "@mui/icons-material";
import {
  $deleteTableColumnAtSelection,
  $deleteTableRowAtSelection,
  $getNodeTriplet,
  $getTableCellNodeFromLexicalNode,
  $getTableColumnIndexFromTableCellNode,
  $getTableNodeFromLexicalNodeOrThrow,
  $getTableRowIndexFromTableCellNode,
  $insertTableColumnAtSelection,
  $insertTableRowAtSelection,
  $isTableCellNode,
  $isTableNode,
  $isTableRowNode,
  $isTableSelection,
  $unmergeCell,
  getTableObserverFromTableElement,
  HTMLTableElementWithWithTableSelectionState,
  TableCellHeaderStates,
  TableCellNode,
  TableNode,
  TableRowNode,
  TableSelection,
} from "@lexical/table";
import { FormatAlignLeft, FormatAlignCenter, FormatAlignRight } from '@mui/icons-material';
import ColorPicker from "@/editor/extensions/shared/components/ColorPicker";
import { FormatImageLeftIcon as FormatImageLeft, FormatImageRightIcon as FormatImageRight } from "@/editor/extensions/shared/icons";
import { restoreFocus as restoreEditorFocus } from "@/editor/utils/restoreFocus";
import {
  $getTableCellColor,
  $getTableCellWritingMode,
  $getTableFloat,
  $setTableCellColor,
  $setTableCellWritingMode,
  $setTableFloat,
} from "./states";
import type { TableFloat } from "./types";

function computeSelectionCount(selection: TableSelection): {
  columns: number;
  rows: number;
} {
  const selectionShape = selection.getShape();
  return {
    columns: selectionShape.toX - selectionShape.fromX + 1,
    rows: selectionShape.toY - selectionShape.fromY + 1,
  };
}

function $canUnmerge(): boolean {
  const selection = $getSelection();
  if (
    ($isRangeSelection(selection) && !selection.isCollapsed()) ||
    ($isTableSelection(selection) && !selection.anchor.is(selection.focus)) ||
    (!$isRangeSelection(selection) && !$isTableSelection(selection))
  ) {
    return false;
  }
  const [cell] = $getNodeTriplet(selection.anchor);
  return cell.getColSpan() > 1 || cell.getRowSpan() > 1;
}

function $cellContainsEmptyParagraph(cell: TableCellNode): boolean {
  if (cell.getChildrenSize() !== 1) {
    return false;
  }
  const firstChild = cell.getFirstChildOrThrow();
  if (!$isParagraphNode(firstChild) || !firstChild.isEmpty()) {
    return false;
  }
  return true;
}

function $selectLastDescendant(node: ElementNode): void {
  const lastDescendant = node.getLastDescendant();
  if ($isTextNode(lastDescendant)) {
    lastDescendant.select();
  } else if ($isElementNode(lastDescendant)) {
    lastDescendant.selectEnd();
  } else if (lastDescendant !== null) {
    lastDescendant.selectNext();
  }
}

const CellMerge = () => <SvgIcon viewBox='0 -960 960 960' fontSize="small" >
  <path d="M120-120v-240h80v160h160v80H120Zm480 0v-80h160v-160h80v240H600ZM287-327l-57-56 57-57H80v-80h207l-57-57 57-56 153 153-153 153Zm386 0L520-480l153-153 57 56-57 57h207v80H673l57 57-57 56ZM120-600v-240h240v80H200v160h-80Zm640 0v-160H600v-80h240v240h-80Z" />
</SvgIcon>;

const TextRotationNone = () => <SvgIcon viewBox='0 -960 960 960' fontSize="small" >
  <path d="M160-200v-80h528l-42-42 56-56 138 138-138 138-56-56 42-42H160Zm116-200 164-440h80l164 440h-76l-38-112H392l-40 112h-76Zm138-176h132l-64-182h-4l-64 182Z" />
</SvgIcon>;

const TextRotationVertical = () => <SvgIcon viewBox='0 -960 960 960' fontSize="small" >
  <path d="m436-320 164-440h80l164 440h-76l-40-112H552l-40 112h-76Zm138-176h132l-64-182h-4l-64 182ZM240-160 100-300l56-56 44 42v-526h80v526l44-42 56 56-140 140Z" />
</SvgIcon>;

const AddRowAbove = () => <SvgIcon viewBox='0 -960 960 960' fontSize="small" >
  <path d="M200-160h560v-240H200v240Zm640 80H120v-720h160v80h-80v240h560v-240h-80v-80h160v720ZM480-480Zm0 80v-80 80Zm0 0Zm-40-240v-80h-80v-80h80v-80h80v80h80v80h-80v80h-80Z" />
</SvgIcon>;

const AddRowBelow = () => <SvgIcon viewBox='0 -960 960 960' fontSize="small" >
  <path d="M200-560h560v-240H200v240Zm-80 400v-720h720v720H680v-80h80v-240H200v240h80v80H120Zm360-320Zm0-80v80-80Zm0 0ZM440-80v-80h-80v-80h80v-80h80v80h80v80h-80v80h-80Z" />
</SvgIcon>;

const AddColumnLeft = () => <SvgIcon viewBox='0 -960 960 960' fontSize="small" >
  <path d="M800-200v-560H560v560h240Zm-640 80v-160h80v80h240v-560H240v80h-80v-160h720v720H160Zm320-360Zm80 0h-80 80Zm0 0ZM160-360v-80H80v-80h80v-80h80v80h80v80h-80v80h-80Z" />
</SvgIcon>;

const AddColumnRight = () => <SvgIcon viewBox='0 -960 960 960' fontSize="small" >
  <path d="M160-760v560h240v-560H160ZM80-120v-720h720v160h-80v-80H480v560h240v-80h80v160H80Zm400-360Zm-80 0h80-80Zm0 0Zm320 120v-80h-80v-80h80v-80h80v80h80v80h-80v80h-80Z" />
</SvgIcon>;

const RemoveRow = () => <SvgIcon viewBox='0 -960 960 960' fontSize="small" >
  <path d="M560-280H120v-400h720v120h-80v-40H200v240h360v80Zm-360-80v-240 240Zm440 104 84-84-84-84 56-56 84 84 84-84 56 56-83 84 83 84-56 56-84-83-84 83-56-56Z" />
</SvgIcon>;

const RemoveColumn = () => <SvgIcon viewBox='0 -960 960 960' sx={{ transform: 'rotate(90deg)' }} fontSize="small" >
  <path d="M560-280H120v-400h720v120h-80v-40H200v240h360v80Zm-360-80v-240 240Zm440 104 84-84-84-84 56-56 84 84 84-84 56 56-83 84 83 84-56 56-84-83-84 83-56-56Z" />
</SvgIcon>;

const RemoveRowHeader = () => <SvgIcon viewBox='0 -960 960 960' fontSize="small" >
  <path d="M120-280v-400h720v400H120Zm80-80h560v-240H200v240Zm0 0v-240 240Z" />
</SvgIcon>;

const RemoveColumnHeader = () => <SvgIcon viewBox='0 -960 960 960' sx={{ transform: 'rotate(90deg)' }} fontSize="small" >
  <path d="M120-280v-400h720v400H120Zm80-80h560v-240H200v240Zm0 0v-240 240Z" />
</SvgIcon>;

const AddRowHeader = () => <SvgIcon viewBox='0 -960 960 960' sx={{ transform: 'rotate(45deg)' }} fontSize="small" >
  <path d="m272-104-38-38-42 42q-19 19-46.5 19.5T100-100q-19-19-19-46t19-46l42-42-38-40 554-554q12-12 29-12t29 12l112 112q12 12 12 29t-12 29L272-104Zm172-396L216-274l58 58 226-228-56-56Z" />
</SvgIcon>;

const AddColumnHeader = () => <SvgIcon viewBox='0 -960 960 960' sx={{ transform: 'rotate(-45deg)' }} fontSize="small" >
  <path d="m272-104-38-38-42 42q-19 19-46.5 19.5T100-100q-19-19-19-46t19-46l42-42-38-40 554-554q12-12 29-12t29 12l112 112q12 12 12 29t-12 29L272-104Zm172-396L216-274l58 58 226-228-56-56Z" />
</SvgIcon>;

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


export default function TableTools({ nodeKey }: { nodeKey: NodeKey }) {
  const [editor] = useLexicalComposerContext();
  const [formatType, setFormatType] = useState<ElementFormatType>();
  const [float, setFloat] = useState<TableFloat>();
  const [rowStriping, setRowStriping] = useState(false);
  const [selectionCounts, setSelectionCounts] = useState({ columns: 1, rows: 1, });
  const [canMergeCells, setCanMergeCells] = useState(false);
  const [canUnmergeCell, setCanUnmergeCell] = useState(false);
  const [tableCellNode, setTableCellNode] = useState<TableCellNode | null>(null);
  const [tableCellStyle, setTableCellStyle] = useState<{ color: string, backgroundColor: string, writingMode: string } | null>(null);
  const [selectedCellKey, setSelectedCellKey] = useState<NodeKey | null>(null);
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const open = Boolean(anchorEl);
  const textColor = tableCellStyle?.color;
  const backgroundColor = tableCellStyle?.backgroundColor;
  const cellWritingMode = tableCellStyle?.writingMode ?? '';

  const $getTableNode = useCallback(() => {
    const node = $getNodeByKey(nodeKey);
    return $isTableNode(node) ? node : null;
  }, [nodeKey]);

  const readCellStyle = useCallback(() => {
    return editor.read(() => {
      const selection = $getSelection();
      if ($isRangeSelection(selection) || $isTableSelection(selection)) {
        const [cell] = $getNodeTriplet(selection.anchor);
        if ($isTableCellNode(cell)) {
          return {
            color: $getTableCellColor(cell),
            backgroundColor: cell.getBackgroundColor() ?? '',
            writingMode: $getTableCellWritingMode(cell),
          };
        }
      }
      return null;
    });
  }, [editor]);

  const readTableState = useCallback(() => {
    editor.read(() => {
      const node = $getTableNode();
      if (!node) return;
      setFormatType(node.getFormatType());
      setFloat($getTableFloat(node));
      setRowStriping(node.getRowStriping());
    });
  }, [editor, $getTableNode]);

  const readSelectionState = useCallback(() => {
    editor.read(() => {
      setTableCellNode($getSelectedTableCell(editor));
      const selection = $getSelection();
      if ($isTableSelection(selection)) {
        const currentSelectionCounts = computeSelectionCount(selection);
        setSelectionCounts(currentSelectionCounts);
        setCanMergeCells(currentSelectionCounts.columns > 1 || currentSelectionCounts.rows > 1);
        const cells = selection.getNodes().filter($isTableCellNode);
        setSelectedCellKey(cells[cells.length - 1]?.getKey() ?? null);
      } else {
        setSelectionCounts({ columns: 1, rows: 1 });
        setCanMergeCells(false);
        setSelectedCellKey(null);
      }
      setCanUnmergeCell($canUnmerge());
    });
    setTableCellStyle(readCellStyle());
  }, [editor, readCellStyle]);

  useEffect(() => {
    readTableState();
    readSelectionState();
    return editor.registerUpdateListener(() => {
      readTableState();
      readSelectionState();
    });
  }, [editor, readTableState, readSelectionState]);

  const mergeTableCellsAtSelection = () => {
    editor.update(() => {
      const selection = $getSelection();
      if ($isTableSelection(selection)) {
        const { columns, rows } = computeSelectionCount(selection);
        const nodes = selection.getNodes();
        let firstCell: null | TableCellNode = null;
        for (let i = 0; i < nodes.length; i++) {
          const node = nodes[i];
          if ($isTableCellNode(node)) {
            if (firstCell === null) {
              node.setColSpan(columns).setRowSpan(rows);
              firstCell = node;
              const isEmpty = $cellContainsEmptyParagraph(node);
              let firstChild;
              if (
                isEmpty &&
                $isParagraphNode((firstChild = node.getFirstChild()))
              ) {
                firstChild.remove();
              }
            } else if ($isTableCellNode(firstCell)) {
              const isEmpty = $cellContainsEmptyParagraph(node);
              if (!isEmpty) {
                firstCell.append(...node.getChildren());
              }
              node.remove();
            }
          }
        }
        if (firstCell !== null) {
          if (firstCell.getChildrenSize() === 0) {
            firstCell.append($createParagraphNode());
          }
          $selectLastDescendant(firstCell);
        }
      }
    });
  };

  const unmergeTableCellsAtSelection = () => {
    editor.update(() => {
      $unmergeCell();
    });
  };

  const handleCellMerge = () => {
    if (canMergeCells) {
      mergeTableCellsAtSelection();
    } else if (canUnmergeCell) {
      unmergeTableCellsAtSelection();
    }
  };

  const insertTableRowAtSelection = useCallback(
    (shouldInsertAfter: boolean) => {
      editor.update(() => {
        $insertTableRowAtSelection(shouldInsertAfter);
      });
    },
    [editor],
  );

  const insertTableColumnAtSelection = useCallback(
    (shouldInsertAfter: boolean) => {
      editor.update(() => {
        for (let i = 0; i < selectionCounts.columns; i++) {
          $insertTableColumnAtSelection(shouldInsertAfter);
        }
      });
    },
    [editor, selectionCounts.columns],
  );

  const restoreFocus = useCallback(() => {
    setTimeout(() => restoreEditorFocus(editor), 0);
  }, [editor]);

  const handleClose = useCallback(() => {
    setAnchorEl(null);
    restoreFocus();
  }, [restoreFocus]);

  const deleteTableRowAtSelection = useCallback(() => {
    editor.update(() => {
      $deleteTableRowAtSelection();
    });
    handleClose();
  }, [editor, handleClose]);

  const deleteTableAtSelection = useCallback(() => {
    editor.update(() => {
      const node = $getTableNode();
      if (!node) return;
      node.selectPrevious();
      node.remove();
    });
    setAnchorEl(null);
  }, [editor, $getTableNode]);

  const deleteTableColumnAtSelection = useCallback(() => {
    editor.update(() => {
      $deleteTableColumnAtSelection();
    });
    handleClose();
  }, [editor, handleClose]);

  const getTableRowHeaderState = useCallback(() => {
    if (tableCellNode === null) return TableCellHeaderStates.NO_STATUS;
    return editor.read(() => tableCellNode.getLatest().getHeaderStyles() & TableCellHeaderStates.ROW);
  }, [editor, tableCellNode]);

  const getTableColumnHeaderState = useCallback(() => {
    if (tableCellNode === null) return TableCellHeaderStates.NO_STATUS;
    return editor.read(() => tableCellNode.getLatest().getHeaderStyles() & TableCellHeaderStates.COLUMN);
  }, [editor, tableCellNode]);

  const toggleTableRowIsHeader = useCallback(() => {
    if (tableCellNode === null) return;
    editor.update(() => {
      const cell = tableCellNode.getLatest();
      const tableNode = $getTableNodeFromLexicalNodeOrThrow(cell);
      const tableRowIndex = $getTableRowIndexFromTableCellNode(cell);
      const tableRows = tableNode.getChildren();

      if (tableRowIndex >= tableRows.length || tableRowIndex < 0) {
        throw new Error('Expected table cell to be inside of table row.');
      }

      const tableRow = tableRows[tableRowIndex];

      if (!$isTableRowNode(tableRow)) {
        throw new Error('Expected table row');
      }

      const newStyle = cell.getHeaderStyles() ^ TableCellHeaderStates.ROW;
      tableRow.getChildren().forEach((tableCell) => {
        if (!$isTableCellNode(tableCell)) {
          throw new Error('Expected table cell');
        }
        tableCell.setHeaderStyles(newStyle, TableCellHeaderStates.ROW);
      });
    });
  }, [editor, tableCellNode]);

  const toggleTableColumnIsHeader = useCallback(() => {
    if (tableCellNode === null) return;
    editor.update(() => {
      const cell = tableCellNode.getLatest();
      const tableNode = $getTableNodeFromLexicalNodeOrThrow(cell);
      const tableColumnIndex = $getTableColumnIndexFromTableCellNode(cell);
      const tableRows = tableNode.getChildren<TableRowNode>();
      const maxRowsLength = Math.max(
        ...tableRows.map((row) => row.getChildren().length),
      );

      if (tableColumnIndex >= maxRowsLength || tableColumnIndex < 0) {
        throw new Error('Expected table cell to be inside of table row.');
      }

      const newStyle = cell.getHeaderStyles() ^ TableCellHeaderStates.COLUMN;
      for (let r = 0; r < tableRows.length; r++) {
        const tableRow = tableRows[r];

        if (!$isTableRowNode(tableRow)) {
          throw new Error('Expected table row');
        }

        const tableCells = tableRow.getChildren();
        if (tableColumnIndex >= tableCells.length) {
          // if cell is outside of bounds for the current row (for example various merge cell cases) we shouldn't highlight it
          continue;
        }

        const tableCell = tableCells[tableColumnIndex];

        if (!$isTableCellNode(tableCell)) {
          throw new Error('Expected table cell');
        }

        tableCell.setHeaderStyles(newStyle, TableCellHeaderStates.COLUMN);
      }
    });
  }, [editor, tableCellNode]);

  const toggleRowStriping = useCallback(() => {
    editor.update(() => {
      const node = $getTableNode();
      if (!node) return;
      node.setRowStriping(!node.getRowStriping());
    });
  }, [editor, $getTableNode]);

  const $applyToSelectedCells = useCallback((update: (cell: TableCellNode) => void) => {
    const selection = $getSelection();
    if (!$isRangeSelection(selection) && !$isTableSelection(selection)) return;
    if ($isTableSelection(selection)) {
      selection.getNodes().filter($isTableCellNode).forEach(update);
      return;
    }
    const [cell] = $getNodeTriplet(selection.anchor);
    if ($isTableCellNode(cell)) update(cell);
  }, []);

  const updateCellColor = useCallback(
    (key: string, value: string) => {
      editor.update(() => {
        $applyToSelectedCells((cell) => {
          if (key === 'text') $setTableCellColor(cell, value === 'inherit' ? '' : value);
          else cell.setBackgroundColor(value === 'inherit' ? null : value);
        });
      });
    },
    [editor, $applyToSelectedCells],
  );

  const toggleCellWritingMode = useCallback(() => {
    const value = cellWritingMode === '' ? 'vertical-rl' : '';
    editor.update(() => {
      $applyToSelectedCells((cell) => { $setTableCellWritingMode(cell, value); });
    });
  }, [editor, cellWritingMode, $applyToSelectedCells]);

  function updateFloat(newFloat: TableFloat) {
    setFloat(newFloat);
    editor.update(() => {
      const node = $getTableNode();
      if (!node) return;
      node.setFormat('');
      $setTableFloat(node, newFloat);
    });
  }

  function updateFormat(newFormat: ElementFormatType) {
    setFormatType(newFormat);
    editor.update(() => {
      const node = $getTableNode();
      if (!node) return;
      node.setFormat(newFormat);
      $setTableFloat(node, 'none');
    });
  }

  const handleClick = (event: React.MouseEvent<HTMLElement>) => {
    setAnchorEl(event.currentTarget);
    readSelectionState();
  };

  return (
    <>
      <AnchoredToolbar nodeKey={nodeKey} placement="top" className="table-toolbar">
        <ToggleButtonGroup size="small">
          <ToggleButton value="align-left" selected={formatType === "left"} title="Align left" aria-label="Align left"
            onClick={() => updateFormat('left')}>
            <FormatAlignLeft fontSize="small" />
          </ToggleButton>
          <ToggleButton value="align-center" selected={formatType === "center"} title="Align center" aria-label="Align center"
            onClick={() => updateFormat('center')}>
            <FormatAlignCenter fontSize="small" />
          </ToggleButton>
          <ToggleButton value="align-right" selected={formatType === "right"} title="Align right" aria-label="Align right"
            onClick={() => updateFormat('right')}>
            <FormatAlignRight fontSize="small" />
          </ToggleButton>
        </ToggleButtonGroup>
        <ToggleButtonGroup size="small">
          <ToggleButton value="float-left" selected={float === "left"} title="Float left" aria-label="Float left"
            onClick={() => updateFloat("left")}>
            <FormatImageLeft />
          </ToggleButton>
          <ToggleButton value="align-justify" selected={formatType === "justify" || (formatType === "" && float === "none")} title="Full width" aria-label="Full width"
            onClick={() => updateFormat('justify')}>
            <ViewHeadline fontSize="small" />
          </ToggleButton>
          <ToggleButton value="float-right" selected={float === "right"} title="Float right" aria-label="Float right"
            onClick={() => updateFloat("right")}>
            <FormatImageRight />
          </ToggleButton>
        </ToggleButtonGroup>
        <ToggleButtonGroup size="small">
          <ToggleButton value="row-striping" selected={rowStriping} title={`${rowStriping ? 'Remove' : 'Add'} row striping`} aria-label={`${rowStriping ? 'Remove' : 'Add'} row striping`}
            onClick={toggleRowStriping}>
            <Texture sx={{ transform: 'rotate(45deg)' }} fontSize="small" />
          </ToggleButton>
          <ToggleButton value="more" selected={open} title="Rows, columns and cells" aria-label="Rows, columns and cells"
            aria-controls={open ? 'table-tools-menu' : undefined} aria-haspopup="true" aria-expanded={open ? 'true' : undefined}
            onClick={handleClick}>
            <MoreHoriz fontSize="small" />
          </ToggleButton>
          <ToggleButton value="delete-table" title="Delete table" aria-label="Delete table" onClick={deleteTableAtSelection}>
            <Delete fontSize="small" />
          </ToggleButton>
        </ToggleButtonGroup>
      </AnchoredToolbar>
      {selectedCellKey && <AnchoredToolbar nodeKey={selectedCellKey} placement="bottom" className="table-cell-toolbar">
        <ToggleButtonGroup size="small">
          {(canMergeCells || canUnmergeCell) && <ToggleButton value="merge" title={canUnmergeCell ? 'Unmerge cell' : 'Merge cells'} aria-label={canUnmergeCell ? 'Unmerge cell' : 'Merge cells'}
            onClick={handleCellMerge}>
            <CellMerge />
          </ToggleButton>}
          <ToggleButton value="writing-mode" selected={cellWritingMode !== ''} title={`Make ${cellWritingMode === '' ? 'vertical' : 'horizontal'}`} aria-label={`Make ${cellWritingMode === '' ? 'vertical' : 'horizontal'}`}
            onClick={toggleCellWritingMode}>
            {cellWritingMode === '' ? <TextRotationVertical /> : <TextRotationNone />}
          </ToggleButton>
          <ColorPicker
            onColorChange={updateCellColor}
            onClose={restoreFocus}
            textColor={textColor}
            backgroundColor={backgroundColor}
          />
        </ToggleButtonGroup>
      </AnchoredToolbar>}
      <Menu id="table-tools-menu" aria-label="Table rows, columns and cells"
        anchorEl={anchorEl}
        open={open}
        onClose={handleClose}
        anchorOrigin={{
          vertical: 'bottom',
          horizontal: 'center',
        }}
        transformOrigin={{
          vertical: 'top',
          horizontal: 'center',
        }}
        sx={{
          '& .MuiMenu-paper': { minWidth: 240 },
          '& .MuiMenuItem-root': { minHeight: 36 },
          '& .MuiBackdrop-root': { userSelect: 'none' },
        }}
      >
        <MenuItem onClick={handleCellMerge} disabled={!canMergeCells && !canUnmergeCell}>
          <ListItemIcon>
            <CellMerge />
          </ListItemIcon>
          <ListItemText>
            {canUnmergeCell ? 'Unmerge cell' : 'Merge cells'}
          </ListItemText>
        </MenuItem>
        <MenuItem onClick={toggleCellWritingMode}>
          <ListItemIcon>
            {cellWritingMode === '' ? <TextRotationVertical /> : <TextRotationNone />}
          </ListItemIcon>
          <ListItemText>
            Make {cellWritingMode === '' ? 'Vertical' : 'Horizontal'}
          </ListItemText>
        </MenuItem>
        <ColorPicker
          onColorChange={updateCellColor}
          toggle="menuitem"
          label='Cell color'
          textColor={textColor}
          backgroundColor={backgroundColor}
        />
        <MenuItem onClick={() => toggleTableRowIsHeader()}>
          <ListItemIcon>
            {(getTableRowHeaderState() & TableCellHeaderStates.ROW) === TableCellHeaderStates.ROW
              ? <RemoveRowHeader />
              : <AddRowHeader />}
          </ListItemIcon>
          <ListItemText>
            {(getTableRowHeaderState() & TableCellHeaderStates.ROW) === TableCellHeaderStates.ROW
              ? 'Remove'
              : 'Add'}{' '}
            row header
          </ListItemText>
        </MenuItem>
        <MenuItem onClick={() => toggleTableColumnIsHeader()}>
          <ListItemIcon>
            {(getTableColumnHeaderState() & TableCellHeaderStates.COLUMN) === TableCellHeaderStates.COLUMN
              ? <RemoveColumnHeader />
              : <AddColumnHeader />}
          </ListItemIcon>
          <ListItemText>
            {(getTableColumnHeaderState() & TableCellHeaderStates.COLUMN) === TableCellHeaderStates.COLUMN
              ? 'Remove'
              : 'Add'}{' '}
            column header
          </ListItemText>
        </MenuItem>
        <Divider />
        <MenuItem onClick={() => insertTableRowAtSelection(false)}>
          <ListItemIcon>
            <AddRowAbove />
          </ListItemIcon>
          <ListItemText>
            Insert{' '}
            {selectionCounts.rows === 1 ? 'row' : `${selectionCounts.rows} rows`}{' '}
            above
          </ListItemText>
        </MenuItem>
        <MenuItem onClick={() => insertTableRowAtSelection(true)}>
          <ListItemIcon>
            <AddRowBelow />
          </ListItemIcon>
          <ListItemText>
            Insert{' '}
            {selectionCounts.rows === 1 ? 'row' : `${selectionCounts.rows} rows`}{' '}
            below
          </ListItemText>
        </MenuItem>
        <MenuItem onClick={() => insertTableColumnAtSelection(false)}>
          <ListItemIcon>
            <AddColumnLeft />
          </ListItemIcon>
          <ListItemText>
            Insert{' '}
            {selectionCounts.columns === 1 ? 'column' : `${selectionCounts.columns} columns`}{' '}
            left
          </ListItemText>
        </MenuItem>
        <MenuItem onClick={() => insertTableColumnAtSelection(true)}>
          <ListItemIcon>
            <AddColumnRight />
          </ListItemIcon>
          <ListItemText>
            Insert{' '}
            {selectionCounts.columns === 1 ? 'column' : `${selectionCounts.columns} columns`}{' '}
            right
          </ListItemText>
        </MenuItem>
        <Divider />
        <MenuItem onClick={deleteTableColumnAtSelection}>
          <ListItemIcon>
            <RemoveColumn />
          </ListItemIcon>
          <ListItemText>Delete column</ListItemText>
        </MenuItem>
        <MenuItem onClick={deleteTableRowAtSelection}>
          <ListItemIcon>
            <RemoveRow />
          </ListItemIcon>
          <ListItemText>Delete row</ListItemText>
        </MenuItem>
      </Menu>
    </>
  );
}
