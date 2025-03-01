"use client"
import { $addUpdateTag, $createParagraphNode, $getPreviousSelection, $getSelection, $isRangeSelection, $setSelection, BLUR_COMMAND, CLICK_COMMAND, COMMAND_PRIORITY_CRITICAL, KEY_DOWN_COMMAND, LexicalEditor, LexicalNode, ParagraphNode, SELECTION_CHANGE_COMMAND, TextNode, } from "lexical";
import { mergeRegister } from "@lexical/utils";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Menu, Button, MenuItem, ListItemText, Typography, TextField, CircularProgress, IconButton, ListItemIcon } from "@mui/material";
import { AutoAwesome, UnfoldMore, UnfoldLess, PlayArrow, ImageSearch, Autorenew, ArrowDropDown, ArrowDropUp, Send, Settings } from "@mui/icons-material";
import { SxProps, Theme } from '@mui/material/styles';
import { useCompletion } from "ai/react";
import { SET_DIALOGS_COMMAND } from "../Dialogs/commands";
import { ANNOUNCE_COMMAND, UPDATE_DOCUMENT_COMMAND } from "@/editor/commands";
import { Announcement } from "@/types";
import { throttle } from "@/editor/utils/throttle";
import { $convertFromMarkdownString, createTransformers } from "../../MarkdownPlugin";

const getLlmConfig = () => {
  const initialValue = { provider: 'google', model: 'gemini-2.0-flash-exp' };
  try {
    const item = window.localStorage.getItem('llm');
    return item ? JSON.parse(item) : initialValue;
  } catch (error) {
    console.log(error);
    return initialValue;
  }
}

