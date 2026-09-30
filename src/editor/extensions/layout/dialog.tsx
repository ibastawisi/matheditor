"use client"
import { INSERT_LAYOUT_COMMAND } from './commands';
import { useLexicalComposerContext } from '@lexical/react/LexicalComposerContext';
import React, { memo } from 'react';
import { setOpenDialog } from '@/editor/extensions/store';
import { useTheme } from '@mui/material/styles';
import { Box, Button, Dialog, DialogActions, DialogContent, DialogTitle, FormControl, FormControlLabel, FormLabel, Radio, RadioGroup, useMediaQuery } from '@mui/material';

const LAYOUTS = [
  { label: '2 columns (equal width)', value: '1fr 1fr' },
  { label: '2 columns (25% - 75%)', value: '1fr 3fr' },
  { label: '3 columns (equal width)', value: '1fr 1fr 1fr' },
  { label: '3 columns (25% - 50% - 25%)', value: '1fr 2fr 1fr' },
  { label: '4 columns (equal width)', value: '1fr 1fr 1fr 1fr' },
];

function LayoutDialog() {
  const [editor] = useLexicalComposerContext();
  const theme = useTheme();
  const fullScreen = useMediaQuery(theme.breakpoints.down('md'));
  const [formData, setFormData] = React.useState({ layout: LAYOUTS[0].value });

  const handleSubmit = (event: React.FormEvent<HTMLFormElement> | React.MouseEvent<HTMLButtonElement>) => {
    event.preventDefault();
    editor.dispatchCommand(INSERT_LAYOUT_COMMAND, formData.layout);
    closeDialog();
  };

  const closeDialog = () => {
    setOpenDialog(editor, null);
  }

  const handleClose = () => {
    closeDialog();
  }

  return <Dialog
    open
    fullScreen={fullScreen}
    onClose={(_, reason) => { if (reason !== 'escapeKeyDown') handleClose(); }}
    aria-labelledby="layout-dialog-title"
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