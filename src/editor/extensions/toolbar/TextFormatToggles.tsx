"use client"
import * as React from 'react';
import { $getSelection, $isRangeSelection, FORMAT_TEXT_COMMAND, TextFormatType } from "lexical";
import { $patchStyleText } from '@lexical/selection';
import { useLexicalComposerContext } from '@lexical/react/LexicalComposerContext';
import { IS_APPLE } from '@lexical/utils';
import { useCallback } from 'react';
import ColorPicker from '@/editor/extensions/shared/components/ColorPicker';
import { $isMathNode } from '@/editor/extensions/math/nodes';
import { $patchStyle } from '@/editor/extensions/shared/utils';
import { HighlightIcon as Highlight } from '@/editor/extensions/shared/icons';
import { SxProps, Theme } from '@mui/material/styles';
import { ToggleButtonGroup, ToggleButton } from '@mui/material';
import { FormatBold, FormatItalic, FormatUnderlined, Code, FormatStrikethrough, Subscript, Superscript, Link } from '@mui/icons-material';
import { useStore } from '@/editor/extensions/store/hooks';
import { setOpenDialog } from '@/editor/extensions/store';
import { restoreFocus as restoreEditorFocus } from '@/editor/utils/restoreFocus';

export default function TextFormatToggles({ sx }: { sx?: SxProps<Theme> | undefined }) {
  const [editor] = useLexicalComposerContext();
  const [isBold] = useStore("isBold");
  const [isItalic] = useStore("isItalic");
  const [isUnderline] = useStore("isUnderline");
  const [isStrikethrough] = useStore("isStrikethrough");
  const [isSubscript] = useStore("isSubscript");
  const [isSuperscript] = useStore("isSuperscript");
  const [isCode] = useStore("isCode");
  const [isHighlight] = useStore("isHighlight");
  const [isLink] = useStore("isLink");
  const [textColor] = useStore("fontColor");
  const [backgroundColor] = useStore("bgColor");

  const format: { [key: string]: boolean } = {
    bold: isBold,
    italic: isItalic,
    underline: isUnderline,
    strikethrough: isStrikethrough,
    subscript: isSubscript,
    superscript: isSuperscript,
    code: isCode,
    highlight: isHighlight,
    link: isLink,
  };

  const applyStyleText = useCallback(
    (styles: Record<string, string>) => {
      editor.update(() => {
        const selection = $getSelection();
        if ($isRangeSelection(selection)) {
          $patchStyleText(selection, styles);
          const mathNodes = selection.getNodes().filter($isMathNode);
          $patchStyle(mathNodes, styles);
        }
      });
    },
    [editor],
  );

  const onColorChange = useCallback((key: string, value: string) => {
    const styleKey = key === 'text' ? 'color' : 'background-color';
    applyStyleText({ [styleKey]: value });
  }, [applyStyleText]);

  const handleFormat = (event: React.MouseEvent<HTMLElement>) => {
    const button = event.currentTarget as HTMLButtonElement;
    if (!button) return;
    editor.dispatchCommand(FORMAT_TEXT_COMMAND, button.value as TextFormatType);
  };

  const formatKeys = Object.keys(format).filter(key => Boolean(format[key]));

  const restoreFocus = useCallback(() => {
    setTimeout(() => restoreEditorFocus(editor), 0);
  }, [editor]);


  const openLinkDialog = () => setOpenDialog(editor, 'link');

  return (
    <ToggleButtonGroup size="small" sx={{ ...sx }} value={formatKeys} onChange={handleFormat} aria-label="text formatting" id="text-format-toggles">
      <ToggleButton value="bold" title={IS_APPLE ? 'Bold (⌘B)' : 'Bold (Ctrl+B)'} aria-label={`Format text as bold. Shortcut: ${IS_APPLE ? '⌘B' : 'Ctrl+B'}`}>
        <FormatBold fontSize='small' />
      </ToggleButton>
      <ToggleButton value="italic" title={IS_APPLE ? 'Italic (⌘I)' : 'Italic (Ctrl+I)'} aria-label={`Format text as italics. Shortcut: ${IS_APPLE ? '⌘I' : 'Ctrl+I'}`}>
        <FormatItalic fontSize='small' />
      </ToggleButton>
      <ToggleButton value="underline" title={IS_APPLE ? 'Underline (⌘U)' : 'Underline (Ctrl+U)'} aria-label={`Format text to underlined. Shortcut: ${IS_APPLE ? '⌘U' : 'Ctrl+U'}`}>
        <FormatUnderlined fontSize='small' />
      </ToggleButton>
      <ToggleButton value="highlight" title={IS_APPLE ? 'Highlight (⌘+⇧+H)' : 'Highlight (Ctrl+Shift+H)'} aria-label={`Format text as highlight. Shortcut: ${IS_APPLE ? '⌘+⇧+H' : 'Ctrl+Shift+H'}`}>
        <Highlight />
      </ToggleButton>
      <ToggleButton value="code" title={IS_APPLE ? 'Inline code (⌘E)' : 'Inline code (Ctrl+E)'} aria-label={`Format text as Inline code. Shortcut: ${IS_APPLE ? '⌘E' : 'Ctrl+E'}`}>
        <Code fontSize='small' />
      </ToggleButton>
      <ToggleButton value="strikethrough" title={IS_APPLE ? 'Strikethrough (⌘+⇧+S)' : 'Strikethrough (Ctrl+Shift+S)'} aria-label={`Format text as strikethrough. Shortcut: ${IS_APPLE ? '⌘+⇧+S' : 'Ctrl+Shift+S'}`}>
        <FormatStrikethrough fontSize='small' />
      </ToggleButton>
      <ToggleButton value="subscript" title='Subscript' aria-label='Format text with subscript'>
        <Subscript fontSize='small' />
      </ToggleButton>
      <ToggleButton value="superscript" title='Superscript' aria-label='Format text with superscript'>
        <Superscript fontSize='small' />
      </ToggleButton>
      <ToggleButton value="link" title={IS_APPLE ? 'Insert Link (⌘K)' : 'Insert Link (Ctrl+K)'} aria-label={`Insert a link. Shortcut: ${IS_APPLE ? '⌘K' : 'Ctrl+K'}`} onClick={openLinkDialog}>
        <Link sx={{ fontSize: 'small' }} />
      </ToggleButton>
      <ColorPicker onColorChange={onColorChange} textColor={textColor} backgroundColor={backgroundColor} onClose={restoreFocus} />
    </ToggleButtonGroup>
  );
}