"use client"
import React, { useState } from 'react';
import { useLexicalComposerContext } from '@lexical/react/LexicalComposerContext';
import { IconButton, Menu, MenuItem, ListItemIcon, ListItemText, Typography } from '@mui/material';
import { Add, HorizontalRule, InsertPageBreak, Functions, Brush, StickyNote2, Image as ImageIcon, TableChart, Web, ViewColumn, Expand, Tag, Numbers } from '@mui/icons-material';
import type { Klass, LexicalNode } from 'lexical';
import { TableNode } from '@lexical/table';
import { INSERT_HORIZONTAL_RULE_COMMAND } from '@/editor/extensions/horizontal-rule/commands';
import { INSERT_PAGE_BREAK_COMMAND } from '@/editor/extensions/page-break/commands';
import { INSERT_MATH_COMMAND } from '@/editor/extensions/math/commands';
import { INSERT_STICKY_COMMAND } from '@/editor/extensions/sticky/commands';
import { INSERT_DETAILS_COMMAND } from '@/editor/extensions/details/commands';
import { setOpenDialog } from '@/editor/extensions/store';
import { GraphIcon as Graph } from '@/editor/extensions/shared/icons';
import { INSERT_PAGE_COUNT_COMMAND, INSERT_PAGE_NUMBER_COMMAND } from '@/editor/extensions/pages/commands';
import { HorizontalRuleNode } from '@/editor/extensions/horizontal-rule/nodes';
import { PageBreakNode } from '@/editor/extensions/page-break/nodes';
import { MathNode } from '@/editor/extensions/math/nodes';
import { GraphNode } from '@/editor/extensions/graph/nodes';
import { SketchNode } from '@/editor/extensions/sketch/nodes';
import { ImageNode } from '@/editor/extensions/image/nodes';
import { LayoutContainerNode } from '@/editor/extensions/layout/nodes';
import { StickyNode } from '@/editor/extensions/sticky/nodes';
import { IFrameNode } from '@/editor/extensions/iframe/nodes';
import { DetailsContainerNode } from '@/editor/extensions/details/nodes';
import { PageCountNode, PageNumberNode } from '@/editor/extensions/pages/nodes';

