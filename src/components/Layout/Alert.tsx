"use client"
import { useSelector } from '@/store';
import useFixedBodyScroll from '@/hooks/useFixedBodyScroll';
import { Dialog, DialogTitle, DialogContent, DialogContentText, DialogActions, Button } from '@mui/material';

export default function AlertDialog() {
  const alert = useSelector(state => state.ui.alerts[0]);
  useFixedBodyScroll(!!alert);
  if (!alert) return null;

  return (
    <Dialog open>
      <DialogTitle>{alert.title}</DialogTitle>
      <DialogContent>
        <DialogContentText>{alert.content}</DialogContentText>
      </DialogContent>
      <DialogActions>
        {alert.actions.map(({ label, id }) => <Button key={id} id={id} autoFocus>{label}</Button>)}
      </DialogActions>
    </Dialog>
  );
}
