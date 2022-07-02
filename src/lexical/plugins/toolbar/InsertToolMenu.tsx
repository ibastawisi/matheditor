import * as React from 'react';
import Menu from '@mui/material/Menu';
import MenuItem from '@mui/material/MenuItem';
import { LexicalEditor } from 'lexical';
import { INSERT_HORIZONTAL_RULE_COMMAND } from '@lexical/react/LexicalHorizontalRuleNode';
import InsertImageDialog from './InsertImageDialog';
import InsertTableDialog from './InsertTableDialog';
import AddIcon from '@mui/icons-material/Add';
import ListItemText from '@mui/material/ListItemText';
import ListItemIcon from '@mui/material/ListItemIcon';
import HorizontalRuleIcon from '@mui/icons-material/HorizontalRule';
import ImageIcon from '@mui/icons-material/Image';
import TableIcon from '@mui/icons-material/TableChart';
import FunctionsIcon from '@mui/icons-material/Functions';

import IconButton from '@mui/material/IconButton';
import { INSERT_MATH_COMMAND } from '../MathPlugin';

export default function InsertToolMenu({ editor }: { editor: LexicalEditor }): JSX.Element {
  const [tableDialogOpen, setTableDialogOpen] = React.useState(false);
  const [imageDialogOpen, setImageDialogOpen] = React.useState(false);
  const [anchorEl, setAnchorEl] = React.useState<null | HTMLElement>(null);
  const open = Boolean(anchorEl);
  const handleClick = (event: React.MouseEvent<HTMLElement>) => {
    setAnchorEl(event.currentTarget);
  };
  const handleClose = () => {
    setAnchorEl(null);
  };

  return (
    <>
      <IconButton id="insert-button" aria-controls={open ? 'insert-menu' : undefined} aria-haspopup="true" aria-expanded={open ? 'true' : undefined} onClick={handleClick}>
        <AddIcon />
      </IconButton>
      <Menu id="insert-menu" aria-labelledby="insert-button" anchorEl={anchorEl} open={open} onClose={handleClose} anchorOrigin={{ vertical: 'bottom', horizontal: 'center', }} transformOrigin={{ vertical: 'top', horizontal: 'center', }}>
        <MenuItem onClick={() => { editor.dispatchCommand(INSERT_HORIZONTAL_RULE_COMMAND, undefined,); handleClose(); }}>
          <ListItemIcon>
            <HorizontalRuleIcon fontSize="small" />
          </ListItemIcon>
          <ListItemText>Horizontal Rule</ListItemText>
        </MenuItem>
        <MenuItem onClick={() => { editor.dispatchCommand(INSERT_MATH_COMMAND, { value: '' },); handleClose(); }}>
          <ListItemIcon>
            <FunctionsIcon fontSize="small" />
          </ListItemIcon>
          <ListItemText>Math</ListItemText>
        </MenuItem>
        <MenuItem onClick={() => { setImageDialogOpen(true); handleClose(); }}>
          <ListItemIcon>
            <ImageIcon fontSize="small" />
          </ListItemIcon>
          <ListItemText>Image</ListItemText>
        </MenuItem>
        <MenuItem onClick={() => { setTableDialogOpen(true); handleClose(); }}>
          <ListItemIcon>
            <TableIcon fontSize="small" />
          </ListItemIcon>
          <ListItemText>Table</ListItemText>
        </MenuItem>
      </Menu>
      <InsertImageDialog editor={editor} open={imageDialogOpen} onClose={() => setImageDialogOpen(false)} />
      <InsertTableDialog editor={editor} open={tableDialogOpen} onClose={() => setTableDialogOpen(false)} />
    </>
  );
}
