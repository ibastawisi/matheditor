"use client"
import { $getNodeByKey, NodeKey } from 'lexical';
import { useLexicalComposerContext } from '@lexical/react/LexicalComposerContext';
import { useEffect, useState, memo } from 'react';
import { isMimeType, mediaFileReader } from '@lexical/utils';
import { INSERT_IMAGE_COMMAND } from './commands';
import { $isImageNode } from './nodes';
import type { ImagePayload } from './types';
import { getImageDimensions } from './utils';
import { setOpenDialog } from '@/editor/extensions/store';
import { useTheme } from '@mui/material/styles';
import { Box, Button, Dialog, DialogActions, DialogContent, DialogTitle, FormControlLabel, Switch, TextField, Typography, useMediaQuery } from '@mui/material';
import { UploadFile } from '@mui/icons-material';
import { ANNOUNCE_COMMAND } from '@/editor/commands';

const ACCEPTABLE_IMAGE_TYPES = [
  'image/',
  'image/heic',
  'image/heif',
  'image/gif',
  'image/webp',
];

const DEFAULT_PAYLOAD: ImagePayload = { src: '', altText: '', width: 0, height: 0, showCaption: true };

function ImageDialog({ nodeKey }: { nodeKey: NodeKey | null; }) {
  const [editor] = useLexicalComposerContext();
  const theme = useTheme();
  const fullScreen = useMediaQuery(theme.breakpoints.down('md'));
  const [formData, setFormData] = useState<ImagePayload>(DEFAULT_PAYLOAD);

  useEffect(() => {
    const payload = editor.read(() => {
      const node = nodeKey ? $getNodeByKey(nodeKey) : null;
      if (!$isImageNode(node)) return DEFAULT_PAYLOAD;
      return {
        src: node.getSrc(),
        altText: node.getAltText(),
        width: node.getWidth(),
        height: node.getHeight(),
        showCaption: node.getShowCaption(),
      };
    });
    setFormData(payload);
  }, [editor, nodeKey]);

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

  const loadImage = async (files: FileList | null) => {
    if (!files || files.length === 0) return;
    const filesResult = await mediaFileReader(
      [...files],
      [ACCEPTABLE_IMAGE_TYPES].flatMap((x) => x),
    );
    for (const { file, result } of filesResult) {
      if (isMimeType(file, ACCEPTABLE_IMAGE_TYPES)) {
        try {
          const dimensions = await getImageDimensions(result);
          setFormData({ ...formData, src: result, altText: files![0].name.replace(/\.[^/.]+$/, ""), ...dimensions });
        } catch (e) {
          setFormData({ ...formData, src: result, altText: files![0].name.replace(/\.[^/.]+$/, "") });
        }
      } else {
        editor.dispatchCommand(ANNOUNCE_COMMAND, { message: { title: "Uploading image failed", subtitle: "Unsupported file type" } });
      }
    }
  };

  const isDisabled = formData.src === '';

  const insertImage = (payload: ImagePayload) => {
    const node = editor.read(() => nodeKey ? $getNodeByKey(nodeKey) : null);
    if (!$isImageNode(node)) editor.dispatchCommand(INSERT_IMAGE_COMMAND, payload);
    else editor.update(() => node.update(payload));
  };

  const closeDialog = () => {
    setOpenDialog(editor, null);
  }

  const handleSubmit = async () => {
    insertImage({ ...formData, width: Number(formData.width) || 0, height: Number(formData.height) || 0 });
    closeDialog();
  };

  const handleClose = () => {
    closeDialog();
  }

  return <Dialog
    open
    fullScreen={fullScreen}
    onClose={(_, reason) => { if (reason !== 'escapeKeyDown') handleClose(); }}
    aria-labelledby="image-dialog-title"
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