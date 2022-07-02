import * as React from 'react';
import ToggleButton from "@mui/material/ToggleButton";
import ToggleButtonGroup from "@mui/material/ToggleButtonGroup";
import { $getSelection, $isRangeSelection, FORMAT_TEXT_COMMAND, LexicalEditor, COMMAND_PRIORITY_CRITICAL, SELECTION_CHANGE_COMMAND, } from "lexical";
import FormatBoldIcon from '@mui/icons-material/FormatBold';
import FormatItalicIcon from '@mui/icons-material/FormatItalic';
import FormatUnderlinedIcon from '@mui/icons-material/FormatUnderlined';
import FormatColorTextIcon from '@mui/icons-material/FormatColorText';
import FormatColorFillIcon from '@mui/icons-material/FormatColorFill';
import CodeIcon from '@mui/icons-material/Code';
import FormatStrikethroughIcon from '@mui/icons-material/FormatStrikethrough';
import SubscriptIcon from '@mui/icons-material/Subscript';
import SuperscriptIcon from '@mui/icons-material/Superscript';
import { $getSelectionStyleValueForProperty, $patchStyleText, } from '@lexical/selection';
import { mergeRegister, } from '@lexical/utils';

import { IS_APPLE } from '../../../shared/environment';
import { useCallback, useEffect, useState } from 'react';
import { SxProps, Theme } from '@mui/material/styles';

export default function TextFormatToggles({ editor, sx }: { editor: LexicalEditor, sx?: SxProps<Theme> | undefined }): JSX.Element {
  const [isBold, setIsBold] = useState(false);
  const [isItalic, setIsItalic] = useState(false);
  const [isUnderline, setIsUnderline] = useState(false);
  const [isStrikethrough, setIsStrikethrough] = useState(false);
  const [isSubscript, setIsSubscript] = useState(false);
  const [isSuperscript, setIsSuperscript] = useState(false);
  const [isCode, setIsCode] = useState(false);

  const updateToolbar = useCallback(() => {
    const selection = $getSelection();
    if ($isRangeSelection(selection)) {

      // Update text format
      setIsBold(selection.hasFormat('bold'));
      setIsItalic(selection.hasFormat('italic'));
      setIsUnderline(selection.hasFormat('underline'));
      setIsStrikethrough(selection.hasFormat('strikethrough'));
      setIsSubscript(selection.hasFormat('subscript'));
      setIsSuperscript(selection.hasFormat('superscript'));
      setIsCode(selection.hasFormat('code'));

      // Handle buttons
      setFontColor($getSelectionStyleValueForProperty(selection, 'color', '#000000'));
      setBgColor($getSelectionStyleValueForProperty(selection, 'background-color', '#ffffff'));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
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
        }
      });
    },
    [editor],
  );


  const [fontColor, setFontColor] = useState<string>('#000000');
  const [bgColor, setBgColor] = useState<string>('#ffffff');

  const fontColorRef = React.useRef<HTMLInputElement>(null);
  const bgColorRef = React.useRef<HTMLInputElement>(null);


  const onColorChange = useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = event.target;
    if (name === 'color') {
      setFontColor(value);
    }
    if (name === 'background-Color') {
      setBgColor(value);
    }
    applyStyleText({ [name]: value });
  }, [applyStyleText]);

  const handleFormat = (
    event: React.MouseEvent<HTMLElement>,
    newFormats: string[],
  ) => {
    const button = event.currentTarget as HTMLButtonElement;
    switch (button.value) {
      case 'color': {
        if (fontColorRef.current) {
          fontColorRef.current.click();
        }
        break;
      }
      case 'background-color': {
        if (bgColorRef.current) {
          bgColorRef.current.click();
        }
        break;
      }
      default:
        editor.dispatchCommand(FORMAT_TEXT_COMMAND, button.value);
    };
  };

  const formatObj = { isBold, isItalic, isUnderline, isStrikethrough, isSubscript, isSuperscript, isCode };
  const formatKeys = Object.keys(formatObj) as Array<keyof typeof formatObj>;

  const formats = formatKeys.reduce(
    (accumelator, currentKey) => {
      if (formatObj[currentKey]) {
        accumelator.push(currentKey.toLowerCase().split('is')[1]);
      }
      return accumelator;
    }, [] as string[],
  );

  return (<ToggleButtonGroup size="small" sx={{ ...sx }} value={formats} onChange={handleFormat} aria-label="text formatting">
    <ToggleButton value="bold" title={IS_APPLE ? 'Bold (⌘B)' : 'Bold (Ctrl+B)'} aria-label={`Format text as bold. Shortcut: ${IS_APPLE ? '⌘B' : 'Ctrl+B'}`}>
      <FormatBoldIcon />
    </ToggleButton>
    <ToggleButton value="italic" title={IS_APPLE ? 'Italic (⌘I)' : 'Italic (Ctrl+I)'} aria-label={`Format text as italics. Shortcut: ${IS_APPLE ? '⌘I' : 'Ctrl+I'}`}>
      <FormatItalicIcon />
    </ToggleButton>
    <ToggleButton value="underline" title={IS_APPLE ? 'Underline (⌘U)' : 'Underline (Ctrl+U)'} aria-label={`Format text to underlined. Shortcut: ${IS_APPLE ? '⌘U' : 'Ctrl+U'}`}>
      <FormatUnderlinedIcon />
    </ToggleButton>
    <ToggleButton value="code" title='Format text to inline code' aria-label='Format text to inline code'>
      <CodeIcon />
    </ToggleButton>
    <ToggleButton value="strikethrough" title='Format text with strikethrough' aria-label='Format text with strikethrough'>
      <FormatStrikethroughIcon />
    </ToggleButton>
    <ToggleButton value="subscript" title='Format text with subscript' aria-label='Format text with subscript'>
      <SubscriptIcon />
    </ToggleButton>
    <ToggleButton value="superscript" title='Format text with superscript' aria-label='Format text with superscript'>
      <SuperscriptIcon />
    </ToggleButton>
    <ToggleButton value="color" title="text color" aria-label="text color">
      <input type="color" style={{ position: 'absolute', width: 0, height: 0, opacity: 0 }} name='color' ref={fontColorRef} value={fontColor} onChange={onColorChange} />
      <FormatColorTextIcon />
    </ToggleButton>
    <ToggleButton value="background-color" title="background color" aria-label="background color">
      <input type="color" style={{ position: 'absolute', width: 0, height: 0, opacity: 0 }} ref={bgColorRef} name='background-color' value={bgColor} onChange={onColorChange} />
      <FormatColorFillIcon />
    </ToggleButton>

  </ToggleButtonGroup>)
}