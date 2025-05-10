"use client"
import * as React from 'react';
import { CheckHandleResponse, User } from '@/types';
import { useDispatch, actions } from '@/store';
import { useCallback, useEffect, useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import useFixedBodyScroll from '@/hooks/useFixedBodyScroll';
import { debounce } from '@mui/material/utils'
import { IconButton, Dialog, DialogTitle, DialogContent, TextField, DialogActions, Button } from '@mui/material';
import { Settings } from '@mui/icons-material';
import { validate } from 'uuid';
import useOnlineStatus from '@/hooks/useOnlineStatus';

function UserActionMenu({ user }: { user: User }) {
  const dispatch = useDispatch();
  const isOnline = useOnlineStatus();
  const router = useRouter();
  const navigate = (path: string) => router.push(path);
  const pathname = usePathname();

  const [input, setInput] = useState<Partial<User>>({ handle: user.handle });
  const [validating, setValidating] = useState(false);
  const [validationErrors, setValidationErrors] = useState<Record<string, string>>({});
  const hasErrors = Object.keys(validationErrors).length > 0;
  const [editDialogOpen, setEditDialogOpen] = useState(false);

  useEffect(() => {
    setInput({ handle: user.handle });
    setValidating(false);
    setValidationErrors({});
  }, [user, editDialogOpen]);
  
  const openEditDialog = () => {
    setEditDialogOpen(true);
  };

  const closeEditDialog = () => {
    setEditDialogOpen(false);
  };

  const updateInput = (partial: Partial<User>) => {
    setInput(input => ({ ...input, ...partial }));
  }

  const updateHandle = (event: React.ChangeEvent<HTMLInputElement>) => {
    const value = event.target.value.trim().toLowerCase().replace(/[^A-Za-z0-9]/g, "-");
    updateInput({ handle: value });
    if (!value || value === user.handle) return setValidationErrors({});
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
      const response = await fetch(`/api/users/check?handle=${handle}`);
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
    const shouldNavigate = pathname === `/user/${user.handle || user.id}`;
    const partial: Partial<User> = {};
    if (input.handle !== user.handle) partial.handle = input.handle || null;
    if (Object.keys(partial).length === 0) return;
    const result = await dispatch(actions.updateUser({ id: user.id, partial }));
    if (result.type === actions.updateUser.fulfilled.type) {
      if (shouldNavigate) navigate(`/user/${input.handle || user.id}`);
    }
  };

  useFixedBodyScroll(editDialogOpen);

  return (
    <>
      <IconButton
        id="user-action-button"
        aria-label='User Actions'
        onClick={openEditDialog}
        size="small"
      >
        <Settings />
      </IconButton>
      <Dialog open={editDialogOpen} onClose={closeEditDialog} fullWidth maxWidth="xs">
        <form onSubmit={handleSubmit} noValidate autoComplete="off" spellCheck="false">
          <DialogTitle>Edit User</DialogTitle>
          <DialogContent sx={{ "& .MuiFormHelperText-root": { overflow: "hidden", textOverflow: "ellipsis" } }}>
            <TextField margin="normal" size="small" fullWidth
              label="User Handle"
              disabled={!isOnline}
              value={input.handle || ""}
              onChange={updateHandle}
              error={!validating && !!validationErrors.handle}
              helperText={
                validating ? "Validating..."
                  : validationErrors.handle ? validationErrors.handle
                    : `https://matheditor.me/user/${input.handle || user.id}`
              }
            />
          </DialogContent>
          <DialogActions>
            <Button onClick={closeEditDialog}>Cancel</Button>
            <Button type='submit' disabled={validating || hasErrors}>Save</Button>
          </DialogActions>
        </form>
      </Dialog>
    </>
  );
}

export default UserActionMenu;