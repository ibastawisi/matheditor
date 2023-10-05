"use client"
import { useRouter } from 'next/navigation';
import { useDispatch, useSelector, actions } from '@/store';
import useFixedBodyScroll from '@/hooks/useFixedBodyScroll';
import { Dialog, DialogTitle, DialogContent, DialogContentText, DialogActions, Button } from '@mui/material';
import { signIn } from 'next-auth/react';

export default function AlertDialog() {
  const alert = useSelector(state => state.alerts[0]);
  const dispatch = useDispatch();
  const router = useRouter();
  const navigate = (path: string) => router.push(path);
  const login = () => signIn("google", undefined, { prompt: "select_account" });

  const handleClose = () => dispatch(actions.clearAlert());
  const handleConfirm = () => {
    const serializedAction = alert?.action;
    if (serializedAction) {
      const action = new Function("dispatch", "actions", "navigate", "login", serializedAction);
      action.bind(null, dispatch, actions, navigate, login)();
    }
    dispatch(actions.clearAlert());
  }

  useFixedBodyScroll(!!alert);
  
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
