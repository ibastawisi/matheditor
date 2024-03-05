import useFixedBodyScroll from "@/hooks/useFixedBodyScroll";
import { UploadFile, ContentPaste } from "@mui/icons-material";
import { Dialog, DialogTitle, DialogContent, Button, TextField, LinearProgress, DialogActions } from "@mui/material";
import { $createParagraphNode, $createTextNode, $getSelection, $insertNodes, $isRootNode, LexicalEditor } from "lexical";
import { useState, useEffect, useCallback } from "react";
import Compressor from 'compressorjs';
import { SET_DIALOGS_COMMAND } from "./commands";
import { $insertNodeToNearestRoot, $wrapNodeInElement } from '@lexical/utils';

const OCRDialog = ({ open, editor }: { open: boolean, editor: LexicalEditor }) => {
  const [formData, setFormData] = useState({ value: "" });
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!open) return;
    setFormData({ value: "" });
  }, [open]);

  const updateFormData = async (event: any) => {
    const { name, value } = event.target;
    setFormData({ ...formData, [name]: value });
  };

  const handleFilesChange = useCallback(async (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (!files || files.length === 0) return;
    const file = files[0];
    event.target.value = '';
    new Compressor(file, {
      quality: 0.6,
      mimeType: 'image/jpeg',
      success(result: File) {
        updateValue(result);
      },
      error(err: Error) {
        console.error("Uploading image failed: " + "Unsupported file type");
      },
    });
  }, []);

  const ocr = useCallback(async (blob: Blob) => {
    try {
      const data = new FormData()
      data.append('file', blob)
      const response = await fetch("/fastapi/pix2text", {
        method: "POST",
        body: data,
      });
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      const result = await response.json();
      return result.generated_text;
    } catch (error: any) {
      console.error(`Something went wrong: ${error.message}`);
    }
  }, []);

  const updateValue = useCallback(async (blob: Blob) => {
    setLoading(true);
    const latex = await ocr(blob);
    setLoading(false);
    if (!latex) return;
    setFormData({ ...formData, value: latex });
  }, [formData]);

  const readFromClipboard = useCallback(async () => {
    try {
      window.focus();
      const clipboardItem = await navigator.clipboard.read()
      if (!clipboardItem) {
        throw new Error('Clipboard is empty')
      }
      const data = await clipboardItem[0].getType('image/png').catch(err => {
        throw new Error('Clipboard item is not an image')
      })
      updateValue(data)
    } catch (err) {
      console.error('Reading image failed: ' + err)
    }
  }, []);

  const closeDialog = () => {
    editor.dispatchCommand(SET_DIALOGS_COMMAND, { ocr: { open: false } })
  }

  const handleSubmit = async () => {
    const { value } = formData;
    editor.update(() => {
      const nodes = value.split('\n').map((line) => {
        const textNode = $createTextNode(line);
        const paragraphNode = $createParagraphNode().append(textNode);
        return paragraphNode;
      });
      $insertNodes(nodes)
    })
    closeDialog();
    setTimeout(() => { editor.focus() }, 0);
  };

  useFixedBodyScroll(open);

  return (
    <Dialog open={open} maxWidth="md" sx={{ '& .MuiDialog-paper': { width: '100%' } }}>
      <DialogTitle>Image to LaTeX</DialogTitle>
      <DialogContent>
        <Button variant="outlined" sx={{ my: 1, mr: 1 }} startIcon={<UploadFile />} component="label">
          Upload Image
          <input type="file" hidden accept="image/*" onChange={handleFilesChange} autoFocus />
        </Button>
        <Button variant="outlined" sx={{ my: 1 }} startIcon={<ContentPaste />} onClick={readFromClipboard}>
          Paste from Clipboard
        </Button>
        <TextField margin="normal" size="small" fullWidth multiline id="value" value={formData.value} onChange={updateFormData} label="Result" name="value" />
        {loading && <LinearProgress />}
      </DialogContent>
      <DialogActions>
        <Button onClick={closeDialog}>Cancel</Button>
        <Button type='submit' onClick={handleSubmit}>Save</Button>
      </DialogActions>
    </Dialog>
  )
}

export default OCRDialog;