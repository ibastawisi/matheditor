"use client"
import { $createParagraphNode, $getSelection, $isElementNode, $isParagraphNode, $isRangeSelection, $isTextNode, $setSelection, ElementFormatType, ElementNode, LexicalEditor, } from "lexical";
import { useCallback, useEffect, useState } from "react";
import { ToggleButtonGroup, ToggleButton, SvgIcon, Menu, Button, MenuItem, ListItemIcon, ListItemText, Typography, Divider } from "@mui/material";
import { ViewHeadline, Delete, KeyboardArrowDown, TableChart, Texture } from "@mui/icons-material";
import { $deleteTableColumn__EXPERIMENTAL, $deleteTableRow__EXPERIMENTAL, $getNodeTriplet, $getTableCellNodeFromLexicalNode, $getTableColumnIndexFromTableCellNode, $getTableNodeFromLexicalNodeOrThrow, $getTableRowIndexFromTableCellNode, $insertTableColumn__EXPERIMENTAL, $insertTableRow__EXPERIMENTAL, $isTableCellNode, $isTableRowNode, $isTableSelection, $unmergeCell, getTableObserverFromTableElement, HTMLTableElementWithWithTableSelectionState, TableCellHeaderStates, TableCellNode, TableNode, TableRowNode, TableSelection } from "@/editor/nodes/TableNode";
import { FormatAlignLeft, FormatAlignCenter, FormatAlignRight } from '@mui/icons-material';
import { $getNodeStyleValueForProperty, $patchStyle, getStyleObjectFromCSS } from "@/editor/nodes/utils";
import ColorPicker from "./ColorPicker";

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
  return cell.__colSpan > 1 || cell.__rowSpan > 1;
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

const FormatImageRight = () => <SvgIcon viewBox='0 -960 960 960'>
  <path xmlns="http://www.w3.org/2000/svg" d="M450-285v-390h390v390H450Zm60-60h270v-270H510v270ZM120-120v-60h720v60H120Zm0-165v-60h270v60H120Zm0-165v-60h270v60H120Zm0-165v-60h270v60H120Zm0-165v-60h720v60H120Z" />
</SvgIcon>;

const FormatImageLeft = () => <SvgIcon viewBox='0 -960 960 960'>
  <path xmlns="http://www.w3.org/2000/svg" d="M120-285v-390h390v390H120Zm60-60h270v-270H180v270Zm-60-435v-60h720v60H120Zm450 165v-60h270v60H570Zm0 165v-60h270v60H570Zm0 165v-60h270v60H570ZM120-120v-60h720v60H120Z" />
</SvgIcon>;

const CellMerge = () => <SvgIcon viewBox='0 -960 960 960'>
  <path d="M120-120v-240h80v160h160v80H120Zm480 0v-80h160v-160h80v240H600ZM287-327l-57-56 57-57H80v-80h207l-57-57 57-56 153 153-153 153Zm386 0L520-480l153-153 57 56-57 57h207v80H673l57 57-57 56ZM120-600v-240h240v80H200v160h-80Zm640 0v-160H600v-80h240v240h-80Z" />
</SvgIcon>;

const TextRotationNone = () => <SvgIcon viewBox='0 -960 960 960'>
  <path d="M160-200v-80h528l-42-42 56-56 138 138-138 138-56-56 42-42H160Zm116-200 164-440h80l164 440h-76l-38-112H392l-40 112h-76Zm138-176h132l-64-182h-4l-64 182Z" />
</SvgIcon>;

const TextRotationVertical = () => <SvgIcon viewBox='0 -960 960 960'>
  <path d="m436-320 164-440h80l164 440h-76l-40-112H552l-40 112h-76Zm138-176h132l-64-182h-4l-64 182ZM240-160 100-300l56-56 44 42v-526h80v526l44-42 56 56-140 140Z" />
</SvgIcon>;

const AddRowAbove = () => <SvgIcon viewBox='0 -960 960 960'>
  <path d="M200-160h560v-240H200v240Zm640 80H120v-720h160v80h-80v240h560v-240h-80v-80h160v720ZM480-480Zm0 80v-80 80Zm0 0Zm-40-240v-80h-80v-80h80v-80h80v80h80v80h-80v80h-80Z" />
