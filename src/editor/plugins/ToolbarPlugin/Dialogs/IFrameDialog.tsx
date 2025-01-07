"use client"
import type { LexicalEditor } from 'lexical';
import React, { memo, useEffect, useState } from 'react';
import { SET_DIALOGS_COMMAND } from './commands';
import { useTheme } from '@mui/material/styles';
import { Box, Button, Dialog, DialogActions, DialogContent, DialogTitle, FormControlLabel, Switch, TextField, useMediaQuery } from '@mui/material';
import { INSERT_IFRAME_COMMAND } from '@/editor/plugins/IFramePlugin';
import { IFrameNode } from '@/editor/nodes/IFrameNode';

function IFrameDialog({ editor, node }: { editor: LexicalEditor, node: IFrameNode | null }) {
  const theme = useTheme();
  const fullScreen = useMediaQuery(theme.breakpoints.down('md'));
  const [formData, setFormData] = useState({ src: '', altText: 'iframe', width: 560, height: 315, showCaption: true, id: '', style: '' });
  useEffect(() => {
    if (node) {
      const serializedNode = node?.exportJSON();
      setFormData({
        src: serializedNode.src,
        altText: serializedNode.altText,
        width: serializedNode.width,
        height: serializedNode.height,
        showCaption: serializedNode.showCaption,
        id: serializedNode.id,
        style: serializedNode.style
      });
    } else {
      setFormData({ src: '', altText: 'iframe', width: 560, height: 315, showCaption: true, id: '', style: '' });
    }
  }, [node]);

  const updateFormData = (event: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = event.target;
    if (name === 'showCaption') {
      setFormData({ ...formData, [name]: event.target.checked });
    } else setFormData({ ...formData, [name]: value });
  }

  const handleSubmit = (event: React.FormEvent<HTMLFormElement> | React.MouseEvent<HTMLButtonElement>) => {
    event.preventDefault();
    if (!node) editor.dispatchCommand(INSERT_IFRAME_COMMAND, formData);
    else editor.update(() => node.update(formData));
    closeDialog();
    setTimeout(() => { editor.focus() }, 0);
  };

  const closeDialog = () => {
    editor.dispatchCommand(SET_DIALOGS_COMMAND, { iframe: { open: false } })
  }

  const handleClose = () => {
    closeDialog();
  }

  return <Dialog
    open
    fullScreen={fullScreen}
    onClose={handleClose}
    aria-labelledby="iFrame-dialog-title"
    disableEscapeKeyDown
  >
    <DialogTitle id="iFrame-dialog-title">
      Insert IFrame
    </DialogTitle>
    <DialogContent>
      <Box component="form" onSubmit={handleSubmit} noValidate sx={{ mt: 1 }}>
        <TextField margin='normal' size="small" fullWidth value={formData.src} onChange={updateFormData} label="Embed URL" name="src" autoComplete="src" autoFocus />
        <TextField margin="normal" size="small" fullWidth value={formData.altText} onChange={updateFormData} label="Alt Text" name="altText" autoComplete="altText" />
        <TextField margin="normal" size="small" fullWidth value={formData.width} onChange={updateFormData} label="Width" name="width" autoComplete="width" />
        <TextField margin="normal" size="small" fullWidth value={formData.height} onChange={updateFormData} label="Height" name="height" autoComplete="height" />
        <FormControlLabel control={<Switch checked={formData.showCaption} onChange={updateFormData} />} label="Show Caption" name="showCaption" />
        <Button hidden type="submit" />
      </Box>
    </DialogContent>
    <DialogActions>
      <Button onClick={handleClose}>
        Cancel
      </Button>
      <Button onClick={handleSubmit} disabled={!formData.src}>
        Confirm
      </Button>
    </DialogActions>
  </Dialog>;
}

export default memo(IFrameDialog);