"use client"
import { $getSelection, $isRangeSelection, CLICK_COMMAND, COMMAND_PRIORITY_CRITICAL, KEY_DOWN_COMMAND, LexicalEditor, LexicalNode, SELECTION_CHANGE_COMMAND, } from "lexical";
import { mergeRegister } from "@lexical/utils";
import { useCallback, useEffect, useRef, useState } from "react";
import { Menu, Button, MenuItem, ListItemIcon, ListItemText, Typography, TextField, CircularProgress } from "@mui/material";
import { KeyboardArrowDown, AutoAwesome, UnfoldMore, UnfoldLess, PlayArrow, ImageSearch, Autorenew } from "@mui/icons-material";
import { SxProps, Theme } from '@mui/material/styles';
import { useCompletion } from "ai/react";
import { SET_DIALOGS_COMMAND } from "../Dialogs/commands";
import { SET_ANNOUNCEMENT_COMMAND } from "@/editor/commands";
import { Announcement } from "@/types";

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
    editor.dispatchCommand(SET_ANNOUNCEMENT_COMMAND, announcement);
  }, [editor]);

  const [isCollapsed, setIsCollapsed] = useState(true);
  const offset = useRef(0);

  const handlePrompt = async (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    e.stopPropagation();
    const command = promptRef.current?.value || "";
    const isSubmit = e.key === "Enter" && !e.shiftKey && command.trim().length > 0;
    if (!isSubmit) return;
    e.preventDefault();
    handleClose();
    editor.focus();
    editor.update(() => {
      const selection = $getSelection();
      if (!$isRangeSelection(selection)) return;
      const textContent = selection.getTextContent();
      complete(textContent, { body: { option: "zap", command } });
    });
  }

  const handleRewrite = async () => {
    handleClose();
    editor.focus();
    editor.update(() => {
      const selection = $getSelection();
      if (!$isRangeSelection(selection)) return;
      const textContent = selection.getTextContent();
      complete(textContent, { body: { option: "improve" } });
    });
  }

  const handleSummarize = async () => {
    handleClose();
    editor.focus();
    editor.update(() => {
      const selection = $getSelection();
      if (!$isRangeSelection(selection)) return;
      const textContent = selection.getTextContent();
      complete(textContent, { body: { option: "shorter" } });
    });
  }

  const handleExpand = async () => {
    handleClose();
    editor.focus();
    editor.update(() => {
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
        textContent = currentNode.getTextContent() + "\n" + textContent;
        currentNode = currentNode.getPreviousSibling() || currentNode.getParent()?.getPreviousSibling();
      }
      if (!isCollapsed) {
        selection.focus.getNode().selectEnd();
      }
      complete(textContent, { body: { option: "continue" } });
    });
  }

  const handleOCR = async () => {
    handleClose();
    editor.dispatchCommand(SET_DIALOGS_COMMAND, ({ ocr: { open: true } }));
  }

  useEffect(() => {
    if (!isLoading) {
      offset.current = 0; return;
    }
    const hasCompletion = completion.length > 0;
    if (!hasCompletion) return;

    editor.update(() => {
      const selection = $getSelection();
      if (!$isRangeSelection(selection)) return;
      selection.insertText(completion.slice(offset.current));
      offset.current = completion.length;
    }, { tag: !!(offset.current) ? "history-merge" : undefined });

  }, [completion, isCollapsed, isLoading]);

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
        endIcon={isLoading ? <CircularProgress size={16} /> : <KeyboardArrowDown />}
        sx={{
          color: 'text.primary',
          borderColor: 'divider',
          height: 40,
          '& .MuiButton-startIcon': { mr: { xs: 0, sm: 0.5 } }
        }}
        disabled={isLoading}
      >
        <Typography variant="button" sx={{ display: { xs: "none", sm: "block" } }}>AI</Typography>
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
          sx={{ p: 0, mb: 1, }}
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
        <MenuItem disabled={isLoading || isCollapsed} onClick={handleSummarize}>
          <ListItemIcon>
            <UnfoldLess />
          </ListItemIcon>
          <ListItemText>Summarize</ListItemText>
        </MenuItem>
        <MenuItem disabled={isLoading || isCollapsed} onClick={handleExpand}>
          <ListItemIcon>
            <UnfoldMore />
          </ListItemIcon>
          <ListItemText>Expand</ListItemText>
        </MenuItem>
        <MenuItem disabled={isLoading || !isCollapsed} onClick={handleOCR}>
          <ListItemIcon>
            <ImageSearch />
          </ListItemIcon>
          <ListItemText>OCR</ListItemText>
        </MenuItem>
      </Menu>
    </>
  );
}