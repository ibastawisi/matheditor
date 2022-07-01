import { InsertImagePayload } from '../ImagesPlugin';
import { INSERT_IMAGE_COMMAND } from '../ImagesPlugin';
import UploadFileIcon from '@mui/icons-material/UploadFile';
import { LexicalEditor } from 'lexical';
import Box from '@mui/material/Box';
import { useState } from 'react';
import useTheme from '@mui/material/styles/useTheme';
import Button from '@mui/material/Button';
import Dialog from '@mui/material/Dialog';
import DialogActions from '@mui/material/DialogActions';
import DialogContent from '@mui/material/DialogContent';
import DialogTitle from '@mui/material/DialogTitle';
import useMediaQuery from '@mui/material/useMediaQuery';
import TextField from '@mui/material/TextField/TextField';

export default function InsertImageDialog({ editor, open, onClose }: { editor: LexicalEditor; open: boolean; onClose: () => void; }) {
  const theme = useTheme();
  const fullScreen = useMediaQuery(theme.breakpoints.down('md'));
  const [mode, setMode] = useState<null | 'url' | 'file'>(null);

  const [formData, setFormData] = useState({ src: '', altText: '' });

  const updateFormData = (event: any) => {
    const { name, value } = event.target;
    setFormData({ ...formData, [name]: value });
  };

  const loadImage = (files: FileList | null) => {
    const reader = new FileReader();
    reader.onload = function () {
      if (typeof reader.result === 'string') {
        setFormData({ src: reader.result , altText: files![0].name });
      }
      return '';
    };
    if (files !== null) {
      reader.readAsDataURL(files[0]);
    }
  };

  const isDisabled = formData.src === '';

  const onClick = (payload: InsertImagePayload) => {
    editor.dispatchCommand(INSERT_IMAGE_COMMAND, payload);
    handleClose();
  };

  const handleClose = () => {
    setMode(null);
    setFormData({ src: '', altText: '' });
    onClose();
  }

  return (
    <Dialog
      open={open}
      fullScreen={fullScreen}
      onClose={handleClose}
      aria-labelledby="responsive-dialog-title"
    >
      <DialogTitle id="responsive-dialog-title">
        Insert Image
      </DialogTitle>
      <DialogContent>
        <Box component="form" noValidate sx={{ mt: 1 }}>
          {!mode ?
            <div className="ToolbarPlugin__dialogButtonsList">
              <Button
                onClick={() => setMode('url')}>
                From URL
              </Button>
              <Button
                onClick={() => setMode('file')}>
                From File
              </Button>
            </div>
            :
            <>
              {mode === 'url' && <TextField type="url" margin="normal" size="small" fullWidth
                value={formData.src} onChange={updateFormData} label="Image URL" name="src" autoComplete="src" autoFocus />}
              {mode === 'file' && <Button variant="outlined" startIcon={<UploadFileIcon />} component="label">
                Upload File
                <input type="file" hidden accept="image/*" onChange={e => loadImage(e.target.files)} autoFocus />
              </Button>}

              <TextField margin="normal" size="small" fullWidth value={formData.altText} onChange={updateFormData} label="Alt Text" name="altText" autoComplete="altText" />
            </>}
        </Box>
      </DialogContent>
      <DialogActions>
        <Button onClick={handleClose}>
          Cancel
        </Button>
        <Button
          disabled={isDisabled}
          onClick={() => onClick(formData)}>
          Confirm
        </Button>
      </DialogActions>
    </Dialog>
  );
}
