import { $isMathNode } from "@/editor/nodes/MathNode";
import { $patchStyle } from "@/editor/nodes/utils";
import { $getSelectionStyleValueForProperty, $patchStyleText, } from '@lexical/selection';
import { TextDecrease, TextIncrease } from "@mui/icons-material";
import { Box, Select, MenuItem, SelectChangeEvent, IconButton, TextField, ListItemIcon, ListItemText, useMediaQuery } from "@mui/material";
import { $getSelection, $isRangeSelection, $setSelection, COMMAND_PRIORITY_CRITICAL, LexicalEditor, SELECTION_CHANGE_COMMAND } from "lexical";
import { useCallback, useEffect, useRef, useState } from "react";
import { useTheme } from '@mui/material/styles';
import { mergeRegister } from "@lexical/utils";

const MIN_ALLOWED_FONT_SIZE = 8;
const MAX_ALLOWED_FONT_SIZE = 72;

export default function FontSelect({ editor }: { editor: LexicalEditor }): JSX.Element {
  const [fontSize, setFontSize] = useState<string>('16px');
  const [fontFamily, setFontFamily] = useState<string>('Roboto');
  const fontSizeInputRef = useRef<HTMLInputElement>(null);
  const theme = useTheme();
  const matches = useMediaQuery(theme.breakpoints.up('md'));
  const shouldMergeHistory = useRef(false);

  const updateToolbar = useCallback(() => {
    const selection = $getSelection();
    if ($isRangeSelection(selection)) {
      const currentFontSize = $getSelectionStyleValueForProperty(selection, 'font-size');
      const currentFontFamily = $getSelectionStyleValueForProperty(selection, 'font-family');
      setFontSize(currentFontSize);
      setFontFamily(currentFontFamily);
      const domSelection = window.getSelection();
      if (!domSelection) return false;
      const focusNode = domSelection.focusNode;
      if (!focusNode) return false;
      const domElement = focusNode instanceof HTMLElement ? focusNode : focusNode.parentElement;
      if (!domElement) return false;
      const computedStyle = window.getComputedStyle(domElement);
      const computedFontSize = computedStyle.getPropertyValue('font-size');
      const computedFontFamily = computedStyle.getPropertyValue('font-family').split(',')[0].trim();
      if (!currentFontSize) setFontSize(computedFontSize);
      if (!currentFontFamily) setFontFamily(computedFontFamily);
    }
    return false;

  }, [editor]);

  useEffect(() => {
    return mergeRegister(
      editor.registerCommand(
        SELECTION_CHANGE_COMMAND,
        () => {
          shouldMergeHistory.current = false;
          updateToolbar();
          return false;
        },
        COMMAND_PRIORITY_CRITICAL,
      ),
      editor.registerUpdateListener(({ editorState }) => {
        editorState.read(() => {
          updateToolbar();
        });
      })
    );
  }, [editor]);

  const applyStyleText = useCallback(
    (styles: Record<string, string>) => {
      editor.update(() => {
        const selection = $getSelection();
        if ($isRangeSelection(selection)) {
          shouldMergeHistory.current = true;
          $patchStyleText(selection, styles);
          const mathNodes = selection.getNodes().filter($isMathNode);
          $patchStyle(mathNodes, styles);
        }
      }, { discrete: true, tag: shouldMergeHistory.current ? 'history-merge' : undefined });
    },
    [editor, shouldMergeHistory.current],
  );

  const updateFontSize = useCallback(
    (fontSize: number) => {
      setFontSize(fontSize + 'px');
      applyStyleText({ 'font-size': fontSize + 'px' });
    },
    [setFontSize, applyStyleText],
  );


  const updateFontFamily = useCallback((value: string) => {
    setFontFamily(value);
    applyStyleText({ 'font-family': value });
  }, [applyStyleText]);

  const onFontFamilySelect = useCallback(
    (e: SelectChangeEvent) => {
      const value = (e.target as HTMLSelectElement).value;
      if (!value) return;
      updateFontFamily(value);
    },
    [applyStyleText],
  );

  const FONT_FAMILY_OPTIONS = [
    ['Roboto', 'Roboto'],
    ['KaTeX_Main', 'KaTeX'],
    ['Virgil', 'Virgil'],
    ['Cascadia', 'Cascadia'],
    ['Courier New', 'Courier New'],
    ['Georgia', 'Georgia'],
  ];

  const handleClose = useCallback(() => {
    const selection = editor.getEditorState().read($getSelection);
    if (selection) editor.update(
      () => {
        $setSelection(selection.clone());
      },
      {
        discrete: true,
        tag: shouldMergeHistory.current ? 'history-merge' : undefined,
        onUpdate() {
          setTimeout(() => editor.focus(), 0);
        }
      }
    );
  }, [editor, shouldMergeHistory.current]);

  return (
    <Box sx={{ display: 'flex', gap: 0.5 }}>
      <Select size='small'
        sx={{
          '& .MuiSelect-select': { display: 'flex !important', alignItems: 'center', py: 0.5 },
          '& .MuiListItemIcon-root': { mr: { md: 0.5 }, minWidth: 20 },
          '& .MuiListItemText-root': { display: { xs: "none", md: "flex" } },
          fieldset: { borderColor: 'divider' },
          '&:hover .MuiOutlinedInput-notchedOutline': { borderColor: 'primary.main' },
        }}
        MenuProps={{
          slotProps: {
            root: { sx: { '& .MuiBackdrop-root': { userSelect: 'none' } } },
            paper: {
              sx: {
                '& .MuiList-root': { pt: 0 },
              }
            }
          }
        }}
        onChange={onFontFamilySelect}
        value={fontFamily}
        onClose={handleClose}
      >
        <MenuItem
          disableRipple
          disableTouchRipple
          divider
          onFocusVisible={(e) => {
            const currentTarget = e.currentTarget;
            const relatedTarget = e.relatedTarget;
            setTimeout(() => {
              const promptInput = fontSizeInputRef.current;
              const isPromptFocused = document.activeElement === promptInput;
              if (isPromptFocused) return;
              if (relatedTarget !== promptInput) promptInput?.focus();
              else currentTarget.nextElementSibling?.focus();
            }, 0);
          }}
          sx={{ justifyContent: 'center' }}
        >
          <FontSizePicker
            editor={editor}
            fontSize={fontSize}
            updateFontSize={updateFontSize}
            fontSizeInputRef={fontSizeInputRef}
          />

        </MenuItem>
        {FONT_FAMILY_OPTIONS.map(([option, text]) => <MenuItem key={option} value={option}
          onFocusVisible={(e) => {
            updateFontFamily(option);
            const menuItem = e.currentTarget as HTMLElement;
            menuItem.focus();
          }}>
          <ListItemIcon sx={{ fontFamily: option }}>Aa</ListItemIcon>
          <ListItemText sx={{ '& *': { fontFamily: option } }}>{text}</ListItemText>
        </MenuItem>)}
      </Select>
      {matches && <FontSizePicker
        editor={editor}
        fontSize={fontSize}
        updateFontSize={updateFontSize}
        fontSizeInputRef={fontSizeInputRef}
      />}
    </Box>
  );
};

