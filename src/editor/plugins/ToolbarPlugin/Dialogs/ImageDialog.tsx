"use client"
import { $getSelection, $setSelection, LexicalEditor } from 'lexical';
import { INSERT_IMAGE_COMMAND, InsertImagePayload } from '@/editor/plugins/ImagePlugin';
import { useEffect, useState, memo } from 'react';

import Compressor from 'compressorjs';
import { ImageNode } from '@/editor/nodes/ImageNode';
import { SET_DIALOGS_COMMAND } from './commands';
import { getImageDimensions } from '@/editor/nodes/utils';
import useFixedBodyScroll from '@/hooks/useFixedBodyScroll';
import { useTheme } from '@mui/material/styles';
import { Box, Button, Dialog, DialogActions, DialogContent, DialogTitle, FormControlLabel, Switch, TextField, Typography, useMediaQuery } from '@mui/material';
import { UploadFile } from '@mui/icons-material';

function ImageDialog({ editor, node, open }: { editor: LexicalEditor, node: ImageNode | null; open: boolean; }) {
  const theme = useTheme();
  const fullScreen = useMediaQuery(theme.breakpoints.down('md'));
  const [formData, setFormData] = useState<InsertImagePayload>({ src: '', altText: '', width: 0, height: 0, showCaption: true });

  useEffect(() => {
    if (!open) return;
    if (node) {
      setFormData({ src: node.getSrc(), altText: node.getAltText(), width: node.getWidth(), height: node.getHeight(), showCaption: node.getShowCaption() });
    } else {
      setFormData({ src: '', altText: '', width: 0, height: 0, showCaption: true });
    }
  }, [node, open]);

  const updateFormData = async (event: any) => {
    const { name, value } = event.target;
    if (name === 'src') {
      try {
        const dimensions = await getImageDimensions(value);
        setFormData({ ...formData, ...dimensions, [name]: value });
      } catch (e) {
        setFormData({ ...formData, [name]: value });
      }
    } else if (name === 'showCaption') {
      setFormData({ ...formData, [name]: event.target.checked });
    } else {
      setFormData({ ...formData, [name]: value });
    }
  };

  const loadImage = (files: FileList | null) => {
    const reader = new FileReader();
    reader.onload = async function () {
      if (typeof reader.result === 'string') {
        try {
          const dimensions = await getImageDimensions(reader.result);
          setFormData({ src: reader.result, altText: files![0].name.replace(/\.[^/.]+$/, ""), ...dimensions, showCaption: true });
        } catch (e) {
          setFormData({ ...formData, src: reader.result, altText: files![0].name.replace(/\.[^/.]+$/, ""), showCaption: true });
        }
      }
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
  };

  const closeDialog = () => {
    editor.dispatchCommand(SET_DIALOGS_COMMAND, { image: { open: false } })
  }

  const restoreSelection = () => {
    editor.getEditorState().read(() => {
      const selection = $getSelection()?.clone() ?? null;
      editor.update(() => $setSelection(selection));
    })
  }

  const handleSubmit = async () => {
    insertImage(formData);
    closeDialog();
    setTimeout(() => { editor.focus() }, 0);
  };

  const handleClose = () => {
    closeDialog();
    restoreSelection();
  }

  useFixedBodyScroll(open);

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
        <Typography variant="h6" sx={{ mt: 1 }}>From File</Typography>
        <Button variant="outlined" sx={{ my: 2 }} startIcon={<UploadFile />} component="label">
          Upload File
          <input type="file" hidden accept="image/*" onChange={e => loadImage(e.target.files)} autoFocus />
        </Button>
        <TextField margin="normal" size="small" fullWidth value={formData.altText} onChange={updateFormData} label="Alt Text" name="altText" autoComplete="altText" />
        <TextField margin="normal" size="small" fullWidth value={formData.width} onChange={updateFormData} label="Width" name="width" autoComplete="width" />
        <TextField margin="normal" size="small" fullWidth value={formData.height} onChange={updateFormData} label="Height" name="height" autoComplete="height" />
        <FormControlLabel control={<Switch checked={formData.showCaption} onChange={updateFormData} />} label="Show Caption" name="showCaption" />
      </Box>
    </DialogContent>
    <DialogActions>
      <Button onClick={handleClose}>
        Cancel
      </Button>
      <Button
        disabled={isDisabled}
        onClick={handleSubmit}>
        Confirm
      </Button>
    </DialogActions>
  </Dialog>;
}

export default memo(ImageDialog);