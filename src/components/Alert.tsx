import Button from '@mui/material/Button';
import Dialog from '@mui/material/Dialog';
import DialogActions from '@mui/material/DialogActions';
import DialogContent from '@mui/material/DialogContent';
import DialogContentText from '@mui/material/DialogContentText';
import DialogTitle from '@mui/material/DialogTitle';
import { useSelector, useDispatch } from 'react-redux';
import { useNavigate } from 'react-router-dom';

import { actions } from '../slices';
import { RootState } from '../store';


export default function AlertDialog() {
  const alert = useSelector((state: RootState) => state.app.ui.alerts[0]);
  const dispatch = useDispatch();
  const navigate = useNavigate();

  const handleClose = () => dispatch(actions.app.clearAlert());
  const handleConfirm = () => {
    const serializedAction = alert?.action;
    if (serializedAction) {
      // eslint-disable-next-line no-new-func
      const action = new Function("dispatch", "actions", "navigate", serializedAction);
      action.bind(null, dispatch, actions, navigate)();
    }
    dispatch(actions.app.clearAlert());
  }

  if(!alert) return null;
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
