"use client"
import { $getSelection, $setSelection, LexicalEditor } from 'lexical';
import { INSERT_LAYOUT_COMMAND } from '@/editor/plugins/LayoutPlugin';
import React, { memo } from 'react';
import { SET_DIALOGS_COMMAND } from './commands';
import useFixedBodyScroll from '@/hooks/useFixedBodyScroll';
import { useTheme } from '@mui/material/styles';
import { Box, Button, Dialog, DialogActions, DialogContent, DialogTitle, FormControl, FormControlLabel, FormLabel, Radio, RadioGroup, useMediaQuery } from '@mui/material';

const LAYOUTS = [
  { label: '2 columns (equal width)', value: '1fr 1fr' },
  { label: '2 columns (25% - 75%)', value: '1fr 3fr' },
  { label: '3 columns (equal width)', value: '1fr 1fr 1fr' },
  { label: '3 columns (25% - 50% - 25%)', value: '1fr 2fr 1fr' },
  { label: '4 columns (equal width)', value: '1fr 1fr 1fr 1fr' },
];

function LayoutDialog({ editor, open }: { editor: LexicalEditor, open: boolean }) {
  const theme = useTheme();
  const fullScreen = useMediaQuery(theme.breakpoints.down('md'));
  const [formData, setFormData] = React.useState({ layout: LAYOUTS[0].value });

  const handleSubmit = (event: React.FormEvent<HTMLFormElement> | React.MouseEvent<HTMLButtonElement>) => {
    event.preventDefault();
    editor.dispatchCommand(INSERT_LAYOUT_COMMAND, formData.layout);
    closeDialog();
    setTimeout(() => { editor.focus() }, 0);
  };

  const closeDialog = () => {
    editor.dispatchCommand(SET_DIALOGS_COMMAND, { layout: { open: false } })
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
    aria-labelledby="layout-dialog-title"
    disableEscapeKeyDown
  >
    <DialogTitle id="layout-dialog-title">
      Insert Layout
    </DialogTitle>
    <DialogContent>
      <Box component="form" onSubmit={handleSubmit} noValidate sx={{ mt: 1 }}>
        <FormControl>
          <FormLabel id="column-layout-group-label">Column Layout</FormLabel>
          <RadioGroup
            aria-labelledby="column-layout-group-label"
            name="layouts"
            value={formData.layout}
            onChange={(event) => setFormData({ ...formData, layout: event.target.value })}
          >
            {LAYOUTS.map(({ label, value }) => (
              <FormControlLabel
                key={value}
                value={value}
                label={label}
                control={<Radio />}
              />
            ))}
          </RadioGroup>
        </FormControl>
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

export default memo(LayoutDialog);