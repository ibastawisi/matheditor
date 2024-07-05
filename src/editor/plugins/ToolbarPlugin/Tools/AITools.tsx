"use client"
import { $createParagraphNode, $createTextNode, $getSelection, $isRangeSelection, BLUR_COMMAND, CLICK_COMMAND, COMMAND_PRIORITY_CRITICAL, KEY_DOWN_COMMAND, LexicalEditor, LexicalNode, SELECTION_CHANGE_COMMAND, TextNode, } from "lexical";
import { mergeRegister } from "@lexical/utils";
import { useCallback, useEffect, useRef, useState } from "react";
import { Menu, Button, MenuItem, ListItemIcon, ListItemText, Typography, TextField, CircularProgress } from "@mui/material";
import { KeyboardArrowDown, AutoAwesome, UnfoldMore, UnfoldLess, PlayArrow, ImageSearch, Autorenew, ArrowDropDown, ArrowDropUp } from "@mui/icons-material";
import { SxProps, Theme } from '@mui/material/styles';
import { useCompletion } from "ai/react";
import { SET_DIALOGS_COMMAND } from "../Dialogs/commands";
import { ANNOUNCE_COMMAND, UPDATE_DOCUMENT_COMMAND } from "@/editor/commands";
import { Announcement } from "@/types";
import { $isCodeNode } from "@lexical/code";
import { $isListNode } from "@lexical/list";
import { $isHorizontalRuleNode } from "@/editor/nodes/HorizontalRuleNode";
import { $findMatchingParent } from "@/editor";
import { $createTableCellNode, $createTableRowNode, $isTableCellNode, $isTableNode, $isTableRowNode, TableCellHeaderStates, TableRowNode } from "@/editor/nodes/TableNode";
import { throttle } from "@/editor/utils/throttle";

