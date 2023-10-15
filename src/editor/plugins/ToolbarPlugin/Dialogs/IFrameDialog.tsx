"use client"
import { $getSelection, $setSelection, LexicalEditor } from 'lexical';
import React, { memo, useEffect, useState } from 'react';
import { SET_DIALOGS_COMMAND } from '..';
import useFixedBodyScroll from '@/hooks/useFixedBodyScroll';
import { useTheme } from '@mui/material/styles';
import { Box, Button, Dialog, DialogActions, DialogContent, DialogTitle, FormControl, FormControlLabel, IconButton, Switch, TextField, useMediaQuery } from '@mui/material';
import { Remove, Add } from '@mui/icons-material';
import { INSERT_IFRAME_COMMAND } from '../../IFramePlugin';
import { IFrameNode } from '@/editor/nodes/IFrameNode';

function IFrameDialog({ editor, node, open }: { editor: LexicalEditor, node: IFrameNode | null; open: boolean }) {
  const theme = useTheme();
  const fullScreen = useMediaQuery(theme.breakpoints.down('md'));
  const [formData, setFormData] = useState({ url: '', width: '560', height: '315' });
  useEffect(() => {
    if (node) {
      setFormData({ url: node.getUrl(), width: node.getWidth(), height: node.getHeight() });
    } else {
      setFormData({ url: '', width: '560', height: '315' });
    }
  }, [node]);

  const updateFormData = (event: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = event.target;
    setFormData({ ...formData, [name]: value });
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
    setFormData({ url: '', width: '560', height: '315' });
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

  useFixedBodyScroll(open);

  return <Dialog
    open={open}
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
        <FormControl sx={{ display: 'flex', flexDirection: 'row', justifyContent: 'center', my: 2 }}>
          <TextField type="string" size="small" sx={{ mx: 1 }} value={formData.url} onChange={updateFormData} label="URL" name="url" autoComplete="url" autoFocus />
        </FormControl>
        <FormControl sx={{ display: 'flex', flexDirection: 'row', justifyContent: 'center', my: 2 }}>
          <TextField type="string" size="small" sx={{ mx: 1 }} value={formData.width} onChange={updateFormData} label="Width" name="width" autoComplete="width" autoFocus />
        </FormControl>
        <FormControl sx={{ display: 'flex', flexDirection: 'row', justifyContent: 'center', my: 2 }}>
          <TextField type="string" size="small" sx={{ mx: 1 }} value={formData.height} onChange={updateFormData} label="Height" name="height" autoComplete="height" autoFocus />
        </FormControl>
      </Box>
    </DialogContent>
    <DialogActions>
      <Button autoFocus onClick={handleClose}>
        Cancel
      </Button>
      <Button onClick={handleSubmit} disabled={!formData.url}>
        Confirm
      </Button>
    </DialogActions>
  </Dialog>;
}

export default memo(IFrameDialog);