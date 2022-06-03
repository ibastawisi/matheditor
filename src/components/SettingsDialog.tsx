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
import DialogContentText from '@mui/material/DialogContentText';
import DialogTitle from '@mui/material/DialogTitle';
import useMediaQuery from '@mui/material/useMediaQuery';
import TextField from '@mui/material/TextField/TextField';
import FormControl from '@mui/material/FormControl';
import InputLabel from '@mui/material/InputLabel';
import Select from '@mui/material/Select';
import MenuItem from '@mui/material/MenuItem';

export default function SettingsDialog({ open, onClose }: { open: boolean; onClose: () => void; }) {
  const theme = useTheme();
  const fullScreen = useMediaQuery(theme.breakpoints.down('md'));
  const dispatch = useDispatch<AppDispatch>();
  const config = useSelector((state: RootState) => state.app.config);

  const [formData, setFormData] = useState(config);

  useEffect(() => {
    setFormData(config);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  const updateFormData = (event: any) => {
    const { name, value } = event.target;
    setFormData({ ...formData, [name]: value });
  };

  const handleSubmit = () => {
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
        <DialogContentText>
          Set the default configuration for the editor.
        </DialogContentText>

        <Box component="form" onSubmit={handleSubmit} noValidate sx={{ mt: 1 }}>
          <TextField margin="normal" size="small" fullWidth id="author" value={config.author} onChange={updateFormData} label="Author Name" name="author" autoComplete="author" autoFocus />
          <FormControl fullWidth margin="normal" size="small">
            <InputLabel id="defaultAlignment-label">Default Alignment</InputLabel>
            <Select labelId="defaultAlignment-label" name="defaultAlignment" value={formData.defaultAlignment} onChange={updateFormData} label="Default Alignment">
              <MenuItem value="left">Left</MenuItem>
              <MenuItem value="right">Right</MenuItem>
            </Select>
          </FormControl>
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
