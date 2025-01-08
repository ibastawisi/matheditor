"use client"
import { $getNodeByKey, $getSelection, $isRangeSelection, isHTMLElement, LexicalEditor } from 'lexical';
import React, { memo, useCallback, useEffect, useMemo, useState } from 'react';
import { SET_DIALOGS_COMMAND } from './commands';
import { useTheme } from '@mui/material/styles';
import { Box, Button, Dialog, DialogActions, DialogContent, DialogTitle, FormControl, FormControlLabel, InputLabel, ListItemIcon, MenuItem, Radio, RadioGroup, Select, SelectChangeEvent, TextField, useMediaQuery } from '@mui/material';
import { TOGGLE_LINK_COMMAND, type LinkNode } from '@lexical/link';
import { LinkOff } from '@mui/icons-material';
import { $isImageNode } from '@/editor/nodes/ImageNode';
import { $isMathNode } from '@/editor/nodes/MathNode';
import { $isTableNode } from '@/editor/nodes/TableNode';
import { getEditorNodes } from '@/editor/utils/getEditorNodes';

function LinkDialog({ editor, node }: { editor: LexicalEditor, node: LinkNode | null }) {
  const theme = useTheme();
  const fullScreen = useMediaQuery(theme.breakpoints.down('md'));
  const [url, setUrl] = useState<string>('https://');
  const [rel, setRel] = useState<string>('external');
  const [target, setTarget] = useState<string>('_blank');
  const [figure, setFigure] = useState<string>('self');

  const figures = useMemo(() => {
    const editorState = editor.getEditorState();
    const nodes = editorState.read(() => getEditorNodes(editor).filter(node => $isImageNode(node) || $isMathNode(node) || $isTableNode(node)));
    const editors = [...document.querySelectorAll<any>('[contenteditable="true"]')].map(el => el.__lexicalEditor).filter(Boolean) as LexicalEditor[];
    return nodes.reduce((map, node) => {
      const ownerEditor = editors.find(editor => editor._editorState._nodeMap.has(node.getKey()));
      if (!ownerEditor) return map;
      const element = $isTableNode(node) ? ownerEditor.getElementByKey(node.getKey()) : node.exportDOM(ownerEditor).element;
      if (!isHTMLElement(element)) return map;
      map.set(node.getKey(), element);
      return map;
    }, new Map());
  }, []);

  useEffect(() => {
    setUrl(node?.__url ?? 'https://');
    setRel(node?.__rel ?? 'external');
    setTarget(node?.__target ?? '_blank');
    if (node?.__rel === 'bookmark') {
      const id = node.__url.slice(1);
      const figureKey = [...figures.entries()].find(([key, element]) => element.id === id)?.[0];
      const target = node.__target;
      setFigure(figureKey ?? target === '_self' ? 'self' : 'none');
    }
  }, [node]);

  const updateUrl = (event: React.ChangeEvent<HTMLInputElement>) => {
    const value = event.target.value.toLowerCase().replace(/\s+/g, '-');
    const url = rel === 'bookmark' ? value.padStart(1, '#') : value;
    setUrl(url);
  }

  const updateRel = (event: React.ChangeEvent<HTMLInputElement>) => {
    const value = event.target.value;
    setRel(value);
    const nodeRel = node?.__rel ?? 'external';
    const defaultUrl = value === 'bookmark' ? getBookmarkUrl() : 'https://';
    const nodeUrl = node?.__url ?? defaultUrl;
    const url = value === nodeRel ? nodeUrl : defaultUrl;
    setUrl(url);
    const target = value === 'external' ? '_blank' : figure === 'self' ? '_self' : '';
    setTarget(target);
  }

  const updateFigure = (event: SelectChangeEvent) => {
    const value = event.target.value;
    setFigure(value);
    if (value === 'self') setTarget('_self');
    if (value === 'none') setTarget('');
  }

  const handleSubmit = (event: React.FormEvent<HTMLFormElement> | React.MouseEvent<HTMLButtonElement>) => {
    event.preventDefault();
    if (rel === 'bookmark' && figure) setNodeId(figure, url.slice(1));
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


  const getBookmarkUrl = useCallback(() => {
    return editor.getEditorState().read(() => {
      if (node && node.getRel() === 'bookmark') return decodeURIComponent(node.getURL());
      const selection = $getSelection();
      if (!$isRangeSelection(selection)) return '';
      const textContent = selection.isCollapsed() ? selection.focus.getNode().getTextContent() : selection.getTextContent();
      return `#${textContent.trim().toLowerCase().replace(/\s+/g, '-')}`;
    });
  }, [editor, node]);

  const setNodeId = (key: string, id: string) => {
    const editors = [...document.querySelectorAll<any>('[contenteditable="true"]')].map(el => el.__lexicalEditor).filter(Boolean) as LexicalEditor[];
    const previousFigureKey = [...figures.entries()].find(([k, element]) => element.id === id && k !== key)?.[0];
    const previousEditor = editors.find(editor => editor._editorState._nodeMap.has(previousFigureKey));
    if (previousEditor) previousEditor.update(() => {
      const node = $getNodeByKey(previousFigureKey);
      if (!($isImageNode(node) || $isMathNode(node) || $isTableNode(node))) return;
      node.setId('');
    });
    const currentEditor = editors.find(editor => editor._editorState._nodeMap.has(key));
    if (!currentEditor) return;
    currentEditor.update(() => {
      const node = $getNodeByKey(key);
      if (!($isImageNode(node) || $isMathNode(node) || $isTableNode(node))) return;
      node.setId(id);
    });
  }

  return (
    <Dialog
      open
      fullScreen={fullScreen}
      onClose={handleClose}
      aria-labelledby="link-dialog-title"
      disableEscapeKeyDown
      fullWidth
      maxWidth="sm"
    >
      <DialogTitle id="link-dialog-title">
        Insert Link
      </DialogTitle>
      <DialogContent>
        <Box component="form" onSubmit={handleSubmit} noValidate>
          <RadioGroup row aria-label="orientation" value={rel} onChange={updateRel}>
            <FormControlLabel value="external" control={<Radio />} label="External" />
            <FormControlLabel value="bookmark" control={<Radio />} label="Internal" />
          </RadioGroup>
          <TextField
            margin='normal'
            size="small"
            fullWidth
            value={url}
            onChange={updateUrl}
            label="URL"
            autoFocus
            autoComplete='off'
          />
          {rel === "bookmark" &&
            <FormControl fullWidth margin='normal'>
              <InputLabel>Figure</InputLabel>
              <Select
                size="small"
                fullWidth
                value={figure}
                onChange={updateFigure}
                label="Figure"
              >
                <MenuItem value="self">Self</MenuItem>
                <MenuItem value="none">None</MenuItem>
                {[...figures.keys()].map(key => (
                  <MenuItem key={key} value={key}>
                    <ListItemIcon
                      sx={{
                        display: 'block',
                        width: '100%',
                        '& figure': {
                          '& img, & svg': { width: 40 }
                        },
                        '& figcaption': {
                          display: 'none'
                        },
                        '& table': { tableLayout: 'auto', margin: 0, float: 'none' }
                      }}
                      dangerouslySetInnerHTML={{ __html: figures.get(key).outerHTML }}
                    />
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          }
          <button hidden type="submit">Submit</button>
        </Box>
      </DialogContent>
      <DialogActions>
        {node && <Button onClick={handleDelete} startIcon={<LinkOff />} color="error" sx={{ mr: 'auto' }}>Unlink</Button>}
        <Button onClick={handleClose}>
          Cancel
        </Button>
        <Button onClick={handleSubmit} disabled={!url}>
          Confirm
        </Button>
      </DialogActions>
    </Dialog>
  );
}

export default memo(LinkDialog);