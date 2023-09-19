"use client"
import { useRouter } from 'next/navigation';
import { useDispatch, useSelector, actions } from '@/store';
import React from 'react';
import { Snackbar, Button, IconButton } from '@mui/material';
import { Close } from '@mui/icons-material';

function Announcer() {
  const announcement = useSelector(state => state.announcements[0]);
  const dispatch = useDispatch();
  const router = useRouter();
  const navigate = (path: string) => router.push(path);

  const handleClose = () => dispatch(actions.clearAnnouncement());
  const handleConfirm = () => {
    const serializedAction = announcement?.action?.onClick;
    if (serializedAction) {
      // eslint-disable-next-line no-new-func
      const action = new Function("dispatch", "actions", "navigate", serializedAction);
      action.bind(null, dispatch, actions, navigate)();
    }
    dispatch(actions.clearAnnouncement());
  }

  if (!announcement) return null;

  return <Snackbar
    open
    autoHideDuration={announcement.timeout ?? 3000}
    onClose={handleClose}
    message={announcement.message}
    action={announcement.action ?
      <React.Fragment>
        <Button color="secondary" size="small" onClick={handleConfirm}>
          {announcement.action.label}
        </Button>
        <IconButton size="small" aria-label="close" color="inherit" onClick={handleClose}>
          <Close fontSize="small" />
        </IconButton>
      </React.Fragment>
      : null}
  />
}

export default Announcer;