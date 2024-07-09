import { $isMathNode } from "@/editor/nodes/MathNode";
import { $patchStyle } from "@/editor/nodes/utils";
import { $getSelectionStyleValueForProperty, $patchStyleText, } from '@lexical/selection';
import { Box, Select, MenuItem, SelectChangeEvent, ListItemIcon, ListItemText, useMediaQuery } from "@mui/material";
import { $getPreviousSelection, $getSelection, $isRangeSelection, $setSelection, COMMAND_PRIORITY_CRITICAL, LexicalEditor, SELECTION_CHANGE_COMMAND } from "lexical";
import { useCallback, useEffect, useRef, useState } from "react";
import { useTheme } from '@mui/material/styles';
import { mergeRegister } from "@lexical/utils";
import { FontSizePicker } from "../Tools/FontSizePicker";

export default function FontSelect({ editor }: { editor: LexicalEditor }): JSX.Element {
  const [fontSize, setFontSize] = useState<string>('16px');
  const [fontFamily, setFontFamily] = useState<string>('Roboto');
  const theme = useTheme();
  const matches = useMediaQuery(theme.breakpoints.up('md'));
  const shouldMergeHistoryRef = useRef(false);

  const updateToolbar = useCallback(() => {
    const selection = $getSelection();
    if ($isRangeSelection(selection)) {
      const nextFontSize = $getSelectionStyleValueForProperty(selection, 'font-size');
      const nextFontFamily = $getSelectionStyleValueForProperty(selection, 'font-family');
      setFontSize(nextFontSize);
      setFontFamily(nextFontFamily);
      const domSelection = window.getSelection();
      if (!domSelection) return false;
      const focusNode = domSelection.focusNode;
      if (!focusNode) return false;
      const isTextNode = focusNode.nodeType === Node.TEXT_NODE;
      const domElement = isTextNode ? focusNode.parentElement : focusNode as HTMLElement;
      if (!domElement) return false;
      const computedStyle = window.getComputedStyle(domElement);
      const currentFontSize = computedStyle.getPropertyValue('font-size');
      const currentFontFamily = computedStyle.getPropertyValue('font-family').split(',')[0].trim().replace(/['"]+/g, '');
      if (!nextFontSize) setFontSize(currentFontSize);
      if (!nextFontFamily) setFontFamily(currentFontFamily);
    }
    return false;

  }, [editor]);

  useEffect(() => {
    return mergeRegister(
      editor.registerCommand(
        SELECTION_CHANGE_COMMAND,
        () => {
          updateToolbar();
          const selection = $getSelection();
          const previousSelection = $getPreviousSelection();
          const isSameSelection = $isRangeSelection(selection) && $isRangeSelection(previousSelection)
            && selection.anchor.key === previousSelection.anchor.key && selection.anchor.offset === previousSelection.anchor.offset
            && selection.focus.key === previousSelection.focus.key && selection.focus.offset === previousSelection.focus.offset;
          shouldMergeHistoryRef.current &&= isSameSelection;
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
          shouldMergeHistoryRef.current = true;
          $patchStyleText(selection, styles);
          const mathNodes = selection.getNodes().filter($isMathNode);
          $patchStyle(mathNodes, styles);
        }
      }, { discrete: true, tag: shouldMergeHistoryRef.current ? 'history-merge' : undefined });
    },
    [editor, shouldMergeHistoryRef.current],
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

  const restoreFocus = useCallback(() => {
    editor.update(() => {
      const selection = $getSelection();
      if (!selection) return;
      $setSelection(selection.clone());
    }, { discrete: true, onUpdate() { setTimeout(() => editor.focus(), 0); } });
  }, [editor]);

  const handleClose = useCallback(() => {
    shouldMergeHistoryRef.current = false;
    restoreFocus();
  }, [editor]);

  return (
    <Box sx={{ display: 'flex', gap: 0.5, height: 40 }}>
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
              const promptInput = currentTarget.querySelector('input[type="number"]');
              const isPromptFocused = document.activeElement === promptInput;
              if (isPromptFocused) return;
              if (relatedTarget !== promptInput) promptInput?.focus();
              else currentTarget.nextElementSibling?.focus();
            }, 0);
          }}
          sx={{ justifyContent: 'center' }}
        >
          <FontSizePicker
            fontSize={fontSize}
            updateFontSize={updateFontSize}
            onBlur={() => { }}
          />

        </MenuItem>
        {FONT_FAMILY_OPTIONS.map(([option, text]) => <MenuItem key={option} value={option}
          onFocusVisible={(e) => {
            if (fontFamily !== option) updateFontFamily(option);
          }}>
          <ListItemIcon sx={{ fontFamily: option }}>Aa</ListItemIcon>
          <ListItemText sx={{ '& *': { fontFamily: option } }}>{text}</ListItemText>
        </MenuItem>)}
        {!FONT_FAMILY_OPTIONS.find(([option]) => option === fontFamily) && <MenuItem value={fontFamily}>
          <ListItemIcon sx={{ fontFamily: fontFamily }}>Aa</ListItemIcon>
          <ListItemText sx={{ '& *': { fontFamily: fontFamily } }}>{fontFamily}</ListItemText>
        </MenuItem>}
      </Select>
      {matches && <FontSizePicker
        fontSize={fontSize}
        updateFontSize={updateFontSize}
        onBlur={restoreFocus}
      />}
    </Box>
  );

};
