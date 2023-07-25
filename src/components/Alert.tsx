"use client"
import { useRouter } from 'next/navigation';
import Button from '@mui/material/Button';
import Dialog from '@mui/material/Dialog';
import DialogActions from '@mui/material/DialogActions';
import DialogContent from '@mui/material/DialogContent';
import DialogContentText from '@mui/material/DialogContentText';
import DialogTitle from '@mui/material/DialogTitle';
import { useSelector, useDispatch } from 'react-redux';

import { actions, RootState } from '../store';

export default function AlertDialog() {
  const alert = useSelector((state: RootState) => state.alerts[0]);
  const dispatch = useDispatch();
  const router = useRouter();
  const navigate = (path: string) => router.push(path);

  const handleClose = () => dispatch(actions.clearAlert());
  const handleConfirm = () => {
    const serializedAction = alert?.action;
    if (serializedAction) {
      const action = new Function("dispatch", "actions", "navigate", serializedAction);
      action.bind(null, dispatch, actions, navigate)();
    }
    dispatch(actions.clearAlert());
  }

  if (!alert) return null;
  return (
    <Dialog open onClose={handleClose}>
      <DialogTitle>{alert.title}</DialogTitle>
      <DialogContent>
        <DialogContentText>{alert.content}</DialogContentText>
      </DialogContent>
      <DialogActions>
        <Button onClick={handleClose}>Cancel</Button>
        <Button onClick={handleConfirm} autoFocus>OK</Button>
      </DialogActions>
    </Dialog>
  );
}
