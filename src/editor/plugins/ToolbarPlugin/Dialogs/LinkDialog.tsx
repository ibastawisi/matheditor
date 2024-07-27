"use client"
import { $getSelection, $isRangeSelection, $setSelection, LexicalEditor } from 'lexical';
import React, { memo, useCallback, useEffect, useState } from 'react';
import { SET_DIALOGS_COMMAND } from './commands';
import useFixedBodyScroll from '@/hooks/useFixedBodyScroll';
import { useTheme } from '@mui/material/styles';
import { Autocomplete, Box, Button, Dialog, DialogActions, DialogContent, DialogTitle, FormControlLabel, Radio, RadioGroup, TextField, useMediaQuery } from '@mui/material';
import { sanitizeUrl } from '@/editor/utils/url';
import { TOGGLE_LINK_COMMAND, type LinkNode, type LinkAttributes } from '@lexical/link';
import { LinkOff } from '@mui/icons-material';

function LinkDialog({ editor, node, open }: { editor: LexicalEditor, node: LinkNode | null; open: boolean }) {
  const theme = useTheme();
  const fullScreen = useMediaQuery(theme.breakpoints.down('md'));
  const [formData, setFormData] = useState({ url: 'https://', rel: 'external', target:'_blank' });
  
  useEffect(() => {
    if (!open) return;
    const payload = {
      url: node?.__url ?? 'https://',
      rel: node?.__rel ?? 'external',
      target: node?.__target ?? '_blank',
    }
    setFormData(payload);
  }, [node, open]);

  const updateFormData = (event: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = event.target;
    setFormData({ ...formData, [name]: value });
    if (name === 'rel') {
      const nodeRel = node?.__rel ?? 'external';
      const defaultUrl = value === 'bookmark' ? getBookmarkUrl() : value === 'tag' ? '' : 'https://';
      const url = value === nodeRel ? node?.__url ?? defaultUrl : defaultUrl;
      const target = value === 'external' ? '_blank' : '_self';
      setFormData({ ...formData, [name]: value, url, target });
    }
  }

  const handleSubmit = (event: React.FormEvent<HTMLFormElement> | React.MouseEvent<HTMLButtonElement>) => {
    event.preventDefault();
    if (!node) editor.dispatchCommand(TOGGLE_LINK_COMMAND, {
      url: sanitizeUrl(formData.url),
      rel: formData.rel,
      target: formData.target,
    });
    else editor.update(() => {
      node.setURL(sanitizeUrl(formData.url))
      node.setRel(formData.rel);
      node.setTarget(formData.target);
    });
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

  const rootElement = editor.getRootElement();
  const figures = rootElement ? [...rootElement.querySelectorAll('.LexicalTheme__image, .LexicalTheme__math')].map(el => el.id).filter(Boolean) : [];

  const getBookmarkUrl = useCallback(() => {
    return editor.getEditorState().read(() => {
      if (node && node.getRel() === 'bookmark') return node.getURL();
      const selection = $getSelection();
      if (!$isRangeSelection(selection)) return '#';
      const textContent = selection.isCollapsed() ? selection.focus.getNode().getTextContent() : selection.getTextContent();
      return `#${textContent.trim().replace(/\s+/g, '-').toLowerCase()}`;
    });
  }, [editor, node]);

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
        <RadioGroup row aria-label="orientation" name="rel" value={formData.rel} onChange={updateFormData}>
          <FormControlLabel value="external" control={<Radio />} label="External" />
          <FormControlLabel value="bookmark" control={<Radio />} label="Self" />
          <FormControlLabel value="tag" control={<Radio />} label="Figure" />
        </RadioGroup>
        {formData.rel === "tag" ?
          <Autocomplete size='small'
            value={formData.rel === 'tag' ? formData.url.slice(1) : ''}
            options={figures}
            renderInput={(params) => <TextField {...params} label="Figure" margin='normal' autoFocus />}
            onChange={(event, value) => {
              setFormData({ ...formData, url: value ? `#${value}` : '' });
            }}
          />
          :
          <TextField margin='normal' size="small" fullWidth value={formData.url} onChange={updateFormData} label="URL" name="url" autoFocus />}
        <Button hidden type="submit" />
      </Box>
    </DialogContent>
    <DialogActions>
      {node && <Button onClick={handleDelete} startIcon={<LinkOff />} color="error" sx={{ mr: 'auto' }}>Unlink</Button>}
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