export default function AITools({ editor, sx }: { editor: LexicalEditor, sx?: SxProps<Theme> }): JSX.Element {
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const open = Boolean(anchorEl);
  const handleClick = (event: React.MouseEvent<HTMLElement>) => {
    setAnchorEl(event.currentTarget);
  };
  const handleClose = () => {
    setAnchorEl(null);
  };

  const promptRef = useRef<HTMLTextAreaElement>(null);

  const { completion, complete, isLoading, stop } = useCompletion({
    api: '/api/completion',
    onError(error) {
      annouunce({ message: { title: "Something went wrong", subtitle: "Please try again later" } });
    }
  });

  const annouunce = useCallback((announcement: Announcement) => {
    editor.dispatchCommand(ANNOUNCE_COMMAND, announcement);
  }, [editor]);

  const [isCollapsed, setIsCollapsed] = useState(true);
  const offset = useRef(0);

  const handlePrompt = async (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    const textarea = e.currentTarget;
    const isNavigatingUp = textarea.selectionStart === 0 && e.key === "ArrowUp";
    const isNavigatingDown = textarea.selectionStart === textarea.value.length && e.key === "ArrowDown";
    if (!isNavigatingUp && !isNavigatingDown) e.stopPropagation();
    if (isNavigatingDown) textarea.closest("li")?.focus();
    const command = textarea.value;
    const isSubmit = e.key === "Enter" && !e.shiftKey && command.trim().length > 0;
    if (!isSubmit) return;
    e.preventDefault();
    handleClose();
    editor.focus();
    editor.getEditorState().read(() => {
      const selection = $getSelection();
      if (!$isRangeSelection(selection)) return;
      const anchorNode = selection.anchor.getNode();
      let currentNode: LexicalNode | null | undefined = anchorNode;
      let textContent = "";
      while (currentNode && textContent.length < 100) {
        textContent = currentNode.getTextContent() + "\n\n" + textContent;
        currentNode = currentNode.getPreviousSibling() || currentNode.getParent()?.getPreviousSibling();
      }
      complete(textContent, { body: { option: "zap", command } });
    });
  }

  const handleRewrite = async () => {
    handleClose();
    editor.focus();
    editor.getEditorState().read(() => {
      const selection = $getSelection();
      if (!$isRangeSelection(selection)) return;
      const textContent = selection.getTextContent();
      complete(textContent, { body: { option: "improve" } });
    });
  }

  const handleShorter = async () => {
    handleClose();
    editor.focus();
    editor.getEditorState().read(() => {
      const selection = $getSelection();
      if (!$isRangeSelection(selection)) return;
      const textContent = selection.getTextContent();
      complete(textContent, { body: { option: "shorter" } });
    });
  }

  const handleLonger = async () => {
    handleClose();
    editor.focus();
    editor.getEditorState().read(() => {
      const selection = $getSelection();
      if (!$isRangeSelection(selection)) return;
      const textContent = selection.getTextContent();
      complete(textContent, { body: { option: "longer" } });
    });
  }

  const handleContinue = async () => {
    handleClose();
    editor.focus();
    editor.update(() => {
      const selection = $getSelection();
      if (!$isRangeSelection(selection)) return;
      const anchorNode = selection.anchor.getNode();
      let currentNode: LexicalNode | null | undefined = anchorNode;
      let textContent = "";
      while (currentNode && textContent.length < 100) {
        textContent = currentNode.getTextContent() + "\n\n" + textContent;
        currentNode = currentNode.getPreviousSibling() || currentNode.getParent()?.getPreviousSibling();
      }
      const isCollapsed = selection.isCollapsed();
      if (!isCollapsed) (selection.isBackward() ? selection.anchor : selection.focus).getNode().selectEnd();
      complete(textContent, { body: { option: "continue" } });
    });
  }

  const handleOCR = async () => {
    handleClose();
    editor.dispatchCommand(SET_DIALOGS_COMMAND, ({ ocr: { open: true } }));
  }

  useEffect(() => {
    const hasCompletion = completion.length > 0;
    if (!hasCompletion) return;
    const isStarting = offset.current === 0;
    let shouldInsertNewlineAfter = false;
    editor.update(() => {
      const selection = $getSelection();
      if (!$isRangeSelection(selection)) return;
      const delta = completion.slice(offset.current);
      offset.current = completion.length;
      const anchorNode = selection.anchor.getNode();
      const elementNode = anchorNode.getTopLevelElement();
      const tableNode = $findMatchingParent(anchorNode, $isTableNode);
      const isCodeNode = $isCodeNode(elementNode);
      const isListNode = $isListNode(elementNode);
      const isTableNode = !!tableNode;
      const isCollapsed = selection.isCollapsed();
      const isAtNewline = selection.anchor.offset === 0 && selection.focus.offset === 0;
      const shouldInsertNewlineBefore = isStarting && isCollapsed && !isAtNewline && !isCodeNode && !isListNode;
      const isEndingInNewline = delta.endsWith("\n");
      const isDeltaHrEnding = /^(-|=)+\n*$/.test(delta);
      const isDeltaLineBreaks = /^\n+$/.test(delta);
      const shouldTrimEndDelta = isEndingInNewline;
      const previousSibling = anchorNode.getPreviousSibling();
      // handle line break after
      shouldInsertNewlineAfter = isEndingInNewline && !isDeltaHrEnding;
      if (isListNode) shouldInsertNewlineAfter &&= isListNode;
      // handle horizontal rule
      if ($isHorizontalRuleNode(previousSibling) && (isDeltaHrEnding || isDeltaLineBreaks)) return;
      // handle line break before
      if (shouldInsertNewlineBefore) selection.insertParagraph();
      // handle table node
      if (isTableNode) {
        shouldInsertNewlineAfter = false;
        const currentRow = $findMatchingParent(anchorNode, $isTableRowNode);
        const currentCell = $findMatchingParent(anchorNode, $isTableCellNode);
        const isNewTable = tableNode.getChildrenSize() === 1 && currentRow?.getChildrenSize() === 1;
        const isEmptyCell = currentCell && currentCell.getTextContentSize() === 0;
        const anchorText = anchorNode.getTextContent();
        const isPossiblyLatex = (anchorText.match(/\$+/g) || []).length % 2 !== 0;
        const headerRow = tableNode.getFirstChild<TableRowNode>();
        const headerCellCount = headerRow?.getChildrenSize() || 0;
        const currentRowCellCount = currentRow?.getChildrenSize() || 0;
        const isHeaderRow = currentRow?.getIndexWithinParent() === 0;
        const isCurrentRowFull = !isHeaderRow && currentRowCellCount === headerCellCount;
        const shouldInsertNewCell = isNewTable || (delta.includes("|") && !isEmptyCell && !isPossiblyLatex && !isCurrentRowFull);
        const shouldInsertNewRow = delta.endsWith("\n") && !isEmptyCell;
        const shouldEndTable = delta.endsWith("\n\n") || (shouldInsertNewCell && isCurrentRowFull);
        const shouTrimStartDelta = isEmptyCell || shouldInsertNewCell;
        const isTableRowDivider = /^(-|=)+\n*$/.test(delta.trim()) && !isPossiblyLatex;
        if (isTableRowDivider) {
          const lastRow = currentRow?.getPreviousSibling();
          if (!$isTableRowNode(lastRow)) return;
          const lastRowCells = lastRow.getChildren().filter($isTableCellNode);
          const isLastRowHighlighted = lastRowCells.some(cell => cell.getHeaderStyles() === TableCellHeaderStates.ROW);
          if (isLastRowHighlighted) return;
          lastRowCells.forEach(cell => {
            cell.toggleHeaderStyle(TableCellHeaderStates.ROW);
          });
          return;
        }
        if (shouldEndTable) {
          shouldInsertNewlineAfter = true;
          tableNode.insertAfter($createParagraphNode()).selectEnd();
          return;
        }
        if (shouldInsertNewRow) return tableNode.append($createTableRowNode()).selectEnd();
        let cellText = delta.replaceAll("|", "");
        if (shouTrimStartDelta) cellText = cellText.trimStart();
        if (shouldTrimEndDelta) cellText = cellText.trimEnd();
        if (shouldInsertNewCell) {
          const cell = $createTableCellNode(TableCellHeaderStates.NO_STATUS);
          const paragraph = $createParagraphNode();
          const textNode = $createTextNode(cellText);
          cell.append(paragraph.append(textNode));
          return currentRow?.append(cell).selectEnd();
        }
        selection.insertText(cellText);
        return;
      }
      // handle code block
      if (isCodeNode) {
        shouldInsertNewlineAfter = false;
        const language = completion.match(/```(\w+)$/)?.[1];
        if (language) return elementNode.setLanguage(language);
        const elementText = elementNode.getTextContent();
        if (elementText === "\n") elementNode.getFirstChild()?.remove();
        const isStartingInNewline = elementNode.getTextContentSize() === 0 && isEndingInNewline;
        const textNode = $createTextNode(isStartingInNewline ? delta.trim() : delta);
        elementNode.append(textNode).selectEnd();
        const endIndex = elementNode.getTextContent().lastIndexOf("\n```");
        const isEnding = endIndex > -1;
        if (isEnding) {
          let deleteCount = elementNode.getTextContentSize() - endIndex;
          while (deleteCount > 0) {
            const lastChild = elementNode.getLastChild<TextNode>();
            if (!lastChild) break;
            deleteCount -= lastChild?.getTextContentSize();
            lastChild.remove();
          }
          elementNode.insertAfter($createParagraphNode()).selectStart().insertParagraph();
        }
        return;
      }
      // normal text
      selection.insertText(shouldTrimEndDelta ? delta.trimEnd() : delta);
    }, {
      tag: !isStarting ? "history-merge" : undefined,
      discrete: true,
      onUpdate() {
        updateDocument();
        if (!shouldInsertNewlineAfter) return;
        editor.update(() => {
          const selection = $getSelection();
          if (!$isRangeSelection(selection)) return;
          const anchorNode = selection.anchor.getNode();
          const elementNode = anchorNode.getTopLevelElement();
          const isListNode = $isListNode(elementNode);
          if (isListNode) elementNode.insertAfter($createParagraphNode()).selectEnd();
          else selection.insertParagraph();
        }, { tag: "history-merge", discrete: true });
      },
    });
  }, [completion]);

  const updateDocument = useCallback(throttle(() => {
    editor.dispatchCommand(UPDATE_DOCUMENT_COMMAND, undefined);
  }, 1000), [editor]);

  useEffect(() => {
    if (isLoading) return;
    const isStarting = offset.current === 0;
    if (isStarting) return;
    offset.current = 0;
    editor.dispatchCommand(UPDATE_DOCUMENT_COMMAND, undefined);
  }, [isLoading]);

  useEffect(() => {
    return mergeRegister(
      editor.registerCommand(
        SELECTION_CHANGE_COMMAND,
        () => {
          if (isLoading) return false;
          const selection = $getSelection();
          setIsCollapsed(selection?.isCollapsed() ?? true);
          return false;
        },
        COMMAND_PRIORITY_CRITICAL,
      ),
      editor.registerCommand(
        CLICK_COMMAND,
        () => {
          if (isLoading) stop();
          return false;
        },
        COMMAND_PRIORITY_CRITICAL,
      ),
      editor.registerCommand(
        KEY_DOWN_COMMAND,
        () => {
          if (isLoading) stop();
          return false;
        },
        COMMAND_PRIORITY_CRITICAL,
      ),
      editor.registerCommand(
        BLUR_COMMAND,
        () => {
          if (isLoading) stop();
          return false;
        },
        COMMAND_PRIORITY_CRITICAL,
      ),
    );
  }, [editor, isLoading, stop]);

  return (
    <>
      <Button
        id="ai-tools-button"
        aria-controls={open ? 'ai-tools-menu' : undefined}
        aria-haspopup="true"
        aria-expanded={open ? 'true' : undefined}
        variant="outlined"
        onClick={handleClick}
        startIcon={<AutoAwesome />}
        endIcon={isLoading ? <CircularProgress size={16} /> : open ? <ArrowDropUp /> : <ArrowDropDown />}
        sx={{
          color: 'text.primary',
          borderColor: 'divider',
          height: 40,
          '& .MuiButton-startIcon': { mr: { xs: 0, md: 0.5 } },
          '& .MuiButton-endIcon': { mr: '-6px', ml: 0, '& svg': { fontSize: 24 } },
        }}
        disabled={isLoading}
      >
        <Typography variant="button" sx={{ display: { xs: "none", md: "block" } }}>AI</Typography>
      </Button>
      <Menu id="ai-tools-menu" aria-label="Formatting options for ai"
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
          '& .MuiList-root': { pt: 0, },
        }}
      >
        <MenuItem
          sx={{ p: 0, mb: 1, flexDirection: 'column' }}
          onFocusVisible={(e) => {
            const currentTarget = e.currentTarget;
            const relatedTarget = e.relatedTarget;
            setTimeout(() => {
              const promptInput = promptRef.current;
              const isPromptFocused = document.activeElement === promptInput;
              if (isPromptFocused) return;
              if (relatedTarget !== promptInput) promptInput?.focus();
              else currentTarget.nextElementSibling?.focus();
            }, 0);
          }}
        >
          <TextField
            multiline
            hiddenLabel
            fullWidth
            variant="filled"
            size="small"
            placeholder="What to do?"
            inputRef={promptRef}
            autoFocus
            autoComplete="off"
            spellCheck="false"
            inputProps={{
              onKeyDown: handlePrompt
            }}
            sx={{ flexGrow: 1, '& .MuiInputBase-root': { flexGrow: 1 } }}
          />
        </MenuItem>
        <MenuItem disabled={isLoading} onClick={handleContinue}>
          <ListItemIcon>
            <PlayArrow />
          </ListItemIcon>
          <ListItemText>Continue Writing</ListItemText>
        </MenuItem>
        <MenuItem disabled={isLoading || isCollapsed} onClick={handleRewrite}>
          <ListItemIcon>
            <Autorenew />
          </ListItemIcon>
          <ListItemText>Rewrite</ListItemText>
        </MenuItem>
        <MenuItem disabled={isLoading || isCollapsed} onClick={handleShorter}>
          <ListItemIcon>
            <UnfoldLess />
          </ListItemIcon>
          <ListItemText>Shorter</ListItemText>
        </MenuItem>
        <MenuItem disabled={isLoading || isCollapsed} onClick={handleLonger}>
          <ListItemIcon>
            <UnfoldMore />
          </ListItemIcon>
          <ListItemText>Longer</ListItemText>
        </MenuItem>
        <MenuItem disabled={isLoading || !isCollapsed} onClick={handleOCR}>
          <ListItemIcon>
            <ImageSearch />
          </ListItemIcon>
          <ListItemText>Image to Text</ListItemText>
        </MenuItem>
      </Menu>
    </>
  );
}