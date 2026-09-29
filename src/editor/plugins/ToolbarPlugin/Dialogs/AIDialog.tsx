"use client";
import type { LexicalEditor } from "lexical";
import React, { memo, useState } from "react";
import { SET_DIALOGS_COMMAND } from "./commands";
import {
  Badge,
  Box,
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  ListItemIcon,
  ListItemText,
  MenuItem,
  Select,
  Typography,
} from "@mui/material";
import useLocalStorage from "@/hooks/useLocalStorage";
import { ViewHeadline } from "@mui/icons-material";
import { DEFAULT_LLM, MODELS, resolveLlmConfig } from "../models";

function AIDialog({ editor }: { editor: LexicalEditor }) {
  const [llm, setLlm] = useLocalStorage("llm", DEFAULT_LLM);
  const [formData, setFormData] = useState(() => resolveLlmConfig(llm));

  const handleSubmit = (
    event:
      | React.FormEvent<HTMLFormElement>
      | React.MouseEvent<HTMLButtonElement>
  ) => {
    event.preventDefault();
    setLlm(formData);
    closeDialog();
  };

  const closeDialog = () => {
    editor.dispatchCommand(SET_DIALOGS_COMMAND, { ai: { open: false } });
  };

  const handleClose = () => {
    closeDialog();
  };

  return (
    <Dialog
      open
      fullWidth
      maxWidth="xs"
      onClose={(_, reason) => { if (reason !== 'escapeKeyDown') handleClose(); }}
      aria-labelledby="ai-dialog-title"
    >
      <DialogTitle id="ai-dialog-title">Configure AI Models</DialogTitle>
      <DialogContent>
        <Box component="form" onSubmit={handleSubmit} noValidate sx={{ mt: 1 }}>
          <Typography
            variant="button"
            component="h3"
            sx={{
              color: "text.secondary",
              my: 1
            }}>
            Language Model
          </Typography>
          <Select
            value={formData.model}
            size="small"
            fullWidth
            sx={{
              "& .MuiSelect-select": {
                display: "flex !important",
                alignItems: "center",
                py: 0.5,
              },
              "& .MuiListItemIcon-root": { mr: 0.5, minWidth: 20 },
              fieldset: { borderColor: "divider" },
              "&:hover .MuiOutlinedInput-notchedOutline": {
                borderColor: "primary.main",
              },
            }}
            MenuProps={{
              slotProps: {
                root: {
                  sx: {
                    "& .MuiBackdrop-root": { userSelect: "none" },
                    "& .MuiMenuItem-root": { minHeight: 36 },
                  },
                },
              },
            }}
            inputProps={{ "aria-label": "Language Model" }}
          >
            {MODELS.map(({ label, provider, model, fast, reason }) => (
              <MenuItem
                key={model}
                value={model}
                onClick={() => setFormData({ provider, model })}
              >
                <ListItemIcon>
                  <ViewHeadline fontSize="small" />
                </ListItemIcon>
                <ListItemText>{label}</ListItemText>
                {fast && (
                  <Badge
                    color="success"
                    badgeContent="Fast"
                    sx={{
                      ml: 1,
                      "& .MuiBadge-badge": {
                        position: "static",
                        transform: "none",
                      },
                    }}
                  />
                )}
                {reason && (
                  <Badge
                    color="warning"
                    badgeContent="Reason"
                    sx={{
                      ml: 1,
                      "& .MuiBadge-badge": {
                        position: "static",
                        transform: "none",
                      },
                    }}
                  />
                )}
              </MenuItem>
            ))}
          </Select>
        </Box>
      </DialogContent>
      <DialogActions>
        <Button autoFocus onClick={handleClose}>
          Cancel
        </Button>
        <Button onClick={handleSubmit}>Save</Button>
      </DialogActions>
    </Dialog>
  );
}

export default memo(AIDialog);
