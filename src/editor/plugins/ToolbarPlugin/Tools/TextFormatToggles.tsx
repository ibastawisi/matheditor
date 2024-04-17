"use client"
import * as React from 'react';
import { $getSelection, $isRangeSelection, FORMAT_TEXT_COMMAND, LexicalEditor, COMMAND_PRIORITY_CRITICAL, SELECTION_CHANGE_COMMAND, TextFormatType, } from "lexical";
import { $patchStyleText, } from '@lexical/selection';
import { mergeRegister, IS_APPLE } from '@lexical/utils';
import { $isLinkNode } from '@lexical/link';
import { useCallback, useEffect, useState } from 'react';
import ColorPicker from './ColorPicker';
import { $isMathNode, MathNode } from '../../../nodes/MathNode';
import { $patchStyle } from '../../../nodes/utils';

import { SxProps, Theme } from '@mui/material/styles';
import { ToggleButtonGroup, ToggleButton, SvgIcon } from '@mui/material';
import { FormatBold, FormatItalic, FormatUnderlined, Code, FormatStrikethrough, Subscript, Superscript, Link } from '@mui/icons-material';
import { getSelectedNode } from '@/editor/utils/getSelectedNode';
import { SET_DIALOGS_COMMAND } from '../Dialogs/commands';

const Highlight = () => <SvgIcon viewBox='0 -960 960 960' fontSize='small'>
  <path xmlns="http://www.w3.org/2000/svg" d="M80 0v-160h800V0H80Zm504-480L480-584 320-424l103 104 161-160Zm-47-160 103 103 160-159-104-104-159 160Zm-84-29 216 216-189 190q-24 24-56.5 24T367-263l-27 23H140l126-125q-24-24-25-57.5t23-57.5l189-189Zm0 0 187-187q24-24 56.5-24t56.5 24l104 103q24 24 24 56.5T857-640L669-453 453-669Z" />
</SvgIcon>;

export default function TextFormatToggles({ editor, sx }: { editor: LexicalEditor, sx?: SxProps<Theme> | undefined }): JSX.Element {
  const [isLink, setIsLink] = useState(false);
  const [isBold, setIsBold] = useState(false);
  const [isItalic, setIsItalic] = useState(false);
  const [isUnderline, setIsUnderline] = useState(false);
  const [isStrikethrough, setIsStrikethrough] = useState(false);
  const [isSubscript, setIsSubscript] = useState(false);
  const [isSuperscript, setIsSuperscript] = useState(false);
  const [isCode, setIsCode] = useState(false);
  const [isHighlight, setIsHighlight] = useState(false);

  const updateToolbar = useCallback(() => {
    const selection = $getSelection();
    if ($isRangeSelection(selection)) {
      setIsBold(selection.hasFormat('bold'));
      setIsItalic(selection.hasFormat('italic'));
      setIsUnderline(selection.hasFormat('underline'));
      setIsStrikethrough(selection.hasFormat('strikethrough'));
      setIsSubscript(selection.hasFormat('subscript'));
      setIsSuperscript(selection.hasFormat('superscript'));
      setIsCode(selection.hasFormat('code'));
      setIsHighlight(selection.hasFormat('highlight'));

      const node = getSelectedNode(selection);
      const parent = node.getParent();
      if ($isLinkNode(parent) || $isLinkNode(node)) {
        setIsLink(true);
      } else {
        setIsLink(false);
      }
    }

  }, [editor]);

  useEffect(() => {
    return editor.registerCommand(
      SELECTION_CHANGE_COMMAND,
      (_payload, newEditor) => {
        updateToolbar();
        return false;
      },
      COMMAND_PRIORITY_CRITICAL,
    );
  }, [editor, updateToolbar]);

  useEffect(() => {
    return mergeRegister(
      editor.registerUpdateListener(({ editorState }) => {
        editorState.read(() => {
          updateToolbar();
        });
      }),
    );
  }, [editor, updateToolbar]);

  const applyStyleText = useCallback(
    (styles: Record<string, string>) => {
      editor.update(() => {
        const selection = $getSelection();
        if ($isRangeSelection(selection)) {
          $patchStyleText(selection, styles);
          const mathNodes = selection.getNodes().filter(node => $isMathNode(node)) as MathNode[];
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

  const handleFormat = (event: React.MouseEvent<HTMLElement>, newFormats: string[]) => {
    const button = event.currentTarget as HTMLButtonElement;
    if (!button) return;
    editor.dispatchCommand(FORMAT_TEXT_COMMAND, button.value as TextFormatType);
  };

  const formatObj = { isBold, isItalic, isUnderline, isStrikethrough, isSubscript, isSuperscript, isCode, isHighlight, isLink };
  const formatKeys = Object.keys(formatObj) as Array<keyof typeof formatObj>;

  const formats = formatKeys.reduce(
    (accumelator, currentKey) => {
      if (formatObj[currentKey]) {
        accumelator.push(currentKey.toLowerCase().split('is')[1]);
      }
      return accumelator;
    }, [] as string[],
  );

  const openLinkDialog = () => editor.dispatchCommand(SET_DIALOGS_COMMAND, ({ link: { open: true } }));

  return (<ToggleButtonGroup size="small" sx={{ ...sx }} value={formats} onChange={handleFormat} aria-label="text formatting">
    <ToggleButton value="bold" title={IS_APPLE ? 'Bold (⌘B)' : 'Bold (Ctrl+B)'} aria-label={`Format text as bold. Shortcut: ${IS_APPLE ? '⌘B' : 'Ctrl+B'}`}>
      <FormatBold />
    </ToggleButton>
    <ToggleButton value="italic" title={IS_APPLE ? 'Italic (⌘I)' : 'Italic (Ctrl+I)'} aria-label={`Format text as italics. Shortcut: ${IS_APPLE ? '⌘I' : 'Ctrl+I'}`}>
      <FormatItalic />
    </ToggleButton>
    <ToggleButton value="underline" title={IS_APPLE ? 'Underline (⌘U)' : 'Underline (Ctrl+U)'} aria-label={`Format text to underlined. Shortcut: ${IS_APPLE ? '⌘U' : 'Ctrl+U'}`}>
      <FormatUnderlined />
    </ToggleButton>
    <ToggleButton value="highlight" title='Highlight selected text' aria-label='Highlight selected text'>
      <Highlight />
    </ToggleButton>
    <ToggleButton value="code" title='Format text to inline code' aria-label='Format text to inline code'>
      <Code />
    </ToggleButton>
    <ToggleButton value="strikethrough" title='Format text with strikethrough' aria-label='Format text with strikethrough'>
      <FormatStrikethrough />
    </ToggleButton>
    <ToggleButton value="subscript" title='Format text with subscript' aria-label='Format text with subscript'>
      <Subscript />
    </ToggleButton>
    <ToggleButton value="superscript" title='Format text with superscript' aria-label='Format text with superscript'>
      <Superscript />
    </ToggleButton>
    <ToggleButton value="link" title='Insert link' aria-label='Insert link' onClick={openLinkDialog}>
      <Link />
    </ToggleButton>
    <ColorPicker onColorChange={onColorChange} />
  </ToggleButtonGroup>)
}