export default function InsertToolMenu() {
  const [editor] = useLexicalComposerContext();
  // offer only what this editor can hold, since a page header registers
  // fewer nodes than the document
  const has = (...nodes: Klass<LexicalNode>[]) => editor.hasNodes(nodes);

  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const open = Boolean(anchorEl);
  const handleClick = (event: React.MouseEvent<HTMLElement>) => {
    setAnchorEl(event.currentTarget);
  };
  const handleClose = () => {
    setAnchorEl(null);
  };

  const openImageDialog = () => setOpenDialog(editor, 'image');
  const openTableDialog = () => setOpenDialog(editor, 'table');
  const openGraphDialog = () => setOpenDialog(editor, 'graph');
  const openSketchDialog = () => setOpenDialog(editor, 'sketch');
  const openIFrameDialog = () => setOpenDialog(editor, 'iframe');
  const openLayoutDialog = () => setOpenDialog(editor, 'layout');

  return (
    <>
      <IconButton id="insert-button" aria-controls={open ? 'insert-menu' : undefined} aria-haspopup="true" aria-expanded={open ? 'true' : undefined} aria-label='Insert'
        onClick={handleClick}>
        <Add fontSize='small' />
      </IconButton>
      <Menu id="insert-menu" aria-labelledby="insert-button"
        anchorEl={anchorEl} open={open}
        onClose={handleClose}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center', }}
        transformOrigin={{ vertical: 'top', horizontal: 'center', }}
        sx={{
          '& .MuiBackdrop-root': { userSelect: 'none' },
          '& .MuiMenuItem-root': { minHeight: 36 },
        }}
      >
        {has(HorizontalRuleNode) && <MenuItem onClick={() => { editor.dispatchCommand(INSERT_HORIZONTAL_RULE_COMMAND, undefined,); handleClose(); }}>
          <ListItemIcon>
            <HorizontalRule fontSize="small" />
          </ListItemIcon>
          <ListItemText>Divider</ListItemText>
          <Typography variant="body2" sx={{ color: "text.secondary" }}>---</Typography>
        </MenuItem>}
        {has(PageBreakNode) && <MenuItem onClick={() => { editor.dispatchCommand(INSERT_PAGE_BREAK_COMMAND, undefined,); handleClose(); }}>
          <ListItemIcon>
            <InsertPageBreak fontSize="small" />
          </ListItemIcon>
          <ListItemText>Page</ListItemText>
          <Typography variant="body2" sx={{ color: "text.secondary" }}>/page</Typography>
        </MenuItem>}
        {has(MathNode) && <MenuItem onClick={() => { editor.dispatchCommand(INSERT_MATH_COMMAND, { value: '' },); handleClose(); }}>
          <ListItemIcon>
            <Functions fontSize="small" />
          </ListItemIcon>
          <ListItemText>Math</ListItemText>
          <Typography variant="body2" sx={{ color: "text.secondary" }}>$$</Typography>
        </MenuItem>}
        {has(GraphNode) && <MenuItem onClick={() => { openGraphDialog(); handleClose(); }}>
          <ListItemIcon>
            <Graph />
          </ListItemIcon>
          <ListItemText>Graph</ListItemText>
          <Typography variant="body2" sx={{ color: "text.secondary" }}>/plot</Typography>
        </MenuItem>}
        {has(SketchNode) && <MenuItem onClick={() => { openSketchDialog(); handleClose(); }}>
          <ListItemIcon>
            <Brush fontSize="small" />
          </ListItemIcon>
          <ListItemText>Sketch</ListItemText>
          <Typography
            variant="body2"
            sx={{
              color: "text.secondary",
              ml: 1
            }}>/sketch</Typography>
        </MenuItem>}
        {has(ImageNode) && <MenuItem onClick={() => { openImageDialog(); handleClose(); }}>
          <ListItemIcon>
            <ImageIcon fontSize="small" />
          </ListItemIcon>
          <ListItemText>Image</ListItemText>
          <Typography variant="body2" sx={{ color: "text.secondary" }}>/img</Typography>
        </MenuItem>}
        {has(TableNode) && <MenuItem onClick={() => { openTableDialog(); handleClose(); }}>
          <ListItemIcon>
            <TableChart fontSize="small" />
          </ListItemIcon>
          <ListItemText>Table</ListItemText>
          <Typography variant="body2" sx={{ color: "text.secondary" }}>/3x3</Typography>
        </MenuItem>}
        {has(LayoutContainerNode) && <MenuItem onClick={() => { openLayoutDialog(); handleClose(); }}>
          <ListItemIcon>
            <ViewColumn fontSize="small" />
          </ListItemIcon>
          <ListItemText>Columns</ListItemText>
          <Typography variant="body2" sx={{ color: "text.secondary" }}>/col</Typography>
        </MenuItem>}
        {has(StickyNode) && <MenuItem onClick={() => { editor.dispatchCommand(INSERT_STICKY_COMMAND, undefined); handleClose(); }}>
          <ListItemIcon>
            <StickyNote2 fontSize="small" />
          </ListItemIcon>
          <ListItemText>Note</ListItemText>
          <Typography variant="body2" sx={{ color: "text.secondary" }}>/note</Typography>
        </MenuItem>}
        {has(IFrameNode) && <MenuItem onClick={() => { openIFrameDialog(); handleClose(); }}>
          <ListItemIcon>
            <Web fontSize="small" />
          </ListItemIcon>
          <ListItemText>IFrame</ListItemText>
          <Typography variant="body2" sx={{ color: "text.secondary" }}>/iframe</Typography>
        </MenuItem>}
        {has(DetailsContainerNode) && <MenuItem onClick={() => { editor.dispatchCommand(INSERT_DETAILS_COMMAND, undefined); handleClose(); }}>
          <ListItemIcon>
            <Expand fontSize="small" />
          </ListItemIcon>
          <ListItemText>Details</ListItemText>
          <Typography variant="body2" sx={{ color: "text.secondary" }}>/details</Typography>
        </MenuItem>}
        {has(PageNumberNode) && <MenuItem onClick={() => { editor.dispatchCommand(INSERT_PAGE_NUMBER_COMMAND, undefined); handleClose(); }}>
          <ListItemIcon>
            <Tag fontSize="small" />
          </ListItemIcon>
          <ListItemText>Page Number</ListItemText>
          <Typography variant="body2" sx={{ color: "text.secondary" }}>/pagenum</Typography>
        </MenuItem>}
        {has(PageCountNode) && <MenuItem onClick={() => { editor.dispatchCommand(INSERT_PAGE_COUNT_COMMAND, undefined); handleClose(); }}>
          <ListItemIcon>
            <Numbers fontSize="small" />
          </ListItemIcon>
          <ListItemText>Page Count</ListItemText>
          <Typography variant="body2" sx={{ color: "text.secondary" }}>/pages</Typography>
        </MenuItem>}
      </Menu>
    </>
  );
}
