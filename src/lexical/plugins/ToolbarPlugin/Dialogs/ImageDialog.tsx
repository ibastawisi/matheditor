import { LexicalEditor } from 'lexical';
import { INSERT_IMAGE_COMMAND, InsertImagePayload } from '../../ImagePlugin';
import UploadFileIcon from '@mui/icons-material/UploadFile';
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
import { ImageNode } from '../../../nodes/ImageNode';
import { useSelector, useDispatch } from 'react-redux';
import { actions, RootState } from '../../../../store';
import DialogTitle from '@mui/material/DialogTitle';

export default function useImageDialog({ editor, node }: { editor: LexicalEditor, node: ImageNode | null; }) {
  const theme = useTheme();
  const fullScreen = useMediaQuery(theme.breakpoints.down('md'));
  const [formData, setFormData] = useState({ src: '', altText: '' });
  const open = useSelector((state: RootState) => state.app.ui.dialogs.image.open);
  const dispatch = useDispatch();
  const closeDialog = () => dispatch(actions.app.setDialogs({ image: { open: false } }));

  useEffect(() => {
    if (node) {
      setFormData({ src: node.getSrc(), altText: node.getAltText() });
    } else {
      setFormData({ src: '', altText: '' });
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
        setFormData({ src: reader.result, altText: files![0].name.replace(/\.[^/.]+$/, "") });
      }
      return '';
    };
    if (files !== null) {
      new Compressor(files[0], {
        quality: 0.6,
        mimeType: 'image/jpeg',
        success(result: File) {
          reader.readAsDataURL(result);
        },
        error(err: Error) {
          console.log(err.message);
          reader.readAsDataURL(files[0]);
        },
      });
    }
  };

  const isDisabled = formData.src === '';

  const insertImage = (payload: InsertImagePayload) => {
    if (!node) editor.dispatchCommand(INSERT_IMAGE_COMMAND, payload,);
    else editor.update(() => node.update(payload));
    handleClose();
  };

  const handleClose = () => {
    closeDialog();
    setFormData({ src: '', altText: '' });
    setTimeout(() => { editor.focus(); }, 0);
  }


  return <Dialog
    open={!!open}
    fullScreen={fullScreen}
    onClose={handleClose}
    aria-labelledby="image-dialog-title"
    disableEscapeKeyDown
  >
    <DialogTitle id="image-dialog-title">
      Insert Image
    </DialogTitle>
    <DialogContent>
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
    </DialogContent>
    <DialogActions>
      <Button onClick={handleClose}>
        Cancel
      </Button>
      <Button
        disabled={isDisabled}
        onClick={() => insertImage(formData)}>
        Confirm
      </Button>
    </DialogActions>
  </Dialog>;
}
