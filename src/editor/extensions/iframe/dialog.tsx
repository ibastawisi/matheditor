"use client"
import { $getNodeByKey, NodeKey } from 'lexical';
import { useLexicalComposerContext } from '@lexical/react/LexicalComposerContext';
import React, { memo, useEffect, useState } from 'react';
import { setOpenDialog } from '@/editor/extensions/store';
import { useTheme } from '@mui/material/styles';
import { Box, Button, Dialog, DialogActions, DialogContent, DialogTitle, FormControlLabel, Switch, TextField, useMediaQuery } from '@mui/material';
import { INSERT_IFRAME_COMMAND } from './commands';
import { $isIFrameNode } from './nodes';

const DEFAULT_PAYLOAD = { src: '', altText: 'iframe', width: 560, height: 315, showCaption: true };

function IFrameDialog({ nodeKey }: { nodeKey: NodeKey | null }) {
  const [editor] = useLexicalComposerContext();
  const theme = useTheme();
  const fullScreen = useMediaQuery(theme.breakpoints.down('md'));
  const [formData, setFormData] = useState(DEFAULT_PAYLOAD);
  useEffect(() => {
    const payload = editor.read(() => {
      const node = nodeKey ? $getNodeByKey(nodeKey) : null;
      if (!$isIFrameNode(node)) return DEFAULT_PAYLOAD;
      return {
        src: node.getSrc(),
        altText: node.getAltText(),
        width: node.getWidth(),
        height: node.getHeight(),
        showCaption: node.getShowCaption(),
      };
    });
    setFormData(payload);
  }, [editor, nodeKey]);

  const updateFormData = (event: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = event.target;
    if (name === 'showCaption') {
      setFormData({ ...formData, [name]: event.target.checked });
    } else setFormData({ ...formData, [name]: value });
  }

  const handleSubmit = (event: React.FormEvent<HTMLFormElement> | React.MouseEvent<HTMLButtonElement>) => {
    event.preventDefault();
    const payload = { ...formData, width: Number(formData.width) || 0, height: Number(formData.height) || 0 };
    const node = editor.read(() => nodeKey ? $getNodeByKey(nodeKey) : null);
    if (!$isIFrameNode(node)) editor.dispatchCommand(INSERT_IFRAME_COMMAND, payload);
    else editor.update(() => node.update(payload));
    closeDialog();
    setTimeout(() => { editor.focus() }, 0);
  };

  const closeDialog = () => {
    setOpenDialog(editor, null);
  }

  const handleClose = () => {
    closeDialog();
  }

  return <Dialog
    open
    fullScreen={fullScreen}
    onClose={(_, reason) => { if (reason !== 'escapeKeyDown') handleClose(); }}
    aria-labelledby="iFrame-dialog-title"
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