</SvgIcon>;

const AddRowBelow = () => <SvgIcon viewBox='0 -960 960 960'>
  <path d="M200-560h560v-240H200v240Zm-80 400v-720h720v720H680v-80h80v-240H200v240h80v80H120Zm360-320Zm0-80v80-80Zm0 0ZM440-80v-80h-80v-80h80v-80h80v80h80v80h-80v80h-80Z" />
</SvgIcon>;

const AddColumnLeft = () => <SvgIcon viewBox='0 -960 960 960'>
  <path d="M800-200v-560H560v560h240Zm-640 80v-160h80v80h240v-560H240v80h-80v-160h720v720H160Zm320-360Zm80 0h-80 80Zm0 0ZM160-360v-80H80v-80h80v-80h80v80h80v80h-80v80h-80Z" />
</SvgIcon>;

const AddColumnRight = () => <SvgIcon viewBox='0 -960 960 960'>
  <path d="M160-760v560h240v-560H160ZM80-120v-720h720v160h-80v-80H480v560h240v-80h80v160H80Zm400-360Zm-80 0h80-80Zm0 0Zm320 120v-80h-80v-80h80v-80h80v80h80v80h-80v80h-80Z" />
</SvgIcon>;

const RemoveRow = () => <SvgIcon viewBox='0 -960 960 960'>
  <path d="M560-280H120v-400h720v120h-80v-40H200v240h360v80Zm-360-80v-240 240Zm440 104 84-84-84-84 56-56 84 84 84-84 56 56-83 84 83 84-56 56-84-83-84 83-56-56Z" />
</SvgIcon>;

const RemoveColumn = () => <SvgIcon viewBox='0 -960 960 960' sx={{ transform: 'rotate(90deg)' }}>
  <path d="M560-280H120v-400h720v120h-80v-40H200v240h360v80Zm-360-80v-240 240Zm440 104 84-84-84-84 56-56 84 84 84-84 56 56-83 84 83 84-56 56-84-83-84 83-56-56Z" />
</SvgIcon>;

const RemoveRowHeader = () => <SvgIcon viewBox='0 -960 960 960'>
  <path d="M120-280v-400h720v400H120Zm80-80h560v-240H200v240Zm0 0v-240 240Z" />
</SvgIcon>;

const RemoveColumnHeader = () => <SvgIcon viewBox='0 -960 960 960' sx={{ transform: 'rotate(90deg)' }}>
  <path d="M120-280v-400h720v400H120Zm80-80h560v-240H200v240Zm0 0v-240 240Z" />
</SvgIcon>;

const AddRowHeader = () => <SvgIcon viewBox='0 -960 960 960' sx={{ transform: 'rotate(45deg)' }}>
  <path d="m272-104-38-38-42 42q-19 19-46.5 19.5T100-100q-19-19-19-46t19-46l42-42-38-40 554-554q12-12 29-12t29 12l112 112q12 12 12 29t-12 29L272-104Zm172-396L216-274l58 58 226-228-56-56Z" />
</SvgIcon>;

const AddColumnHeader = () => <SvgIcon viewBox='0 -960 960 960' sx={{ transform: 'rotate(-45deg)' }}>
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


