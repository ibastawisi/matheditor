"use client"
import { $getSelection, $setSelection, LexicalEditor } from 'lexical';
import React, { memo, useEffect, useState } from 'react';
import { SET_DIALOGS_COMMAND } from './commands';
import useFixedBodyScroll from '@/hooks/useFixedBodyScroll';
import { useTheme } from '@mui/material/styles';
import { Box, Button, Dialog, DialogActions, DialogContent, DialogTitle, TextField, useMediaQuery } from '@mui/material';
import { sanitizeUrl } from '@/editor/utils/url';
import { TOGGLE_LINK_COMMAND, type LinkNode } from '@lexical/link';
import { LinkOff } from '@mui/icons-material';

function LinkDialog({ editor, node, open }: { editor: LexicalEditor, node: LinkNode | null; open: boolean }) {
  const theme = useTheme();
  const fullScreen = useMediaQuery(theme.breakpoints.down('md'));
  const [formData, setFormData] = useState({ url: 'https://' });
  useEffect(() => {
    if (!open) return;
    if (node) {
      setFormData({ url: node.__url });
    } else {
      setFormData({ url: 'https://' });
    }
  }, [node, open]);

  const updateFormData = (event: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = event.target;
    setFormData({ ...formData, [name]: value });
  }

  const handleSubmit = (event: React.FormEvent<HTMLFormElement> | React.MouseEvent<HTMLButtonElement>) => {
    event.preventDefault();
    if (!node) editor.dispatchCommand(TOGGLE_LINK_COMMAND, sanitizeUrl(formData.url));
    else editor.update(() => node.setURL(sanitizeUrl(formData.url)));
    closeDialog();
    setTimeout(() => { editor.focus() }, 0);
  };

  const closeDialog = () => {
    editor.dispatchCommand(SET_DIALOGS_COMMAND, { link: { open: false } })
  }

  const restoreSelection = () => {
    editor.getEditorState().read(() => {
      const selection = $getSelection()?.clone() ?? null;
      editor.update(() => $setSelection(selection));
    })
  }

  const handleClose = () => {
    closeDialog();
    restoreSelection();
  }

  const handleDelete = () => {
    editor.dispatchCommand(TOGGLE_LINK_COMMAND, null);
    closeDialog();
  }
  useFixedBodyScroll(open);

  return <Dialog
    open={open}
    fullScreen={fullScreen}
    onClose={handleClose}
    aria-labelledby="link-dialog-title"
    disableEscapeKeyDown
  >
    <DialogTitle id="link-dialog-title">
      Insert Link
    </DialogTitle>
    <DialogContent>
      <Box component="form" onSubmit={handleSubmit} noValidate sx={{ mt: 1 }}>
        <TextField margin='normal' size="small" fullWidth value={formData.url} onChange={updateFormData} label="URL" name="url" autoComplete="url" autoFocus />
        <Button onClick={handleDelete} startIcon={<LinkOff />} variant="outlined" color="error" disabled={!node}>Unlink</Button>
      </Box>
    </DialogContent>
    <DialogActions>
      <Button onClick={handleClose}>
        Cancel
      </Button>
      <Button onClick={handleSubmit} disabled={!formData.url}>
        Confirm
      </Button>
    </DialogActions>
  </Dialog>;
}

export default memo(LinkDialog);