const FontSizePicker = ({ editor, fontSize, updateFontSize, fontSizeInputRef }: {
  editor: LexicalEditor,
  fontSize: string,
  updateFontSize: (fontSize: number) => void,
  fontSizeInputRef: React.RefObject<HTMLInputElement>,
}): JSX.Element => {
  const increaseFontSize = useCallback(() => {
    const currentFontSize = parseInt(fontSize);
    let updatedFontSize = currentFontSize;
    switch (true) {
      case currentFontSize < MIN_ALLOWED_FONT_SIZE:
        updatedFontSize = MIN_ALLOWED_FONT_SIZE;
        break;
      case currentFontSize < 12:
        updatedFontSize += 1;
        break;
      case currentFontSize < 20:
        updatedFontSize += 2;
        break;
      case currentFontSize < 36:
        updatedFontSize += 4;
        break;
      case currentFontSize <= 60:
        updatedFontSize += 12;
        break;
      default:
        updatedFontSize = MAX_ALLOWED_FONT_SIZE;
        break;
    }
    updateFontSize(updatedFontSize);
  }, [fontSize, updateFontSize]);

  const decreaseFontSize = useCallback(() => {
    const currentFontSize = parseInt(fontSize);
    let updatedFontSize = currentFontSize;
    switch (true) {
      case currentFontSize > MAX_ALLOWED_FONT_SIZE:
        updatedFontSize = MAX_ALLOWED_FONT_SIZE;
        break;
      case currentFontSize >= 48:
        updatedFontSize -= 12;
        break;
      case currentFontSize >= 24:
        updatedFontSize -= 4;
        break;
      case currentFontSize >= 14:
        updatedFontSize -= 2;
        break;
      case currentFontSize >= 9:
        updatedFontSize -= 1;
        break;
      default:
        updatedFontSize = MIN_ALLOWED_FONT_SIZE;
        break;
    }
    updateFontSize(updatedFontSize);
  }, [fontSize, updateFontSize]);

  return (
    <Box sx={{ display: 'flex', alignItems: 'center' }} onClick={(e) => e.stopPropagation()}>
      <IconButton
        disabled={parseInt(fontSize) <= MIN_ALLOWED_FONT_SIZE}
        onClick={e => {
          e.stopPropagation();
          decreaseFontSize();
        }}
        sx={{
          width: 40,
          height: 40,
          borderRadius: 1,
          borderTopRightRadius: 0,
          borderBottomRightRadius: 0,
          borderRight: 'none',
          borderWidth: 1,
          borderStyle: 'solid',
          borderColor: 'divider',
          '&:hover': { borderColor: 'primary.main' },
        }}
        aria-label="increase font size"
      >
        <TextDecrease fontSize="small" />
      </IconButton>
      <TextField
        hiddenLabel
        variant="outlined"
        size="small"
        inputRef={fontSizeInputRef}
        autoComplete="off"
        spellCheck="false"
        sx={{
          width: 48,
          fieldset: { borderColor: 'divider' },
          '& .MuiInputBase-root': {
            borderRadius: 0,
            '&:hover .MuiOutlinedInput-notchedOutline': { borderColor: 'primary.main' },
          },
          '& .MuiInputBase-input': {
            textAlign: 'center',
            '&::-webkit-inner-spin-button, &::-webkit-outer-spin-button': { appearance: 'none', margin: 0 },
            '-moz-appearance': 'textfield',
          },
        }}
        type="number"
        value={parseInt(fontSize) || ''}
        onChange={(e) => {
          updateFontSize(parseInt(e.target.value || '0') % 100);
          e.target.focus();
        }}
        onClick={(e) => e.stopPropagation()}
        inputProps={{
          min: MIN_ALLOWED_FONT_SIZE,
          max: MAX_ALLOWED_FONT_SIZE,
          onKeyDown: (e) => {
            const input = e.currentTarget;
            const isNavigatingUp = input.selectionStart === 0 && e.key === "ArrowUp";
            const isNavigatingDown = input.selectionStart === input.value.length && e.key === "ArrowDown";
            if (!isNavigatingUp && !isNavigatingDown) e.stopPropagation();
            const menuItem = input.closest("li");
            const isInsideMenu = !!menuItem;
            if (isInsideMenu && isNavigatingDown) menuItem.focus();
          }
        }}
      />
      <IconButton
        disabled={parseInt(fontSize) >= MAX_ALLOWED_FONT_SIZE}
        onClick={e => {
          e.stopPropagation();
          increaseFontSize();
        }}
        sx={{
          width: 40,
          height: 40,
          borderRadius: 1,
          borderTopLeftRadius: 0,
          borderBottomLeftRadius: 0,
          borderWidth: 1,
          borderStyle: 'solid',
          borderColor: 'divider',
          '&:hover': { borderColor: 'primary.main' },
        }}
        aria-label="decrease font size"
      >
        <TextIncrease fontSize="small" />
      </IconButton>
    </Box>
  );
};