export default function TableTools({ editor, node }: { editor: LexicalEditor, node: TableNode }): JSX.Element {
  const [formatType, setFormatType] = useState<ElementFormatType>();
  const [float, setFloat] = useState<string>();
  const [selectionCounts, setSelectionCounts] = useState({ columns: 1, rows: 1, });
  const [canMergeCells, setCanMergeCells] = useState(false);
  const [canUnmergeCell, setCanUnmergeCell] = useState(false);
  const [tableCellNode, setTableCellNode] = useState<TableCellNode | null>(null);
  const [tableCellStyle, setTableCellStyle] = useState<Record<string, string> | null>(null);
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const open = Boolean(anchorEl);
  const textColor = tableCellStyle?.color;
  const backgroundColor = tableCellStyle?.['background-color'];

  useEffect(() => {
    return editor.registerUpdateListener(() => {
      editor.getEditorState().read(() => {
        const tableCell = $getSelectedTableCell(editor);
        setTableCellNode(tableCell);
      });
    });
  }, [editor]);

  useEffect(() => {
    if (tableCellNode === null) return;
    return editor.registerMutationListener(TableCellNode, (nodeMutations) => {
      const nodeUpdated =
        nodeMutations.get(tableCellNode.getKey()) === 'updated';

      if (nodeUpdated) {
        editor.getEditorState().read(() => {
          setTableCellNode(tableCellNode.getLatest());
        });
        const cellStyle = getCellStyle();
        setTableCellStyle(cellStyle);
      }
    });
  }, [editor, tableCellNode]);

  useEffect(() => {
    if (!open) return;
    editor.getEditorState().read(() => {
      const selection = $getSelection();
      // Merge cells
      if ($isTableSelection(selection)) {
        const currentSelectionCounts = computeSelectionCount(selection);
        setSelectionCounts(currentSelectionCounts);
        setCanMergeCells(
          currentSelectionCounts.columns > 1 || currentSelectionCounts.rows > 1,
        );
      } else {
        setSelectionCounts({ columns: 1, rows: 1 });
        setCanMergeCells(false);
      }
      // Unmerge cell
      setCanUnmergeCell($canUnmerge());
    });
  }, [editor, open, tableCellNode]);

  const clearTableSelection = useCallback(() => {
    if (tableCellNode === null) return;
    editor.update(() => {
      if (tableCellNode.isAttached()) {
        const tableElement = editor.getElementByKey(
          node.getKey(),
        ) as HTMLTableElementWithWithTableSelectionState;

        if (!tableElement) {
          throw new Error('Expected to find tableElement in DOM');
        }

        const tableObserver = getTableObserverFromTableElement(tableElement);
        if (tableObserver !== null) {
          tableObserver.clearHighlight();
        }

        node.markDirty();
        setTableCellNode(tableCellNode.getLatest());
      }

    });
  }, [editor, node, tableCellNode]);

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
        $insertTableRow__EXPERIMENTAL(shouldInsertAfter);
      });
    },
    [editor],
  );

  const insertTableColumnAtSelection = useCallback(
    (shouldInsertAfter: boolean) => {
      editor.update(() => {
        for (let i = 0; i < selectionCounts.columns; i++) {
          $insertTableColumn__EXPERIMENTAL(shouldInsertAfter);
        }
      });
    },
    [editor, selectionCounts.columns],
  );

  const deleteTableRowAtSelection = useCallback(() => {
    editor.update(() => {
      $deleteTableRow__EXPERIMENTAL();
      handleClose();
    });
  }, [editor]);

  const deleteTableAtSelection = useCallback(() => {
    if (tableCellNode === null) return;
    editor.update(() => {
      node.selectPrevious();
      node.remove();
      handleClose();
    });
  }, [editor, node, tableCellNode]);

  const deleteTableColumnAtSelection = useCallback(() => {
    editor.update(() => {
      $deleteTableColumn__EXPERIMENTAL();
      handleClose();
    });
  }, [editor]);

  const getTableRowHeaderState = useCallback(() => {
    if (tableCellNode === null) return TableCellHeaderStates.NO_STATUS;
    return tableCellNode.__headerState & TableCellHeaderStates.ROW;
  }, [tableCellNode]);

  const getTableColumnHeaderState = useCallback(() => {
    if (tableCellNode === null) return TableCellHeaderStates.NO_STATUS;
    return tableCellNode.__headerState & TableCellHeaderStates.COLUMN;
  }, [tableCellNode]);

  const getTableRowStriping = useCallback(() => {
    return editor.getEditorState().read(() => {
      if (node.isAttached()) {
        return node.getRowStriping();
      }
      return node.__rowStriping;
    });
  }, [node]);

  const toggleTableRowIsHeader = useCallback(() => {
    if (tableCellNode === null) return;
    editor.update(() => {
      const tableNode = $getTableNodeFromLexicalNodeOrThrow(tableCellNode);

      const tableRowIndex = $getTableRowIndexFromTableCellNode(tableCellNode);

      const tableRows = tableNode.getChildren();

      if (tableRowIndex >= tableRows.length || tableRowIndex < 0) {
        throw new Error('Expected table cell to be inside of table row.');
      }

      const tableRow = tableRows[tableRowIndex];

      if (!$isTableRowNode(tableRow)) {
        throw new Error('Expected table row');
      }

      const newStyle =
        tableCellNode.getHeaderStyles() ^ TableCellHeaderStates.ROW;
      tableRow.getChildren().forEach((tableCell) => {
        if (!$isTableCellNode(tableCell)) {
          throw new Error('Expected table cell');
        }

        tableCell.setHeaderStyles(newStyle, TableCellHeaderStates.ROW);
      });

    });
  }, [editor, node, tableCellNode]);

  const toggleTableColumnIsHeader = useCallback(() => {
    if (tableCellNode === null) return;
    editor.update(() => {
      const tableNode = $getTableNodeFromLexicalNodeOrThrow(tableCellNode);

      const tableColumnIndex =
        $getTableColumnIndexFromTableCellNode(tableCellNode);

      const tableRows = tableNode.getChildren<TableRowNode>();
      const maxRowsLength = Math.max(
        ...tableRows.map((row) => row.getChildren().length),
      );

      if (tableColumnIndex >= maxRowsLength || tableColumnIndex < 0) {
        throw new Error('Expected table cell to be inside of table row.');
      }

      const newStyle =
        tableCellNode.getHeaderStyles() ^ TableCellHeaderStates.COLUMN;
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
  }, [editor, node, tableCellNode]);

  const toggleRowStriping = useCallback(() => {
    if (tableCellNode === null) return
    editor.update(() => {
      if (tableCellNode.isAttached()) {
        const tableNode = $getTableNodeFromLexicalNodeOrThrow(tableCellNode);
        if (tableNode) {
          tableNode.setRowStriping(!tableNode.getRowStriping());
        }
      }
    });
  }, [editor, node, tableCellNode]);

  const applyCellStyle = useCallback(
    (styles: Record<string, string>) => {
      editor.update(() => {
        const selection = $getSelection();
        if ($isRangeSelection(selection) || $isTableSelection(selection)) {
          const [cell] = $getNodeTriplet(selection.anchor);
          if ($isTableCellNode(cell)) {
            $patchStyle(cell, styles);
          }

          if ($isTableSelection(selection)) {
            const nodes = selection.getNodes();
            const cells = nodes.filter($isTableCellNode);
            $patchStyle(cells, styles);
          }
        }
      });
    },
    [editor],
  );

  const updateCellColor = useCallback(
    (key: string, value: string) => {
      const styleKey = key === 'text' ? 'color' : 'background-color';
      applyCellStyle({ [styleKey]: value });
    },
    [editor],
  );

  const getCellWritingMode = useCallback(() => {
    return tableCellStyle?.['writing-mode'] ?? '';
  }, [tableCellStyle]);

  const toggleCellWritingMode = useCallback(
    () => {
      const value = getCellWritingMode() === '' ? 'vertical-rl' : '';
      applyCellStyle({ 'writing-mode': value });
    },
    [editor, tableCellStyle],
  );


  function getNodeFormatType(): ElementFormatType {
    return editor.getEditorState().read(() => {
      return node.getFormatType();
    });
  }
  function getNodeFloat(): string {
    return editor.getEditorState().read(() => {
      return $getNodeStyleValueForProperty(node, "float", "none");
    });
  }

  useEffect(() => {
    setFormatType(getNodeFormatType());
    setFloat(getNodeFloat());
  }, [node]);

  function getCellStyle(): Record<string, string> | null {
    return editor.getEditorState().read(() => {
      const selection = $getSelection();
      if ($isRangeSelection(selection) || $isTableSelection(selection)) {
        const [cell] = $getNodeTriplet(selection.anchor);
        if ($isTableCellNode(cell)) {
          const css = cell.getStyle();
          const style = getStyleObjectFromCSS(css);
          return style;
        }
      }
      return null;
    });
  }

  useEffect(() => {
    if (tableCellNode === null) return;
    const cellStyle = getCellStyle();
    setTableCellStyle(cellStyle);
  }, [tableCellNode]);

  function updateFloat(newFloat: 'left' | 'right' | 'none') {
    setFloat(newFloat);
    editor.update(() => {
      node.setFormat('');
      $patchStyle(node, { float: newFloat });
    });
  }

  function updateFormat(newFormat: ElementFormatType) {
    setFormatType(newFormat);
    editor.update(() => {
      node.setFormat(newFormat);
      $patchStyle(node, { float: "none" });
    });
  }

  const handleClick = (event: React.MouseEvent<HTMLElement>) => {
    setAnchorEl(event.currentTarget);
    editor.getEditorState().read(() => {
      const tableCell = $getSelectedTableCell(editor);
      setTableCellNode(tableCell);
    });
  };

  const restoreFocus = useCallback(() => {
    editor.update(() => {
      const selection = $getSelection();
      if (!selection) return;
      $setSelection(selection.clone());
    }, { discrete: true, onUpdate() { setTimeout(() => editor.focus(), 0); } });
  }, [editor]);

  const handleClose = useCallback(() => {
    setAnchorEl(null);
    restoreFocus();
  }, [editor]);

  return (
    <>
      <Button
        id="table-tools-button"
        aria-controls={open ? 'table-tools-menu' : undefined}
        aria-haspopup="true"
        aria-expanded={open ? 'true' : undefined}
        variant="outlined"
        onClick={handleClick}
        startIcon={<TableChart />}
        endIcon={<KeyboardArrowDown />}
        sx={{
          color: 'text.primary',
          borderColor: 'divider',
          height: 40,
          '& .MuiButton-startIcon': { mr: { xs: 0, sm: 0.5 } }
        }}
      >
        <Typography variant="button" sx={{ display: { xs: "none", sm: "block" } }}>Table</Typography>
      </Button>
      <Menu id="table-tools-menu" aria-label="Formatting options for table"
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
          '& .MuiBackdrop-root': { userSelect: 'none' },
        }}
      >
        <MenuItem>
          <ToggleButtonGroup size="small" sx={{ width: "100%", justifyContent: "center" }}>
            <ToggleButton value="align-left" key="align-left" selected={formatType === "left"}
              onClick={() => {
                updateFormat('left');
              }}>
              <FormatAlignLeft />
            </ToggleButton>
            <ToggleButton value="align-center" key="align-center" selected={formatType === "center"}
              onClick={() => {
                updateFormat('center');
              }}>
              <FormatAlignCenter />
            </ToggleButton>,
            <ToggleButton value="align-right" key="align-right" selected={formatType === "right"}
              onClick={() => {
                updateFormat('right');
              }}>
              <FormatAlignRight />
            </ToggleButton>
          </ToggleButtonGroup>
        </MenuItem>
        <MenuItem>
          <ToggleButtonGroup size="small" sx={{ width: "100%", justifyContent: "center" }}>
            <ToggleButton value="float-left" key="float-left" selected={float === "left"}
              onClick={() => {
                updateFloat("left");
              }}>
              <FormatImageLeft />
            </ToggleButton>
            <ToggleButton value="align-justify" key="align-justify" selected={formatType === "justify" || (formatType === "" && float === "none")}
              onClick={() => {
                updateFormat('justify');
              }}>
              <ViewHeadline />
            </ToggleButton>,
            <ToggleButton value="float-right" key="float-right" selected={float === "right"}
              onClick={() => {
                updateFloat("right");
              }}>
              <FormatImageRight />
            </ToggleButton>
          </ToggleButtonGroup>

        </MenuItem>
        <Divider />

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
            {getCellWritingMode() === '' ? <TextRotationVertical /> : <TextRotationNone />}
          </ListItemIcon>
          <ListItemText>
            Make {getCellWritingMode() === '' ? 'Vertical' : 'Horizontal'}
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
        <MenuItem onClick={toggleRowStriping}>
          <ListItemIcon>
            <Texture sx={{ transform: 'rotate(45deg)' }} />
          </ListItemIcon>
          <ListItemText>
            {getTableRowStriping() ? 'Remove' : 'Add'} row striping
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
        <MenuItem onClick={deleteTableAtSelection}>
          <ListItemIcon>
            <Delete fontSize="small" />
          </ListItemIcon>
          <ListItemText>Delete Table</ListItemText>
        </MenuItem>
      </Menu>
    </>

  );
}