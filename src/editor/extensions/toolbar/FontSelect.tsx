"use client"
import { $isMathNode } from "@/editor/extensions/math/nodes";
import { $patchStyle } from "@/editor/extensions/shared/utils";
import { $patchStyleText } from '@lexical/selection';
import { useLexicalComposerContext } from "@lexical/react/LexicalComposerContext";
import { Box, Select, MenuItem, SelectChangeEvent, ListItemIcon, ListItemText, useMediaQuery } from "@mui/material";
import { $getPreviousSelection, $getSelection, $isRangeSelection, COMMAND_PRIORITY_CRITICAL, HISTORY_MERGE_TAG, SELECTION_CHANGE_COMMAND } from "lexical";
import { useCallback, useEffect, useRef } from "react";
import { useTheme } from '@mui/material/styles';
import { FontSizePicker } from "@/editor/extensions/shared/components/FontSizePicker";
import { useStore } from "@/editor/extensions/store/hooks";
import { restoreFocus as restoreEditorFocus } from "@/editor/utils/restoreFocus";

export default function FontSelect() {
  const [editor] = useLexicalComposerContext();
  const [fontSize, setFontSize] = useStore("fontSize");
  const [fontFamily, setFontFamily] = useStore("fontFamily");
  const theme = useTheme();
  const matches = useMediaQuery(theme.breakpoints.up('md'));
  const shouldMergeHistoryRef = useRef(false);

  useEffect(() => {
    return editor.registerCommand(
      SELECTION_CHANGE_COMMAND,
      () => {
        const selection = $getSelection();
        const previousSelection = $getPreviousSelection();
        const isSameSelection = $isRangeSelection(selection) && $isRangeSelection(previousSelection)
          && selection.anchor.key === previousSelection.anchor.key && selection.anchor.offset === previousSelection.anchor.offset
          && selection.focus.key === previousSelection.focus.key && selection.focus.offset === previousSelection.focus.offset;
        shouldMergeHistoryRef.current &&= isSameSelection;
        return false;
      },
      COMMAND_PRIORITY_CRITICAL,
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
      }, { discrete: true, tag: shouldMergeHistoryRef.current ? HISTORY_MERGE_TAG : undefined });
    },
    [editor],
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
    setTimeout(() => restoreEditorFocus(editor), 0);
  }, [editor]);

  const handleClose = useCallback(() => {
    shouldMergeHistoryRef.current = false;
    restoreFocus();
  }, [editor]);

  return (
    <Box sx={{ display: 'flex', gap: 0.5 }}>
      <Select size='small'
        sx={{
          fieldset: { borderColor: 'divider' },
          '& .MuiSelect-select': { display: 'flex !important', alignItems: 'center', pl: 1, pr: '28px !important', py: 1, minHeight: '0 !important', height: '20px !important' },
          '& .MuiSelect-icon': { m: 0, fontSize: 20 },
          '& .MuiListItemIcon-root': { mr: { sm: 0.5 }, minWidth: 20 },
          '& .MuiListItemText-root': { display: { xs: "none", sm: "flex" } },
          '&:hover .MuiOutlinedInput-notchedOutline': { borderColor: 'primary.main' },
        }}
        MenuProps={{
          slotProps: {
            root: {
              sx: {
                '& .MuiBackdrop-root': { userSelect: 'none' },
                '& .MuiList-root': { pt: 0 },
                '& .MuiMenuItem-root': { minHeight: 36 },
              }
            }
          }
        }}
        onChange={onFontFamilySelect}
        value={fontFamily}
        onClose={handleClose}
        inputProps={{ 'aria-label': 'font family' }}
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
          <ListItemIcon sx={{ fontFamily: option, fontWeight: 500 }} color="action">Aa</ListItemIcon>
          <ListItemText sx={{ '& *': { fontFamily: option } }}>{text}</ListItemText>
        </MenuItem>)}
        {!FONT_FAMILY_OPTIONS.find(([option]) => option === fontFamily) && <MenuItem value={fontFamily}>
          <ListItemIcon sx={{ fontFamily: fontFamily, fontWeight: 500 }} color="action">Aa</ListItemIcon>
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
