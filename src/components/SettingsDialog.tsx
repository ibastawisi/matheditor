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
import Accordion from '@mui/material/Accordion';
import AccordionSummary from '@mui/material/AccordionSummary';
import AccordionDetails from '@mui/material/AccordionDetails';
import Typography from '@mui/material/Typography';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';

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
    const [parentKey, childKey]: [keyof typeof formData, string] = name.split('.');
    setFormData({ ...formData, [parentKey]: { ...formData[parentKey], [childKey]: value } });
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
          <TextField margin="normal" size="small" fullWidth id="author" value={config.editor.author} onChange={updateFormData} label="Author Name" name="editor.author" autoComplete="author" autoFocus />
          <Accordion>
            <AccordionSummary expandIcon={<ExpandMoreIcon />}>
              <Typography>Header</Typography>
            </AccordionSummary>
            <AccordionDetails>
              <FormControl fullWidth margin="normal" size="small">
                <InputLabel id="headerLevel-label">Header Level</InputLabel>
                <Select labelId="headerLevel-label" name="header.level" value={formData.header.level} onChange={updateFormData} label="Header Level">
                  <MenuItem value={1}>1</MenuItem>
                  <MenuItem value={2}>2</MenuItem>
                  <MenuItem value={3}>3</MenuItem>
                  <MenuItem value={4}>4</MenuItem>
                  <MenuItem value={5}>5</MenuItem>
                  <MenuItem value={6}>6</MenuItem>
                </Select>
              </FormControl>
              <FormControl fullWidth margin="normal" size="small">
                <InputLabel id="headerAlignment-label">Header Alignment</InputLabel>
                <Select labelId="headerAlignment-label" name="header.alignment" value={formData.header.alignment} onChange={updateFormData} label="Header Alignment">
                  <MenuItem value="left">Left</MenuItem>
                  <MenuItem value="center">Center</MenuItem>
                  <MenuItem value="right">Right</MenuItem>
                </Select>
              </FormControl>
            </AccordionDetails>
          </Accordion>
          <Accordion>
            <AccordionSummary expandIcon={<ExpandMoreIcon />}>
              <Typography>Paragraph</Typography>
            </AccordionSummary>
            <AccordionDetails>
              <FormControl fullWidth margin="normal" size="small">
                <InputLabel id="ParagraphAlignment-label">Paragraph Alignment</InputLabel>
                <Select labelId="ParagraphAlignment-label" name="paragraph.alignment" value={formData.paragraph.alignment} onChange={updateFormData} label="Paragraph Alignment">
                  <MenuItem value="left">Left</MenuItem>
                  <MenuItem value="center">Center</MenuItem>
                  <MenuItem value="right">Right</MenuItem>
                </Select>
              </FormControl>
            </AccordionDetails>
          </Accordion>
          <Accordion>
            <AccordionSummary expandIcon={<ExpandMoreIcon />}>
              <Typography>Math Block</Typography>
            </AccordionSummary>
            <AccordionDetails>
              <FormControl fullWidth margin="normal" size="small">
                <InputLabel id="MathMode-label">Math Mode</InputLabel>
                <Select labelId="MathMode-label" name="math.mode" value={formData.math.mode} onChange={updateFormData} label="Math Mode">
                  <MenuItem value="math">Math</MenuItem>
                  <MenuItem value="inline-math">Inline Math</MenuItem>
                  <MenuItem value="text">Text</MenuItem>
                </Select>
              </FormControl>
              <FormControl fullWidth margin="normal" size="small">
                <InputLabel id="MathAlignment-label">Math Alignment</InputLabel>
                <Select labelId="MathAlignment-label" name="math.alignment" value={formData.math.alignment} onChange={updateFormData} label="Math Alignment">
                  <MenuItem value="left">Left</MenuItem>
                  <MenuItem value="center">Center</MenuItem>
                  <MenuItem value="right">Right</MenuItem>
                </Select>
              </FormControl>
            </AccordionDetails>
          </Accordion>
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
