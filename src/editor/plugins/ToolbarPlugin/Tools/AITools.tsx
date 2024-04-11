"use client"
import { $getPreviousSelection, $getRoot, $getSelection, $isRangeSelection, $setSelection, BaseSelection, CLICK_COMMAND, COMMAND_PRIORITY_CRITICAL, LexicalEditor, SELECTION_CHANGE_COMMAND, UNDO_COMMAND, } from "lexical";
import { mergeRegister } from "@lexical/utils";
import { useEffect, useRef, useState } from "react";
import { Menu, Button, MenuItem, ListItemIcon, ListItemText, Typography, TextField, CircularProgress } from "@mui/material";
import { KeyboardArrowDown, AutoAwesome, Recycling, UnfoldMore, UnfoldLess, PlayArrow } from "@mui/icons-material";
import { SxProps, Theme } from '@mui/material/styles';
import { useCompletion } from "ai/react";

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
  });

  const [isCollapsed, setIsCollapsed] = useState(true);
  const initialOffset = useRef(0);

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
      initialOffset.current = selection.anchor.offset;
      let textContent = anchorNode.getTextContent() || "";
      if (!textContent) {
        const previousSibling = anchorNode.getPreviousSibling();
        textContent += previousSibling?.getTextContent();
      }
      complete(textContent, { body: { option: "continue" } });
    });
  }

  useEffect(() => {
    if (!isLoading) return;
    const hasCompletion = completion.length > 0;
    if (!hasCompletion) return;
    if (!isCollapsed) {
      editor.update(() => {
        const selection = $getSelection();
        if (!$isRangeSelection(selection)) return;
        selection.removeText();
      });
    }

    setTimeout(() => {
      editor.update(() => {
        editor.setEditable(false);
        const selection = $getSelection();
        if (!$isRangeSelection(selection)) return;
        const offset = selection.anchor.offset - initialOffset.current;
        selection.insertText(completion.slice(offset));
        editor.setEditable(true);
      }, { tag: "history-merge" });
    }, 0);
  }, [completion, isCollapsed, isLoading, editor]);

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
      ));
  }, [editor, isLoading, stop]);

  useEffect(() => {
    if (isLoading) return;
    initialOffset.current = 0;
  }, [isLoading]);

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
        <MenuItem disabled={isLoading || !isCollapsed} onClick={handleContinue}>
          <ListItemIcon>
            <PlayArrow />
          </ListItemIcon>
          <ListItemText>Continue Writing</ListItemText>
        </MenuItem>
        <MenuItem disabled={isLoading || isCollapsed} onClick={handleRewrite}>
          <ListItemIcon>
            <Recycling />
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
      </Menu>
    </>

  );
}