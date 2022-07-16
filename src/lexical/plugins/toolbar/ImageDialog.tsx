import { InsertImagePayload } from '../ImagePlugin';
import { INSERT_IMAGE_COMMAND } from '../ImagePlugin';
import UploadFileIcon from '@mui/icons-material/UploadFile';
import { LexicalEditor } from 'lexical';
import Box from '@mui/material/Box';
import { useEffect, useState } from 'react';
import useTheme from '@mui/material/styles/useTheme';
import Button from '@mui/material/Button';
import Dialog from '@mui/material/Dialog';
import DialogActions from '@mui/material/DialogActions';
import DialogContent from '@mui/material/DialogContent';
import useMediaQuery from '@mui/material/useMediaQuery';
import TextField from '@mui/material/TextField/TextField';
import Typography from '@mui/material/Typography';

import Compressor from 'compressorjs';
import { ImageNode } from '../../nodes/ImageNode';

export enum ImageDialogMode {
  create,
  update,
}

export default function ImageDialog({ editor, node, mode, open, onClose }: { editor: LexicalEditor; node?: ImageNode; mode: ImageDialogMode; open: boolean; onClose: () => void; }) {
  const theme = useTheme();
  const fullScreen = useMediaQuery(theme.breakpoints.down('md')) || mode === ImageDialogMode.update;

  const [formData, setFormData] = useState({ src: '', altText: '' });

  useEffect(() => {
    if (node) {
      setFormData({ src: node.getSrc(), altText: node.getAltText() });
    }
  }, [node]);

  const updateFormData = (event: any) => {
    const { name, value } = event.target;
    setFormData({ ...formData, [name]: value });
  };

  const loadImage = (files: FileList | null) => {
    const reader = new FileReader();
    reader.onload = function () {
      if (typeof reader.result === 'string') {
        setFormData({ src: reader.result, altText: "" });
      }
      return '';
    };
    if (files !== null) {
      new Compressor(files![0], {
        quality: 0.6,
        success(result: File) {
          reader.readAsDataURL(result);
        },
        error(err: Error) {
          console.log(err.message);
        },
      });
    }
  };

  const isDisabled = formData.src === '';

  const onClick = (payload: InsertImagePayload) => {
    editor.dispatchCommand(INSERT_IMAGE_COMMAND, payload);
    handleClose();
  };

  const handleClose = () => {
    setFormData({ src: '', altText: '' });
    onClose();
  }

  
  if (!open) return null;

  return (
    <Dialog
      open={open}
      fullScreen={fullScreen}
      onClose={handleClose}
      aria-labelledby="responsive-dialog-title"
    >
      <DialogContent>
        {mode === ImageDialogMode.create &&
          <Box component="form" noValidate sx={{ mt: 1 }}>
            <Typography variant="h6" sx={{ mt: 1 }}>From URL</Typography>
            <TextField type="url" margin="normal" size="small" fullWidth
              value={formData.src} onChange={updateFormData} label="Image URL" name="src" autoComplete="src" autoFocus />
            <TextField margin="normal" size="small" fullWidth value={formData.altText} onChange={updateFormData} label="Alt Text" name="altText" autoComplete="altText" />
            <Typography variant="h6" sx={{ mt: 1 }}>From File</Typography>
            <Button variant="outlined" sx={{ my: 2 }} startIcon={<UploadFileIcon />} component="label">
              Upload File
              <input type="file" hidden accept="image/*" onChange={e => loadImage(e.target.files)} autoFocus />
            </Button>
          </Box>
        }
        {mode === ImageDialogMode.update &&
          <></>
        }
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
