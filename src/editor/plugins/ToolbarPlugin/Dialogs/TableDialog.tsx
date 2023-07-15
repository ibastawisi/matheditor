import { $getSelection, $setSelection, LexicalEditor } from 'lexical';
import { INSERT_TABLE_COMMAND } from '../../../nodes/TableNode';
import Box from '@mui/material/Box';
import React, { memo, useState } from 'react';
import useTheme from '@mui/material/styles/useTheme';
import Button from '@mui/material/Button';
import Dialog from '@mui/material/Dialog';
import DialogActions from '@mui/material/DialogActions';
import DialogContent from '@mui/material/DialogContent';
import DialogTitle from '@mui/material/DialogTitle';
import useMediaQuery from '@mui/material/useMediaQuery';
import TextField from '@mui/material/TextField/TextField';
import FormControl from '@mui/material/FormControl';
import IconButton from '@mui/material/IconButton';
import Add from '@mui/icons-material/Add';
import Remove from '@mui/icons-material/Remove';
import Switch from '@mui/material/Switch';
import FormControlLabel from '@mui/material/FormControlLabel';
import { SET_DIALOGS_COMMAND } from '..';

function TableDialog({ editor, open }: { editor: LexicalEditor, open: boolean }) {
  const theme = useTheme();
  const fullScreen = useMediaQuery(theme.breakpoints.down('md'));
  const [formData, setFormData] = useState({ rows: '3', columns: '3', includeHeaders: true });

  const setRows = (rows: number) => {
    setFormData({ ...formData, rows: Math.max(1, rows).toString() });
  }
  const setColumns = (columns: number) => {
    setFormData({ ...formData, columns: Math.max(1, columns).toString() });
  }
  const setIncludeHeaders = (_event: React.ChangeEvent<HTMLInputElement>, includeHeaders: boolean) => {
    setFormData({ ...formData, includeHeaders });
  }
  const handleSubmit = (event: React.FormEvent<HTMLFormElement> | React.MouseEvent<HTMLButtonElement>) => {
    event.preventDefault();
    editor.dispatchCommand(INSERT_TABLE_COMMAND, formData);
    closeDialog();
    setTimeout(() => { editor.focus() }, 0);
  };

  const closeDialog = () => {
    editor.dispatchCommand(SET_DIALOGS_COMMAND, { table: { open: false } })
    setFormData({ rows: '3', columns: '3', includeHeaders: true });
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

  return <Dialog
    open={open}
    fullScreen={fullScreen}
    onClose={handleClose}
    aria-labelledby="table-dialog-title"
    disableEscapeKeyDown
  >
    <DialogTitle id="table-dialog-title">
      Insert Table
    </DialogTitle>
    <DialogContent>
      <Box component="form" onSubmit={handleSubmit} noValidate sx={{ mt: 1 }}>
        <FormControl sx={{ display: 'flex', flexDirection: 'row', justifyContent: 'center', my: 2 }}>
          <IconButton onClick={() => setRows(+formData.rows - 1)}><Remove /></IconButton>
          <TextField type="number" size="small" sx={{ mx: 1 }} value={formData.rows} onChange={e => setRows(+e.target.value)} label="Rows" name="rows" autoComplete="rows" autoFocus />
          <IconButton onClick={() => setRows(+formData.rows + 1)}><Add /></IconButton>
        </FormControl>
        <FormControl sx={{ display: 'flex', flexDirection: 'row', justifyContent: 'center', my: 2 }}>
          <IconButton onClick={() => setColumns(+formData.columns - 1)}><Remove /></IconButton>
          <TextField type="number" size="small" sx={{ mx: 1 }} value={formData.columns} onChange={e => setColumns(+e.target.value)} label="Columns" name="columns" autoComplete="columns" autoFocus />
          <IconButton onClick={() => setColumns(+formData.columns + 1)}><Add /></IconButton>
        </FormControl>
        <FormControlLabel sx={{ display: 'flex', justifyContent: 'center', my: 2 }} control={<Switch checked={formData.includeHeaders} onChange={setIncludeHeaders} />} label="Include Headers" />
      </Box>
    </DialogContent>
    <DialogActions>
      <Button autoFocus onClick={handleClose}>
        Cancel
      </Button>
      <Button onClick={handleSubmit}>
        Insert
      </Button>
    </DialogActions>
  </Dialog>;
}

export default memo(TableDialog);