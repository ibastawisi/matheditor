"use client"
import * as React from 'react';
import { $getSelection, $isElementNode, $isParagraphNode, $isRangeSelection, $isTextNode, $setSelection, COMMAND_PRIORITY_CRITICAL, ElementFormatType, FORMAT_ELEMENT_COMMAND, INDENT_CONTENT_COMMAND, LexicalEditor, OUTDENT_CONTENT_COMMAND, SELECTION_CHANGE_COMMAND } from 'lexical';
import { IconButton, Menu, MenuItem, ListItemIcon, ListItemText, Divider } from '@mui/material';
import { FormatAlignLeft, FormatAlignCenter, FormatAlignRight, FormatAlignJustify, FormatIndentIncrease, FormatIndentDecrease } from '@mui/icons-material';
import { useCallback, useEffect, useState } from 'react';
import { getSelectedNode } from '@/editor/utils/getSelectedNode';
import { mergeRegister, $findMatchingParent } from '@lexical/utils';

export default function AlignTextMenu({ editor, isRTL }: { editor: LexicalEditor, isRTL: boolean }) {
  const [anchorEl, setAnchorEl] = React.useState<null | HTMLElement>(null);
  const open = Boolean(anchorEl);
  const handleClick = (event: React.MouseEvent<HTMLElement>) => {
    setAnchorEl(event.currentTarget);
  };
  const handleClose = useCallback(() => {
    setAnchorEl(null);
    setTimeout(() => {
      editor.update(
        () => {
          const selection = $getSelection();
          if (!selection) return;
          $setSelection(selection.clone());
        },
        {
          discrete: true,
          onUpdate() { editor.focus() }
        }
      );
    }, 0);
  }, [editor]);

  const [formatType, setFormatType] = useState<ElementFormatType>('left');
  const [indentationLevel, setIndentationLevel] = useState<number>(0);

  const $updateToolbar = useCallback(() => {
    const selection = $getSelection();
    if (!selection) return;
    const element = $findMatchingParent($isRangeSelection(selection) ? getSelectedNode(selection) : selection.getNodes()[0], $isElementNode);
    if (!element) return;
    setFormatType(element.getFormatType() || 'left');
    setIndentationLevel(element.getIndent() || 0);
  }, [editor]);

  useEffect(() => {
    return mergeRegister(
      editor.registerCommand(
        SELECTION_CHANGE_COMMAND,
        () => {
          $updateToolbar();
          return false;
        },
        COMMAND_PRIORITY_CRITICAL,
      ),
      editor.registerUpdateListener(({ editorState, tags }) => {
        editorState.read(() => {
          $updateToolbar();
        });
      }),
    );
  }, [editor, $updateToolbar]);


  return (
    <>
      <IconButton
        id="align-button"
        aria-controls={open ? 'align-menu' : undefined}
        aria-haspopup="true"
        aria-expanded={open ? 'true' : undefined}
        aria-label='Align Text'
        onClick={handleClick}>
        {formatType === 'left' && <FormatAlignLeft />}
        {formatType === 'center' && <FormatAlignCenter />}
        {formatType === 'right' && <FormatAlignRight />}
        {formatType === 'justify' && <FormatAlignJustify />}
      </IconButton>
      <Menu
        id="align-menu"
        aria-labelledby="align-button"
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
          '& .MuiBackdrop-root': { userSelect: 'none' }
        }}
      >
        <MenuItem selected={formatType === 'left'} onClick={() => {
          editor.dispatchCommand(FORMAT_ELEMENT_COMMAND, 'left');
        }}>
          <ListItemIcon>
            <FormatAlignLeft fontSize="small" />
          </ListItemIcon>
          <ListItemText>Left Align</ListItemText>
        </MenuItem>
        <MenuItem selected={formatType === 'center'} onClick={() => {
          editor.dispatchCommand(FORMAT_ELEMENT_COMMAND, 'center');
        }}>
          <ListItemIcon>
            <FormatAlignCenter fontSize="small" />
          </ListItemIcon>
          <ListItemText>Center Align</ListItemText>
        </MenuItem>
        <MenuItem selected={formatType === 'right'} onClick={() => {
          editor.dispatchCommand(FORMAT_ELEMENT_COMMAND, 'right');
        }}>
          <ListItemIcon>
            <FormatAlignRight fontSize="small" />
          </ListItemIcon>
          <ListItemText>Right Align</ListItemText>
        </MenuItem>
        <MenuItem selected={formatType === 'justify'} onClick={() => {
          editor.dispatchCommand(FORMAT_ELEMENT_COMMAND, 'justify');
        }}>
          <ListItemIcon>
            <FormatAlignJustify fontSize="small" />
          </ListItemIcon>
          <ListItemText>Justify Align</ListItemText>
        </MenuItem>

        <Divider />

        <MenuItem onClick={() => {
          editor.dispatchCommand(INDENT_CONTENT_COMMAND, undefined);
        }}>
          <ListItemIcon>
            {isRTL ? <FormatIndentDecrease fontSize="small" /> : <FormatIndentIncrease fontSize="small" />}
          </ListItemIcon>
          <ListItemText>Indent</ListItemText>
        </MenuItem>
        <MenuItem disabled={indentationLevel === 0} onClick={() => {
          editor.dispatchCommand(OUTDENT_CONTENT_COMMAND, undefined);
        }}>
          <ListItemIcon>
            {isRTL ? <FormatIndentIncrease fontSize="small" /> : <FormatIndentDecrease fontSize="small" />}
          </ListItemIcon>
          <ListItemText>Outdent</ListItemText>
        </MenuItem>
      </Menu>
    </>
  );
}
