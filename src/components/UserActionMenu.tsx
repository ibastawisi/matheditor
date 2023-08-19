"use client"
import * as React from 'react';
import { CheckHandleResponse, User } from '@/types';
import { useDispatch, actions } from '@/store';
import IconButton from '@mui/material/IconButton';
import { useState } from 'react';
import Dialog from '@mui/material/Dialog';
import DialogTitle from '@mui/material/DialogTitle';
import DialogContent from '@mui/material/DialogContent';
import Button from '@mui/material/Button';
import DialogActions from '@mui/material/DialogActions';
import TextField from '@mui/material/TextField';
import SettingsIcon from '@mui/icons-material/Settings';
import { useRouter, usePathname } from 'next/navigation';
import { useFormik } from 'formik';
import * as yup from 'yup';

function UserActionMenu({ user }: { user: User }): JSX.Element {
  const dispatch = useDispatch();
  const [editDialogOpen, setEditDialogOpen] = useState(false);

  const router = useRouter();
  const navigate = (path: string) => router.push(path);
  const pathname = usePathname();

  const openEditDialog = () => {
    setEditDialogOpen(true);
  };

  const closeEditDialog = () => {
    setEditDialogOpen(false);
  };

  const checkHandle = async (value: string) => {
    const response = await fetch(`/api/users/check?handle=${value}`);
    const { data, error } = await response.json() as CheckHandleResponse;
    if (error) return false;
    return !!data;
  }

  const validationSchema = yup.object({
    handle: yup
      .string()
      .required('Handle is required')
      .min(3, 'Handle must be at least 3 characters')
      .max(20, 'Handle must be at most 20 characters')
      .matches(/^[a-zA-Z0-9-]*$/, 'Handle must only contain letters, numbers, and dashes')
      .test('is-unique', 'Handle is already taken', async (value) => {
        if (!value) return true;
        if (value === user?.handle) return true;
        return await checkHandle(value);
      }),
  });

  const formik = useFormik({
    initialValues: {
      handle: user?.handle || "",
    },
    validationSchema: validationSchema,
    onSubmit: async (values) => {
      const shouldNavigate = pathname === `/user/${user.handle || user.id}`;
      const partial: Partial<User> = {
        handle: values.handle,
      };
      const result = await dispatch(actions.updateUser({ id: user.id, partial }));
      if (result.type === actions.updateUser.fulfilled.type) {
        closeEditDialog();
        if (shouldNavigate) navigate(`/user/${values.handle || user.id}`);
      }
    },
  });

  return (
    <>
      <IconButton
        id="user-action-button"
        aria-label='User Actions'
        onClick={openEditDialog}
        size="small"
        sx={{ ml: "auto !important" }}
      >
        <SettingsIcon />
      </IconButton>
      <Dialog open={editDialogOpen} onClose={closeEditDialog} fullWidth maxWidth="xs">
        <form onSubmit={formik.handleSubmit} noValidate autoComplete="off">
          <DialogTitle>Edit User</DialogTitle>
          <DialogContent>
            <TextField margin="normal" size="small" fullWidth
              id="handle"
              label="User Handle"
              name="handle"
              autoFocus
              value={formik.values.handle}
              onChange={formik.handleChange}
              onBlur={formik.handleBlur}
              error={!!formik.errors.handle}
              helperText={formik.errors.handle ?? `https://matheditor.me/user/${formik.values.handle || user.id}`}
            />
          </DialogContent>
          <DialogActions>
            <Button onClick={closeEditDialog}>Cancel</Button>
            <Button type='submit'>Save</Button>
          </DialogActions>
        </form>
      </Dialog>
    </>
  );
}

export default UserActionMenu;