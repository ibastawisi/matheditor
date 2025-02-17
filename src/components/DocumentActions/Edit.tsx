"use client"
import { useDispatch, actions, useSelector } from "@/store";
import { UserDocument, CheckHandleResponse, DocumentUpdateInput, User } from "@/types";
import { CloudOff, Settings } from "@mui/icons-material";
import { IconButton, Dialog, DialogTitle, DialogContent, DialogActions, Button, FormControlLabel, Checkbox, FormHelperText, useMediaQuery, ListItemIcon, ListItemText, MenuItem, TextField, Box, Typography } from "@mui/material";
import { useCallback, useEffect, useState } from "react";
import { useTheme } from "@mui/material/styles";
import useFixedBodyScroll from "@/hooks/useFixedBodyScroll";
import { validate } from "uuid";
import { debounce } from '@mui/material/utils';
import UploadDocument from "./Upload";
import UsersAutocomplete from "../User/UsersAutocomplete";
import useOnlineStatus from "@/hooks/useOnlineStatus";

const EditDocument: React.FC<{ userDocument: UserDocument, variant?: 'menuitem' | 'iconbutton', closeMenu?: () => void }> = ({ userDocument, variant = 'iconbutton', closeMenu }) => {
  const dispatch = useDispatch();
  const user = useSelector(state => state.user);
  const isOnline = useOnlineStatus();
  const localDocument = userDocument?.local;
  const cloudDocument = userDocument?.cloud;
  const isLocal = !!localDocument;
  const isCloud = !!cloudDocument;
  const isUploaded = isLocal && isCloud;
  const isPublished = isCloud && cloudDocument.published;
  const isCollab = isCloud && cloudDocument.collab;
  const isPrivate = isCloud && cloudDocument.private;
  const isAuthor = isCloud ? cloudDocument.author.id === user?.id : true
  const id = userDocument.id;
  const name = cloudDocument?.name ?? localDocument?.name ?? "Untitled Document";
  const handle = cloudDocument?.handle ?? localDocument?.handle ?? null;
  const [input, setInput] = useState<Partial<DocumentUpdateInput>>({
    name,
    handle,
    coauthors: cloudDocument?.coauthors.map(u => u.email) ?? [],
    private: isPrivate,
    published: isPublished,
    collab: isCollab,
  });

  const [validating, setValidating] = useState(false);
  const [validationErrors, setValidationErrors] = useState<Record<string, string>>({});
  const hasErrors = Object.keys(validationErrors).length > 0;
  const [editDialogOpen, setEditDialogOpen] = useState(false);

  useEffect(() => {
    setInput({
      name,
      handle,
      coauthors: cloudDocument?.coauthors.map(u => u.email) ?? [],
      private: isPrivate,
      published: isPublished,
      collab: isCollab,
    });
    setValidating(false);
    setValidationErrors({});
  }, [userDocument, editDialogOpen]);

  const openEditDialog = () => {
    if (closeMenu) closeMenu();
    setEditDialogOpen(true);
  };

  const closeEditDialog = () => {
    setEditDialogOpen(false);
  };


  const updateInput = (partial: Partial<DocumentUpdateInput>) => {
    setInput(input => ({ ...input, ...partial }));
  }

  const updateCoauthors = (users: (User | string)[]) => {
    const coauthors = users.map(u => typeof u === "string" ? u : u.email);
    updateInput({ coauthors });
  }

  const updateHandle = (event: React.ChangeEvent<HTMLInputElement>) => {
    const value = event.target.value.toLowerCase().replace(/[^A-Za-z0-9\-_~:/?#\[\]@!$&'()*+,;=]/g, "-");
    updateInput({ handle: value });
    if (!value || value === handle) return setValidationErrors({});
    if (value.length < 3) {
      return setValidationErrors({ handle: "Handle is too short: Handle must be at least 3 characters long" });
    }
    if (!/^[a-zA-Z0-9-]+$/.test(value)) {
      return setValidationErrors({ handle: "Invalid Handle: Handle must only contain letters, numbers, and hyphens" });
    }
    if (validate(value)) {
      return setValidationErrors({ handle: "Invalid Handle: Handle must not be a UUID" });
    }
    setValidating(true);
    checkHandle(value);
  };

  const checkHandle = useCallback(debounce(async (handle: string) => {
    try {
      const response = await fetch(`/api/documents/check?handle=${handle}`);
      const { error } = await response.json() as CheckHandleResponse;
      if (error) setValidationErrors({ handle: `${error.title}: ${error.subtitle}` });
      else setValidationErrors({});
    } catch (error) {
      setValidationErrors({ handle: `Something went wrong: Please try again later` });
    }
    setValidating(false);
  }, 500), []);

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    closeEditDialog();
    const partial: Partial<DocumentUpdateInput> = {};
    if (input.name !== name) {
      partial.name = input.name;
      partial.updatedAt = new Date().toISOString();
    }
    if (input.handle !== handle) {
      partial.handle = input.handle || null;
    }
    if (input.coauthors?.join(",") !== cloudDocument?.coauthors.map(u => u.email).join(",")) {
      partial.coauthors = input.coauthors;
    }
    if (input.private !== isPrivate) {
      partial.private = input.private;
    }
    if (input.published !== isPublished) {
      partial.published = input.published;
    }
    if (input.collab !== isCollab) {
      partial.collab = input.collab;
    }
    if (Object.keys(partial).length === 0) return;
    if (isLocal) {
      try {
        dispatch(actions.updateLocalDocument({ id, partial }));
      } catch (err) {
        dispatch(actions.announce({
          message: {
            title: "Error Updating Document",
            subtitle: "An error occurred while updating local document"
          }
        }));
      }
    }
    if (isUploaded || isCloud) {
      await dispatch(actions.updateCloudDocument({ id, partial }));
    }
  };

  useFixedBodyScroll(editDialogOpen);
  const theme = useTheme();
  const fullScreen = useMediaQuery(theme.breakpoints.down('md'));

  return <>
    {variant === 'menuitem' ? <MenuItem onClick={openEditDialog}>
      <ListItemIcon><Settings /></ListItemIcon>
      <ListItemText>Edit</ListItemText>
    </MenuItem> : <IconButton aria-label="Edit Document" onClick={openEditDialog} size="small"><Settings /></IconButton>}
    <Dialog open={editDialogOpen} onClose={closeEditDialog} fullWidth maxWidth="xs" fullScreen={fullScreen}>
      <Box component="form" onSubmit={handleSubmit} noValidate autoComplete="off" spellCheck="false" sx={{ display: "flex", flexDirection: "column", justifyContent: "space-between", height: "100%" }}>
        <DialogTitle>Edit Document</DialogTitle>
        <DialogContent sx={{ "& .MuiFormHelperText-root": { overflow: "hidden", textOverflow: "ellipsis" } }}>
          <TextField margin="normal" size="small" fullWidth autoFocus
            label="Document Name"
            value={input.name || ""}
            onChange={e => updateInput({ name: e.target.value })}
            sx={{ '& .MuiInputBase-root': { height: 40 } }}
          />
          <TextField margin="normal" size="small" fullWidth
            label="Document Handle"
            disabled={!isOnline}
            value={input.handle || ""}
            onChange={updateHandle}
            error={!validating && !!validationErrors.handle}
            helperText={
              validating ? "Validating..."
                : validationErrors.handle ? validationErrors.handle
                  : input.handle ? `https://matheditor.me/view/${input.handle}`
                    : "This will be used in the URL of your document"
            }
          />
          {!cloudDocument && <Box sx={{ display: 'flex', flexDirection: "column", alignItems: "center", my: 1, gap: 1 }}>
            <FormHelperText>
              Save the document to cloud to unlock the following options
            </FormHelperText>
            <UploadDocument userDocument={userDocument} variant="button" />
          </Box>}
          {isAuthor && <UsersAutocomplete label='Coauthors' placeholder='Email' value={input.coauthors ?? []} onChange={updateCoauthors} sx={{ my: 2 }} disabled={!isOnline || !isCloud} />}
          {isAuthor && <FormControlLabel label="Private"
            control={<Checkbox checked={input.private} disabled={!isOnline || !isCloud} onChange={() => updateInput({ private: !input.private, published: input.published && input.private, collab: input.collab && input.private })} />}
          />}
          <FormHelperText>
            Private documents are only accessible to authors and coauthors.
          </FormHelperText>
          {isAuthor && <FormControlLabel label="Published"
            control={<Checkbox checked={input.published} disabled={!isOnline || !isCloud || input.private} onChange={() => updateInput({ published: !input.published })} />}
          />}
          <FormHelperText>
            Published documents are showcased on the homepage, can be forked by anyone, and can be found by search engines.
          </FormHelperText>
          {isAuthor && <FormControlLabel label="Collab"
            control={<Checkbox checked={input.collab} disabled={!isOnline || !isCloud || input.private} onChange={() => updateInput({ collab: !input.collab })} />}
          />}
          <FormHelperText>
            Collab documents are open for anyone to edit.
          </FormHelperText>
        </DialogContent>
        <DialogActions>
          <Button onClick={closeEditDialog}>Cancel</Button>
          <Button type='submit' disabled={validating || hasErrors}>Save</Button>
        </DialogActions>
      </Box>
    </Dialog>
  </>
}

export default EditDocument;