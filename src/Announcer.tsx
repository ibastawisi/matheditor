import { useDispatch, useSelector } from 'react-redux';
import { actions } from './slices';
import { RootState } from './store';
import Snackbar from '@mui/material/Snackbar';
import Button from '@mui/material/Button';
import React from 'react';
import IconButton from '@mui/material/IconButton';
import CloseIcon from '@mui/icons-material/Close';

export interface Announcement {
  message: string;
  action?: {
    label: string
    onClick: string
  }
  timeout?: number
}

function Announcer() {
  const announcement = useSelector((state: RootState) => state.app.announcement);
  const dispatch = useDispatch()

  const handleClose = () => dispatch(actions.app.clearAnnouncement());
  const handleClick = () => {
    // eslint-disable-next-line no-eval
    announcement?.action && eval(announcement?.action.onClick);
    dispatch(actions.app.clearAnnouncement());
  }

  return <Snackbar
    open={announcement !== null}
    autoHideDuration={announcement?.timeout ?? 3000}
    onClose={handleClose}
    message={announcement?.message}
    action={announcement?.action ?
      <React.Fragment>
        <Button color="secondary" size="small" onClick={handleClick}>
          {announcement?.action?.label}
        </Button>
        <IconButton size="small" aria-label="close" color="inherit" onClick={handleClose}>
          <CloseIcon fontSize="small" />
        </IconButton>
      </React.Fragment>
      : null}
  />
}

export default Announcer;