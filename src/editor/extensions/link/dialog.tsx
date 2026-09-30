"use client"
import { $getNodeByKey, $getSelection, $isRangeSelection, isHTMLElement, LexicalNode, NodeKey } from 'lexical';
import { useLexicalComposerContext } from '@lexical/react/LexicalComposerContext';
import React, { memo, useCallback, useEffect, useMemo, useState } from 'react';
import { Box, Button, Dialog, DialogActions, DialogContent, DialogTitle, FormControl, FormControlLabel, InputLabel, ListItemIcon, MenuItem, Radio, RadioGroup, Select, SelectChangeEvent, TextField } from '@mui/material';
import { $isLinkNode, TOGGLE_LINK_COMMAND } from '@lexical/link';
import { $isTableNode } from '@lexical/table';
import { LinkOff } from '@mui/icons-material';
import { $isImageNode } from '@/editor/extensions/image/nodes';
import { $isMathNode } from '@/editor/extensions/math/nodes';
import { $setId } from '@/editor/extensions/shared/states';
import { setOpenDialog } from '@/editor/extensions/store';
import { getEditorNodes } from '@/editor/utils/getEditorNodes';

const $isFigureNode = (node: LexicalNode | null | undefined) => $isImageNode(node) || $isMathNode(node) || $isTableNode(node);

function LinkDialog({ nodeKey }: { nodeKey: NodeKey | null }) {
  const [editor] = useLexicalComposerContext();
  const [node] = useState(() => editor.read(() => {
    const node = nodeKey ? $getNodeByKey(nodeKey) : null;
    if (!$isLinkNode(node)) return null;
    return { url: node.getURL(), rel: node.getRel(), target: node.getTarget() };
  }));
  const [url, setUrl] = useState<string>('https://');
  const [rel, setRel] = useState<string | null>('external');
  const [target, setTarget] = useState<string | null>('_blank');
  const [figure, setFigure] = useState<string>('self');

  const figures = useMemo(() => {
    return editor.read(() => getEditorNodes(editor).filter($isFigureNode).reduce((map, node) => {
      const element = $isTableNode(node) ? editor.getElementByKey(node.getKey())?.querySelector('table') : node.exportDOM(editor).element;
      if (!isHTMLElement(element)) return map;
      map.set(node.getKey(), element);
      return map;
    }, new Map<string, HTMLElement>()));
  }, [editor]);

  useEffect(() => {
    setUrl(node?.url ?? 'https://');
    setRel(node?.rel ?? 'external');
    setTarget(node?.target ?? '_blank');
    if (node?.rel === 'bookmark') {
      const id = node.url.slice(1);
      const figureKey = [...figures.entries()].find(([, element]) => element.id === id)?.[0];
      const target = node.target;
      const figure = figureKey ? figureKey : target === '_self' ? 'self' : 'none';
      setFigure(figure);
    }
  }, [node, figures]);

  const updateUrl = (event: React.ChangeEvent<HTMLInputElement>) => {
    const value = event.target.value.trim().toLowerCase();
    const url = rel === 'bookmark' ? value.padStart(1, '#') : value;
    setUrl(url);
  }

  const updateRel = (event: React.ChangeEvent<HTMLInputElement>) => {
    const value = event.target.value;
    setRel(value);
    const nodeRel = node?.rel ?? 'external';
    const defaultUrl = value === 'bookmark' ? getBookmarkUrl() : 'https://';
    const nodeUrl = node?.url ?? defaultUrl;
    const url = value === nodeRel ? nodeUrl : defaultUrl;
    setUrl(url);
    const target = value === 'external' ? '_blank' : figure === 'self' ? '_self' : null;
    setTarget(target);
  }

  const updateFigure = (event: SelectChangeEvent) => {
    const value = event.target.value;
    setFigure(value);
    if (value === 'self') setTarget('_self');
    else setTarget(null);
  }

  const handleSubmit = (event: React.SyntheticEvent) => {
    event.preventDefault();
    if (rel === 'bookmark' && figure) setNodeId(figure, url.slice(1));
    if (!node || !nodeKey) editor.dispatchCommand(TOGGLE_LINK_COMMAND, { url, rel, target, });
    else editor.update(() => {
      const linkNode = $getNodeByKey(nodeKey);
      if (!$isLinkNode(linkNode)) return;
      linkNode.setURL(url);
      linkNode.setRel(rel);
      linkNode.setTarget(target);
    });
    closeDialog();
    setTimeout(() => { editor.focus() }, 0);
  };

  const closeDialog = () => {
    setOpenDialog(editor, null);
  }

  const handleClose = () => {
    closeDialog();
  }

  const handleDelete = () => {
    editor.dispatchCommand(TOGGLE_LINK_COMMAND, null);
    closeDialog();
  }


  const getBookmarkUrl = useCallback(() => {
    return editor.read(() => {
      if (node && node.rel === 'bookmark') return decodeURIComponent(node.url);
      const selection = $getSelection();
      if (!$isRangeSelection(selection)) return '#';
      const textContent = selection.isCollapsed() ? selection.focus.getNode().getTextContent() : selection.getTextContent();
      return `#${textContent.trim().toLowerCase()}`;
    });
  }, [editor, node]);

  const setNodeId = (key: string, id: string) => {
    const previousFigureKey = [...figures.entries()].find(([k, element]) => element.id === id && k !== key)?.[0];
    editor.update(() => {
      const previousNode = previousFigureKey ? $getNodeByKey(previousFigureKey) : null;
      if ($isFigureNode(previousNode)) $setId(previousNode!, '');
      const node = $getNodeByKey(key);
      if ($isFigureNode(node)) $setId(node!, id);
    });
  }

  return (
    <Dialog
      open
      onClose={(_, reason) => { if (reason !== 'escapeKeyDown') handleClose(); }}
      aria-labelledby="link-dialog-title"
      fullWidth
      maxWidth="sm"
      slotProps={{ paper: { component: 'form', onSubmit: handleSubmit, }, }}
    >
      <DialogTitle id="link-dialog-title">
        Insert Link
      </DialogTitle>
      <DialogContent>
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
          inputRef={input => { input && setTimeout(() => input.focus(), 0) }}
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
                    dangerouslySetInnerHTML={{ __html: figures.get(key)!.outerHTML }}
                  />
                </MenuItem>
              ))}
            </Select>
          </FormControl>
        }
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