export default function AITools({ editor, sx }: { editor: LexicalEditor, sx?: SxProps<Theme> }) {
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const open = Boolean(anchorEl);
  const handleClick = (event: React.MouseEvent<HTMLElement>) => {
    setAnchorEl(event.currentTarget);
  };
  const handleClose = useCallback(() => {
    setAnchorEl(null);
    setTimeout(() => {
      editor.update(() => {
        const selection = $getSelection() || $getPreviousSelection();
        if (!selection) return;
        $setSelection(selection.clone());
      }, { discrete: true, onUpdate() { editor.focus(undefined, { defaultSelection: "rootStart" }) } });
    }, 0);
  }, [editor]);

  const promptRef = useRef<HTMLTextAreaElement>(null);

  const { completion, complete, isLoading, stop } = useCompletion({
    api: '/api/completion',
    streamProtocol: 'text',
    onError(error) {
      annouunce({ message: { title: "Something went wrong", subtitle: "Please try again later" } });
    }
  });

  const annouunce = useCallback((announcement: Announcement) => {
    editor.dispatchCommand(ANNOUNCE_COMMAND, announcement);
  }, [editor]);

  const [isCollapsed, setIsCollapsed] = useState(true);
  const offset = useRef(0);

  const handlePrompt = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    const textarea = e.currentTarget;
    const isNavigatingUp = textarea.selectionStart === 0 && e.key === "ArrowUp";
    const isNavigatingDown = textarea.selectionStart === textarea.value.length && e.key === "ArrowDown";
    if (!isNavigatingUp && !isNavigatingDown) e.stopPropagation();
    if (isNavigatingDown) textarea.closest("li")?.focus();
    const command = textarea.value;
    const isSubmit = e.key === "Enter" && !e.shiftKey && command.trim().length > 0;
    if (!isSubmit) return;
    e.preventDefault();
    handleSubmit();
  }

  const handleSubmit = () => {
    const command = promptRef.current?.value;
    if (!command) return;
    handleClose();
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
      const { provider, model } = getLlmConfig();
      complete(textContent, { body: { option: "zap", command, provider, model } });
    });
  }

  const handleRewrite = () => {
    handleClose();
    editor.getEditorState().read(() => {
      const selection = $getSelection();
      if (!$isRangeSelection(selection)) return;
      const textContent = selection.getTextContent();
      const { provider, model } = getLlmConfig();
      complete(textContent, { body: { option: "improve", provider, model } });
    });
  }

  const handleShorter = () => {
    handleClose();
    editor.getEditorState().read(() => {
      const selection = $getSelection();
      if (!$isRangeSelection(selection)) return;
      const textContent = selection.getTextContent();
      const { provider, model } = getLlmConfig();
      complete(textContent, { body: { option: "shorter", provider, model } });
    });
  }

  const handleLonger = () => {
    handleClose();
    editor.getEditorState().read(() => {
      const selection = $getSelection();
      if (!$isRangeSelection(selection)) return;
      const textContent = selection.getTextContent();
      const { provider, model } = getLlmConfig();
      complete(textContent, { body: { option: "longer", provider, model } });
    });
  }

  const handleContinue = () => {
    handleClose();
    editor.update(() => {
      const selection = $getSelection();
      if (!$isRangeSelection(selection)) return;
      const anchorNode = selection.anchor.getNode();
      let currentNode: LexicalNode | null | undefined = anchorNode;
      let textContent = "";
      while (currentNode && textContent.length < 1024) {
        textContent = currentNode.getTextContent() + "\n\n" + textContent;
        currentNode = currentNode.getPreviousSibling() || currentNode.getParent()?.getPreviousSibling();
      }
      const isCollapsed = selection.isCollapsed();
      if (!isCollapsed) (selection.isBackward() ? selection.anchor : selection.focus).getNode().selectEnd();
      const { provider, model } = getLlmConfig();
      complete(textContent, { body: { option: "continue", provider, model } });
    });
  }

  const handleOCR = () => {
    handleClose();
    editor.dispatchCommand(SET_DIALOGS_COMMAND, ({ ocr: { open: true } }));
  }

  const transformers = useMemo(() => createTransformers(editor), [editor]);

  useEffect(() => {
    if (completion.length === 0) return;
    const isStarting = offset.current === 0;
    editor.update(() => {
      const selection = $getSelection();
      if (!$isRangeSelection(selection)) return;
      if (!isStarting) $addUpdateTag("history-merge");
      offset.current = completion.length;
      const anchorNode = selection.anchor.getNode();
      const isCollapsed = selection.isCollapsed();
      if (!isCollapsed) selection.insertText("");
      const isAtNewline = selection.anchor.offset === 0 && selection.focus.offset === 0;
      const shouldInsertNewline = isStarting && !isAtNewline;
      const elementNode = shouldInsertNewline ? selection.insertParagraph() : anchorNode.getTopLevelElement();
      if (!elementNode) return;
      $convertFromMarkdownString(completion, transformers, elementNode);
      elementNode.selectEnd();
    }, { onUpdate: updateDocument });
  }, [completion]);

  const updateDocument = useCallback(throttle(() => {
    editor.dispatchCommand(UPDATE_DOCUMENT_COMMAND, undefined);
  }, 1000), [editor]);

  useEffect(() => {
    if (isLoading) return;
    if (offset.current === 0) return;
    offset.current = 0;
    editor.update(() => {
      const selection = $getSelection();
      if (!$isRangeSelection(selection)) return;
      const anchorNode = selection.anchor.getNode();
      const elementNode = anchorNode.getTopLevelElement();
      if (!elementNode) return;
      const parent = elementNode.getParent<ParagraphNode>();
      if (!parent) return;
      const children = elementNode.getChildren();
      parent.splice(elementNode.getIndexWithinParent(), 1, children);
    }, { tag: "history-merge", onUpdate: updateDocument });
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

  const openAiSettings = () => {
    editor.dispatchCommand(SET_DIALOGS_COMMAND, ({ ai: { open: true } }));
  }

  return (<>
    <Button
      id="ai-tools-button"
      aria-controls={open ? 'ai-tools-menu' : undefined}
      aria-haspopup="true"
      aria-expanded={open ? 'true' : undefined}
      variant="outlined"
      onClick={handleClick}
      startIcon={<AutoAwesome color={isLoading ? "disabled" : "action"} />}
      endIcon={isLoading ? <CircularProgress size={16} color="inherit" /> : open ? <ArrowDropUp color={isLoading ? "disabled" : "action"} /> : <ArrowDropDown color={isLoading ? "disabled" : "action"} />}
      sx={{
        color: 'text.primary',
        borderColor: 'divider',
        width: { xs: 62, sm: 'auto' },
        height: 36,
        '& .MuiButton-startIcon': { mr: { xs: 0, sm: 1 } },
        '& .MuiButton-endIcon': { mr: -1, ml: isLoading ? 1 : 0 },
        '& .MuiButton-endIcon > svg': { fontSize: 24 },
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
        '& .MuiBackdrop-root': { userSelect: 'none' },
      }}>
      <MenuItem
        sx={{ p: 0, mb: 1, flexDirection: 'column', backgroundColor: 'transparent !important' }}
        disableRipple
        disableTouchRipple
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
        disabled={isLoading}
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
          sx={{ flexGrow: 1, width: 256, "& .MuiInputBase-root": { paddingRight: 9, flexGrow: 1 } }}
          slotProps={{
            htmlInput: {
              onKeyDown: handlePrompt,
            },
          }}
        />
        <ListItemIcon sx={{ position: 'absolute', right: 4, bottom: 6 }}>
          <IconButton onClick={handleSubmit} disabled={isLoading} size="small">
            <Send />
          </IconButton>
          <IconButton onClick={openAiSettings} disabled={isLoading} size="small">
            <Settings />
          </IconButton>
        </ListItemIcon>
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
  </>);


}