"use client"
import type { LexicalEditor } from 'lexical';
import React, { memo, useState } from 'react';
import { SET_DIALOGS_COMMAND } from './commands';
import { Badge, Box, Button, Dialog, DialogActions, DialogContent, DialogTitle, ListItemIcon, ListItemText, MenuItem, Select, Typography } from '@mui/material';
import useLocalStorage from '@/hooks/useLocalStorage';
import { ViewHeadline } from '@mui/icons-material';

const MODELS = [
  { label: 'Gemini 2.0 Flash', provider: 'google', model: 'gemini-2.0-flash', fast: true, reason: false },
  { label: 'Gemini 2.0 Flash Lite', provider: 'google', model: 'gemini-2.0-flash-lite', fast: true, reason: false },
  { label: 'Llama 3.1', provider: 'cloudflare', model: '@cf/meta/llama-3.1-8b-instruct-fast', fast: true, reason: false },
  { label: 'GPT 4o Mini', provider: 'azure', model: 'gpt-4o-mini', fast: true, reason: false },
  { label: 'Phi 4', provider: 'ollama', model: 'phi4', fast: false, reason: false },
  { label: 'Gemini 2.0 Flash Thinking', provider: 'google', model: 'gemini-2.0-flash-thinking-exp-01-21', fast: false, reason: true },
  { label: 'DeepScaleR', provider: 'ollama', model: 'deepscaler', fast: false, reason: true },
];

function AIDialog({ editor }: { editor: LexicalEditor }) {
  const [llm, setLlm] = useLocalStorage('llm', { provider: 'google', model: 'gemini-2.0-flash' });
  const [formData, setFormData] = useState(llm);

  const handleSubmit = (event: React.FormEvent<HTMLFormElement> | React.MouseEvent<HTMLButtonElement>) => {
    event.preventDefault();
    setLlm(formData);
    closeDialog();
  };

  const closeDialog = () => {
    editor.dispatchCommand(SET_DIALOGS_COMMAND, { ai: { open: false } })
  }

  const handleClose = () => {
    closeDialog();
  }

  return <Dialog
    open
    fullWidth
    maxWidth="xs"
    onClose={handleClose}
    aria-labelledby="ai-dialog-title"
    disableEscapeKeyDown
  >
    <DialogTitle id="ai-dialog-title">
      Configure AI Models
    </DialogTitle>
    <DialogContent>
      <Box component="form" onSubmit={handleSubmit} noValidate sx={{ mt: 1 }}>
        <Typography variant="button" component="h3" color="text.secondary" sx={{ my: 1 }}>
          Language Model
        </Typography>
        <Select value={formData.model} size='small' fullWidth sx={{
          '& .MuiSelect-select': { display: 'flex !important', alignItems: 'center', py: 0.5 },
          '& .MuiListItemIcon-root': { mr: 0.5, minWidth: 20 },
          fieldset: { borderColor: 'divider' },
          '&:hover .MuiOutlinedInput-notchedOutline': { borderColor: 'primary.main' },
        }}
          MenuProps={{
            slotProps: {
              root: { sx: { '& .MuiBackdrop-root': { userSelect: 'none' }, '& .MuiMenuItem-root': { minHeight: 36 }, } }
            }
          }}
          inputProps={{ 'aria-label': 'Language Model' }}
        >
          {MODELS.map(({ label, provider, model, fast, reason }) => (
            <MenuItem key={model} value={model} onClick={() => setFormData({ provider, model })}>
              <ListItemIcon>
                <ViewHeadline fontSize="small" />
              </ListItemIcon>
              <ListItemText>{label}</ListItemText>
              {fast && <Badge color="success" badgeContent="Fast" sx={{ ml: 1, '& .MuiBadge-badge': { position: 'static', transform: 'none' } }} />}
              {reason && <Badge color="warning" badgeContent="Reason" sx={{ ml: 1, '& .MuiBadge-badge': { position: 'static', transform: 'none' } }} />}
            </MenuItem>
          ))}
        </Select>
      </Box>
    </DialogContent>
    <DialogActions>
      <Button autoFocus onClick={handleClose}>
        Cancel
      </Button>
      <Button onClick={handleSubmit}>
        Save
      </Button>
    </DialogActions>
  </Dialog>;
}

export default memo(AIDialog);