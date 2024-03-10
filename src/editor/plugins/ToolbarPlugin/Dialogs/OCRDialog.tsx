import useFixedBodyScroll from "@/hooks/useFixedBodyScroll";
import { UploadFile, ContentPaste } from "@mui/icons-material";
import { Dialog, DialogTitle, DialogContent, Button, TextField, LinearProgress, DialogActions } from "@mui/material";
import { $createParagraphNode, $createTextNode, $insertNodes, LexicalEditor } from "lexical";
import { useState, useEffect, useCallback } from "react";
import Compressor from 'compressorjs';
import { SET_DIALOGS_COMMAND } from "./commands";
import { Announcement } from "@/types";
import { SET_ANNOUNCEMENT_COMMAND } from "@/editor/commands";

const FASTAPI_URL = process.env.NEXT_PUBLIC_FASTAPI_URL;

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
        annouunce({ message: { title: "Uploading image failed", subtitle: "Unsupported file type" } })
      },
    });
  }, []);

  const ocr = useCallback(async (blob: Blob) => {
    try {
      setLoading(true);
      const formData = new FormData();
      formData.append("file", blob);

      const response = await fetch(`${FASTAPI_URL}/pix2text`, {
        method: "POST",
        body: formData,
      });
      if (!response.ok) {
        throw new Error(`Server responded with status ${response.status}`)
      }
      const result = await response.json();
      return result.generated_text;
    } catch (error: any) {
      annouunce({ message: { title: "Something went wrong", subtitle: error.message } })
    } finally {
      setLoading(false);
    }
  }, []);

  const updateValue = useCallback(async (blob: Blob) => {
    const latex = await ocr(blob);
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
    } catch (err: any) {
      annouunce({ message: { title: "Reading image failed", subtitle: err.message } })
    }
  }, []);

  const annouunce = useCallback((announcement: Announcement) => {
    editor.dispatchCommand(SET_ANNOUNCEMENT_COMMAND, announcement);
  }, [editor]);

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
    <Dialog open={open} maxWidth="md" sx={{ '& .MuiDialog-paper': { width: '100%' } }} onClose={closeDialog}>
      <DialogTitle>Image to Text</DialogTitle>
      <DialogContent>
        <Button variant="outlined" sx={{ my: 1, mr: 1 }} startIcon={<UploadFile />} component="label" disabled={loading}>
          Upload Image
          <input type="file" hidden accept="image/*" onChange={handleFilesChange} autoFocus disabled={loading} />
        </Button>
        <Button variant="outlined" sx={{ my: 1 }} startIcon={<ContentPaste />} onClick={readFromClipboard} disabled={loading}>
          Paste from Clipboard
        </Button>
        <TextField margin="normal" size="small" fullWidth multiline id="value" value={formData.value} onChange={updateFormData} label="Result" name="value" disabled={loading} />
        <LinearProgress sx={{ visibility: loading ? 'visible' : 'hidden' }} />
      </DialogContent>
      <DialogActions>
        <Button onClick={closeDialog}>Cancel</Button>
        <Button type='submit' onClick={handleSubmit} disabled={loading}>Save</Button>
      </DialogActions>
    </Dialog>
  )
}

export default OCRDialog;