"use client"
import * as React from 'react';
import { FORMAT_ELEMENT_COMMAND, INDENT_CONTENT_COMMAND, OUTDENT_CONTENT_COMMAND } from 'lexical';
import { useLexicalComposerContext } from '@lexical/react/LexicalComposerContext';
import { IconButton, Menu, MenuItem, ListItemIcon, ListItemText, Divider } from '@mui/material';
import { FormatAlignLeft, FormatAlignCenter, FormatAlignRight, FormatAlignJustify, FormatIndentIncrease, FormatIndentDecrease } from '@mui/icons-material';
import { useCallback } from 'react';
import { useStore } from '@/editor/extensions/store/hooks';
import { restoreFocus } from '@/editor/utils/restoreFocus';

export default function AlignTextMenu() {
  const [editor] = useLexicalComposerContext();
  const [formatType] = useStore("elementFormat");
  const [indentationLevel] = useStore("indentationLevel");
  const [isRTL] = useStore("isRTL");
  const [anchorEl, setAnchorEl] = React.useState<null | HTMLElement>(null);
  const open = Boolean(anchorEl);
  const handleClick = (event: React.MouseEvent<HTMLElement>) => {
    setAnchorEl(event.currentTarget);
  };
  const handleClose = useCallback(() => {
    setAnchorEl(null);
    setTimeout(() => restoreFocus(editor), 0);
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
        {(formatType === 'left' || formatType === 'start' || formatType === '') && <FormatAlignLeft fontSize='small' />}
        {formatType === 'center' && <FormatAlignCenter fontSize='small' />}
        {(formatType === 'right' || formatType === 'end') && <FormatAlignRight fontSize='small' />}
        {formatType === 'justify' && <FormatAlignJustify fontSize='small' />}
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
          '& .MuiBackdrop-root': { userSelect: 'none' },
          '& .MuiMenuItem-root': { minHeight: 36 },
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
