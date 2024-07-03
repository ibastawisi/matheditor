"use client"
import * as React from 'react';
import { $getSelection, $setSelection, FORMAT_ELEMENT_COMMAND, INDENT_CONTENT_COMMAND, LexicalEditor, OUTDENT_CONTENT_COMMAND } from 'lexical';
import { IconButton, Menu, MenuItem, ListItemIcon, ListItemText, Divider } from '@mui/material';
import { FormatAlignLeft, FormatAlignCenter, FormatAlignRight, FormatAlignJustify, FormatIndentIncrease, FormatIndentDecrease } from '@mui/icons-material';
import { useCallback } from 'react';

export default function AlignTextMenu({ editor, isRTL }: { editor: LexicalEditor, isRTL: boolean }): JSX.Element {
  const [anchorEl, setAnchorEl] = React.useState<null | HTMLElement>(null);
  const open = Boolean(anchorEl);
  const handleClick = (event: React.MouseEvent<HTMLElement>) => {
    setAnchorEl(event.currentTarget);
  };
  const handleClose = useCallback(() => {
    setAnchorEl(null);
    const selection = editor.getEditorState().read($getSelection);
    if (selection) editor.update(
      () => {
        $setSelection(selection.clone());
      },
      {
        discrete: true,
        onUpdate() {
          setTimeout(() => editor.focus(), 0);
        }
      }
    );
  }, [editor]);

  return (
    <>
      <IconButton
        id="align-button"
        aria-controls={open ? 'align-menu' : undefined}
        aria-haspopup="true"
        aria-expanded={open ? 'true' : undefined}
        aria-label='Align Text'
        onClick={handleClick}>
        <FormatAlignLeft />
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
      >
        <MenuItem onClick={() => {
          editor.dispatchCommand(FORMAT_ELEMENT_COMMAND, 'left');
          handleClose();
        }}>
          <ListItemIcon>
            <FormatAlignLeft fontSize="small" />
          </ListItemIcon>
          <ListItemText>Left Align</ListItemText>
        </MenuItem>
        <MenuItem onClick={() => {
          editor.dispatchCommand(FORMAT_ELEMENT_COMMAND, 'center');
          handleClose();
        }}>
          <ListItemIcon>
            <FormatAlignCenter fontSize="small" />
          </ListItemIcon>
          <ListItemText>Center Align</ListItemText>
        </MenuItem>
        <MenuItem onClick={() => {
          editor.dispatchCommand(FORMAT_ELEMENT_COMMAND, 'right');
          handleClose();
        }}>
          <ListItemIcon>
            <FormatAlignRight fontSize="small" />
          </ListItemIcon>
          <ListItemText>Right Align</ListItemText>
        </MenuItem>
        <MenuItem onClick={() => {
          editor.dispatchCommand(FORMAT_ELEMENT_COMMAND, 'justify');
          handleClose();
        }}>
          <ListItemIcon>
            <FormatAlignJustify fontSize="small" />
          </ListItemIcon>
          <ListItemText>Justify Align</ListItemText>
        </MenuItem>

        <Divider />

        <MenuItem onClick={() => {
          editor.dispatchCommand(OUTDENT_CONTENT_COMMAND, undefined);
          handleClose();
        }}>
          <ListItemIcon>
            {isRTL ? <FormatIndentIncrease fontSize="small" /> : <FormatIndentDecrease fontSize="small" />}
          </ListItemIcon>
          <ListItemText>Outdent</ListItemText>
        </MenuItem>
        <MenuItem onClick={() => {
          editor.dispatchCommand(INDENT_CONTENT_COMMAND, undefined);
          handleClose();
        }}>
          <ListItemIcon>
            {isRTL ? <FormatIndentDecrease fontSize="small" /> : <FormatIndentIncrease fontSize="small" />}
          </ListItemIcon>
          <ListItemText>Indent</ListItemText>
        </MenuItem>
      </Menu>
    </>
  );
}
