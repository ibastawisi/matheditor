import { useDispatch, useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { actions, RootState } from '../store';
import Snackbar from '@mui/material/Snackbar';
import Button from '@mui/material/Button';
import React from 'react';
import IconButton from '@mui/material/IconButton';
import CloseIcon from '@mui/icons-material/Close';
import { updateSW } from '../main';

function Announcer() {
  const announcement = useSelector((state: RootState) => state.app.ui.announcements[0]);
  const dispatch = useDispatch();
  const navigate = useNavigate();

  const handleClose = () => dispatch(actions.app.clearAnnouncement());
  const handleConfirm = () => {
    const serializedAction = announcement?.action?.onClick;
    if (serializedAction) {
      // eslint-disable-next-line no-new-func
      const action = new Function("dispatch", "actions", "navigate", "updateSW", serializedAction);
      action.bind(null, dispatch, actions, navigate, updateSW)();
    }
    dispatch(actions.app.clearAnnouncement());
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
          <CloseIcon fontSize="small" />
        </IconButton>
      </React.Fragment>
      : null}
  />
}

export default Announcer;