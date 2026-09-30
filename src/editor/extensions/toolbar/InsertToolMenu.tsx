"use client"
import React, { useState } from 'react';
import { useLexicalComposerContext } from '@lexical/react/LexicalComposerContext';
import { IconButton, Menu, MenuItem, ListItemIcon, ListItemText, Typography } from '@mui/material';
import { Add, HorizontalRule, InsertPageBreak, Functions, Brush, StickyNote2, Image as ImageIcon, TableChart, Web, ViewColumn, Expand } from '@mui/icons-material';
import { INSERT_HORIZONTAL_RULE_COMMAND } from '@/editor/extensions/horizontal-rule/commands';
import { INSERT_PAGE_BREAK_COMMAND } from '@/editor/extensions/page-break/commands';
import { INSERT_MATH_COMMAND } from '@/editor/extensions/math/commands';
import { INSERT_STICKY_COMMAND } from '@/editor/extensions/sticky/commands';
import { INSERT_DETAILS_COMMAND } from '@/editor/extensions/details/commands';
import { setOpenDialog } from '@/editor/extensions/store';
import { GraphIcon as Graph } from '@/editor/extensions/shared/icons';

export default function InsertToolMenu() {
  const [editor] = useLexicalComposerContext();

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
        <MenuItem onClick={() => { editor.dispatchCommand(INSERT_HORIZONTAL_RULE_COMMAND, undefined,); handleClose(); }}>
          <ListItemIcon>
            <HorizontalRule fontSize="small" />
          </ListItemIcon>
          <ListItemText>Divider</ListItemText>
          <Typography variant="body2" sx={{ color: "text.secondary" }}>---</Typography>
        </MenuItem>
        <MenuItem onClick={() => { editor.dispatchCommand(INSERT_PAGE_BREAK_COMMAND, undefined,); handleClose(); }}>
          <ListItemIcon>
            <InsertPageBreak fontSize="small" />
          </ListItemIcon>
          <ListItemText>Page</ListItemText>
          <Typography variant="body2" sx={{ color: "text.secondary" }}>/page</Typography>
        </MenuItem>
        <MenuItem onClick={() => { editor.dispatchCommand(INSERT_MATH_COMMAND, { value: '' },); handleClose(); }}>
          <ListItemIcon>
            <Functions fontSize="small" />
          </ListItemIcon>
          <ListItemText>Math</ListItemText>
          <Typography variant="body2" sx={{ color: "text.secondary" }}>$$</Typography>
        </MenuItem>
        <MenuItem onClick={() => { openGraphDialog(); handleClose(); }}>
          <ListItemIcon>
            <Graph />
          </ListItemIcon>
          <ListItemText>Graph</ListItemText>
          <Typography variant="body2" sx={{ color: "text.secondary" }}>/plot</Typography>
        </MenuItem>
        <MenuItem onClick={() => { openSketchDialog(); handleClose(); }}>
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
        </MenuItem>
        <MenuItem onClick={() => { openImageDialog(); handleClose(); }}>
          <ListItemIcon>
            <ImageIcon fontSize="small" />
          </ListItemIcon>
          <ListItemText>Image</ListItemText>
          <Typography variant="body2" sx={{ color: "text.secondary" }}>/img</Typography>
        </MenuItem>
        <MenuItem onClick={() => { openTableDialog(); handleClose(); }}>
          <ListItemIcon>
            <TableChart fontSize="small" />
          </ListItemIcon>
          <ListItemText>Table</ListItemText>
          <Typography variant="body2" sx={{ color: "text.secondary" }}>/3x3</Typography>
        </MenuItem>
        <MenuItem onClick={() => { openLayoutDialog(); handleClose(); }}>
          <ListItemIcon>
            <ViewColumn fontSize="small" />
          </ListItemIcon>
          <ListItemText>Columns</ListItemText>
          <Typography variant="body2" sx={{ color: "text.secondary" }}>/col</Typography>
        </MenuItem>
        <MenuItem onClick={() => { editor.dispatchCommand(INSERT_STICKY_COMMAND, undefined); handleClose(); }}>
          <ListItemIcon>
            <StickyNote2 fontSize="small" />
          </ListItemIcon>
          <ListItemText>Note</ListItemText>
          <Typography variant="body2" sx={{ color: "text.secondary" }}>/note</Typography>
        </MenuItem>
        <MenuItem onClick={() => { openIFrameDialog(); handleClose(); }}>
          <ListItemIcon>
            <Web fontSize="small" />
          </ListItemIcon>
          <ListItemText>IFrame</ListItemText>
          <Typography variant="body2" sx={{ color: "text.secondary" }}>/iframe</Typography>
        </MenuItem>
        <MenuItem onClick={() => { editor.dispatchCommand(INSERT_DETAILS_COMMAND, undefined); handleClose(); }}>
          <ListItemIcon>
            <Expand fontSize="small" />
          </ListItemIcon>
          <ListItemText>Details</ListItemText>
          <Typography variant="body2" sx={{ color: "text.secondary" }}>/details</Typography>
        </MenuItem>
      </Menu>
    </>
  );
}
