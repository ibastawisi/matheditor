"use client"
import { $getSelection, $isRangeSelection, isHTMLElement, LexicalEditor } from 'lexical';
import React, { memo, useCallback, useEffect, useState } from 'react';
import { SET_DIALOGS_COMMAND } from './commands';
import { useTheme } from '@mui/material/styles';
import { Box, Button, Dialog, DialogActions, DialogContent, DialogTitle, FormControl, FormControlLabel, InputAdornment, InputLabel, ListItemIcon, MenuItem, Radio, RadioGroup, Select, TextField, useMediaQuery } from '@mui/material';
import { sanitizeUrl } from '@/editor/utils/url';
import { TOGGLE_LINK_COMMAND, type LinkNode } from '@lexical/link';
import { LinkOff } from '@mui/icons-material';
import { $isImageNode } from '@/editor/nodes/ImageNode';
import { $isMathNode } from '@/editor/nodes/MathNode';
import { $isTableNode } from '@/editor/nodes/TableNode';

function LinkDialog({ editor, node }: { editor: LexicalEditor, node: LinkNode | null }) {
  const theme = useTheme();
  const fullScreen = useMediaQuery(theme.breakpoints.down('md'));
  const [formData, setFormData] = useState({ url: '', rel: 'external', target: '_blank' });

  useEffect(() => {
    const payload = {
      url: node?.__url.replace(/^https?:\/\//, '').replace(/^#/, '') ?? '',
      rel: node?.__rel ?? 'external',
      target: node?.__target ?? '_blank',
    }
    setFormData(payload);
  }, [node]);

  const setUrl = (event: React.ChangeEvent<HTMLInputElement>) => {
    const value = event.target.value;
    const url = value.trim().toLowerCase().replace(/\s+/g, '-').replace(/^https?:\/\//, '').replace(/^#/, '');
    setFormData({ ...formData, url });
  }

  const updateFormData = (event: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = event.target;
    setFormData({ ...formData, [name]: value });
    if (name === 'rel') {
      const nodeRel = node?.__rel ?? 'external';
      const defaultUrl = value === 'bookmark' ? getBookmarkUrl() : value === 'tag' ? '' : '';
      const url = value === nodeRel ? node?.__url.replace(/^https?:\/\//, '').replace(/^#/, '') ?? defaultUrl : defaultUrl;
      const target = value === 'external' ? '_blank' : '_self';
      setFormData({ ...formData, [name]: value, url, target });
    }
  }

  const handleSubmit = (event: React.FormEvent<HTMLFormElement> | React.MouseEvent<HTMLButtonElement>) => {
    event.preventDefault();
    const sanitized = sanitizeUrl(formData.url);
    const rel = formData.rel;
    const url = rel === 'external' ? `https://${sanitized}` : `#${sanitized}`;
    const target = formData.target;

    if (!node) editor.dispatchCommand(TOGGLE_LINK_COMMAND, { url, rel, target, });
    else editor.update(() => {
      node.setURL(url);
      node.setRel(rel);
      node.setTarget(target);
    });
    closeDialog();
    setTimeout(() => { editor.focus() }, 0);
  };

  const closeDialog = () => {
    editor.dispatchCommand(SET_DIALOGS_COMMAND, { link: { open: false } })
  }

  const handleClose = () => {
    closeDialog();
  }

  const handleDelete = () => {
    editor.dispatchCommand(TOGGLE_LINK_COMMAND, null);
    closeDialog();
  }

  const editorState = editor.getEditorState();
  const figures = editorState.read(() => {
    const nodes = Object.values(Object.fromEntries(editorState._nodeMap)).filter(node => $isImageNode(node) || $isMathNode(node) || $isTableNode(node));
    const figures = nodes.map(node => node.exportDOM(editor).element).filter(el => el && isHTMLElement(el) && !!el.id) as HTMLElement[];
    const tables = nodes.filter($isTableNode).map(node => editor.getElementByKey(node.getKey())).filter(el => el && isHTMLElement(el) && !!el.id) as HTMLElement[];
    return figures.map(el => tables.find(table => el.id === table.id)?.cloneNode(true) ?? el) as HTMLElement[];
  });

  const getBookmarkUrl = useCallback(() => {
    return editor.getEditorState().read(() => {
      if (node && node.getRel() === 'bookmark') return decodeURIComponent(node.getURL().replace(/^https?:\/\//, '').replace(/^#/, ''));
      const selection = $getSelection();
      if (!$isRangeSelection(selection)) return '';
      const textContent = selection.isCollapsed() ? selection.focus.getNode().getTextContent() : selection.getTextContent();
      return textContent.trim().toLowerCase().replace(/\s+/g, '-').replace(/^https?:\/\//, '').replace(/^#/, '');
    });
  }, [editor, node]);

  return (
    <Dialog
      open
      fullScreen={fullScreen}
      onClose={handleClose}
      aria-labelledby="link-dialog-title"
      disableEscapeKeyDown
    >
      <DialogTitle id="link-dialog-title">
        Insert Link
      </DialogTitle>
      <DialogContent>
        <Box component="form" onSubmit={handleSubmit} noValidate>
          <RadioGroup row aria-label="orientation" name="rel" value={formData.rel} onChange={updateFormData}>
            <FormControlLabel value="external" control={<Radio />} label="External" />
            <FormControlLabel value="bookmark" control={<Radio />} label="Self" />
            <FormControlLabel value="tag" control={<Radio />} label="Figure" />
          </RadioGroup>
          {formData.rel === "tag" &&
            <FormControl fullWidth margin='normal'>
              <InputLabel>Figure</InputLabel>
              <Select
                size="small"
                fullWidth
                value={formData.url}
                onChange={setUrl as any}
                label="Figure"
                name="url"
                autoFocus
                startAdornment={<InputAdornment position="start">#</InputAdornment>}
              >
                {figures.map((figure) => (
                  <MenuItem key={figure.id} value={figure.id}>
                    <ListItemIcon
                      sx={{
                        '& figure': {
                          flexDirection: 'row',
                          '& img, & svg': { width: 40 }
                        },
                        '& figcaption': {
                          justifyContent: 'center', width: 'auto', padding: 0
                        },
                        '& table': { tableLayout: 'auto', margin: 0, float: 'none' }
                      }}
                      dangerouslySetInnerHTML={{ __html: figure.outerHTML }}
                    />
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          }
          {formData.rel === "bookmark" &&
            <TextField
              margin='normal'
              size="small"
              fullWidth
              value={formData.url}
              onChange={setUrl}
              label="URL"
              name="url"
              autoFocus
              autoComplete='off'
              slotProps={{
                input: {
                  startAdornment: <InputAdornment position="start">#</InputAdornment>,
                }
              }}
            />
          }
          {formData.rel === "external" &&
            <TextField
              margin='normal'
              size="small"
              fullWidth
              value={formData.url}
              onChange={setUrl}
              label="URL"
              name="url"
              autoFocus
              autoComplete='off'
              prefix='https://'
              slotProps={{
                input: {
                  startAdornment: <InputAdornment position="start">https://</InputAdornment>,
                }
              }}
            />
          }
          <button hidden type="submit">Submit</button>
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
    </Dialog>
  );
}

export default memo(LinkDialog);