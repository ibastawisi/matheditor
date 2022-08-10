import Box from '@mui/material/Box';
import { useDispatch, useSelector } from 'react-redux';
import { actions } from '../slices';
import { AppDispatch, RootState } from '../store';
import { useEffect, useState } from 'react';
import useTheme from '@mui/material/styles/useTheme';
import Button from '@mui/material/Button';
import Dialog from '@mui/material/Dialog';
import DialogActions from '@mui/material/DialogActions';
import DialogContent from '@mui/material/DialogContent';
import DialogTitle from '@mui/material/DialogTitle';
import useMediaQuery from '@mui/material/useMediaQuery';
import FormControlLabel from '@mui/material/FormControlLabel';
import Switch from '@mui/material/Switch';
import UserCard from './UserCard';

export default function SettingsDialog({ open, onClose }: { open: boolean; onClose: () => void; }) {
  const theme = useTheme();
  const fullScreen = useMediaQuery(theme.breakpoints.down('md'));
  const dispatch = useDispatch<AppDispatch>();
  const config = useSelector((state: RootState) => state.app.config);
  const user = useSelector((state: RootState) => state.app.user);

  const [formData, setFormData] = useState(config);

  useEffect(() => {
    setFormData(config);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  const updateSwitchFormData = (event: any) => {
    const { name, checked } = event.target;
    const [parentKey, childKey]: [keyof typeof formData, string] = name.split('.');
    setFormData({ ...formData, [parentKey]: { ...formData[parentKey], [childKey]: checked } });
  };

  const handleSubmit = (event: React.FormEvent<HTMLFormElement> | React.MouseEvent<HTMLButtonElement>) => {
    event.preventDefault();
    dispatch(actions.app.setConfig(formData));
    onClose();
  };

  return (
    <Dialog
      fullScreen={fullScreen}
      open={open}
      onClose={onClose}
      aria-labelledby="responsive-dialog-title"
    >
      <DialogTitle id="responsive-dialog-title">
        {"Editor Configuration"}
      </DialogTitle>
      <DialogContent>
        <UserCard user={user} />
        <Box component="form" onSubmit={handleSubmit} noValidate sx={{ mt: 1 }}>
          <FormControlLabel control={<Switch name='editor.debug' checked={formData.editor.debug} onChange={updateSwitchFormData} />} label="Show Debug View" />
        </Box>
      </DialogContent>
      <DialogActions>
        <Button autoFocus onClick={onClose}>
          Cancel
        </Button>
        <Button onClick={handleSubmit}>
          Save
        </Button>
      </DialogActions>
    </Dialog>
  );
}
