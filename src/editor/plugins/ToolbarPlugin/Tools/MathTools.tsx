"use client"
import { LexicalEditor, } from "lexical";
import { MathNode } from "../../../nodes/MathNode";
import { useCallback, useEffect, useRef, useState } from "react";
import { $getNodeStyleValueForProperty, $patchStyle } from "../../../nodes/utils";
import ColorPicker from "./ColorPicker";
import type { MathfieldElement } from "mathlive";
import useFixedBodyScroll from "@/hooks/useFixedBodyScroll";
import { SxProps, Theme } from '@mui/material/styles';
import { Box, Button, Collapse, Dialog, DialogActions, DialogContent, DialogTitle, IconButton, LinearProgress, MenuItem, Paper, Select, SelectChangeEvent, SvgIcon, TextField, ToggleButton, ToggleButtonGroup, Tooltip, Typography } from '@mui/material';
import { ContentPaste, Delete, Draw, Edit, ImageSearch, Menu, Save, UploadFile } from "@mui/icons-material";
import { useTheme } from '@mui/material/styles';
import Compressor from 'compressorjs';

import dynamic from "next/dynamic";
import type { ExcalidrawImperativeAPI, ExcalidrawProps } from "@excalidraw/excalidraw/types/types";
const Excalidraw = dynamic<ExcalidrawProps>(() => import('@excalidraw/excalidraw/dist/excalidraw.production.min.js').then((module) => ({ default: module.Excalidraw })), { ssr: false });

const WolframIcon = () => <SvgIcon viewBox='0 0 20 20' fontSize='small'>
  <path d="M15.33 10l2.17-2.47-3.19-.71.33-3.29-3 1.33L10 2 8.35 4.86l-3-1.33.32 3.29-3.17.71L4.67 10 2.5 12.47l3.19.71-.33 3.29 3-1.33L10 18l1.65-2.86 3 1.33-.32-3.29 3.19-.71zm-2.83 1.5h-5v-1h5zm0-2h-5v-1h5z" fill="#f96932"></path>
</SvgIcon>;

export const useCallbackRefState = () => {
  const [refValue, setRefValue] =
    useState<ExcalidrawImperativeAPI | null>(null);
  const refCallback = useCallback(
    (value: ExcalidrawImperativeAPI | null) => setRefValue(value),
    [],
  );
  return [refValue, refCallback] as const;
};

export default function MathTools({ editor, node, sx }: { editor: LexicalEditor, node: MathNode, sx?: SxProps<Theme> | undefined }) {
  const [value, setValue] = useState<string | null>(null);
  const theme = useTheme();
  const [excalidrawAPI, excalidrawAPIRefCallback] = useCallbackRefState();
  const [fontSize, setFontSize] = useState('15px');
  const FONT_SIZE_OPTIONS: [string, string][] = [
    ['10px', '10'],
    ['11px', '11'],
    ['12px', '12'],
    ['13px', '13'],
    ['14px', '14'],
    ['15px', '15'],
    ['16px', '16'],
    ['17px', '17'],
    ['18px', '18'],
    ['19px', '19'],
    ['20px', '20'],
  ];

  useEffect(() => {
    editor.getEditorState().read(() => {
      const fontSize = $getNodeStyleValueForProperty(node, 'font-size', '15px');
      setFontSize(fontSize);
    });
  }, [node]);

  const applyStyleMath = useCallback(
    (styles: Record<string, string>) => {
      editor.update(() => {
        $patchStyle([node], styles);
      });
    },
    [editor, node],
  );

  const onFontSizeSelect = useCallback(
    (e: SelectChangeEvent) => {
      const fontSize = e.target.value;
      setFontSize(fontSize);
      applyStyleMath({ 'font-size': fontSize });
    },
    [applyStyleMath],
  );

  const onColorChange = useCallback((key: string, value: string) => {
    const styleKey = key === 'text' ? 'color' : 'background-color';
    const mathfield = node.getMathfield();
    if (!mathfield) return;
    if (mathfield.selectionIsCollapsed) {
      applyStyleMath({ [styleKey]: value });
    }
    else {
      const style = key === "text" ? ({ color: value }) : ({ backgroundColor: value });
      const selection = mathfield.selection;
      const range = selection.ranges[0];
      mathfield.applyStyle(style, range);
    }
  }, [applyStyleMath, node]);

  const [open, setOpen] = useState(false);
  const openEditDialog = useCallback(() => {
    setOpen(true);
  }, []);
  const handleClose = () => {
    setOpen(false);
    restoreSelection();
  };
  const restoreSelection = () => {
    const mathfield = node.getMathfield();
    if (!mathfield) return;
    setTimeout(() => {
      mathfield.focus();
      const mathVirtualKeyboard = window.mathVirtualKeyboard;
      mathVirtualKeyboard.show({ animate: true });
    }, 0);
  }

  const mathfieldRef = useRef<MathfieldElement>(null);
  const [formData, setFormData] = useState({ value: node.getValue() });
  useEffect(() => {
    setFormData({ value: node.getValue() });
  }, [node]);

  const updateFormData = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
    if (mathfieldRef.current) {
      mathfieldRef.current.setValue(e.target.value);
    }
  }, [formData]);
  const handleEdit = useCallback((e: React.FormEvent<HTMLFormElement> | React.MouseEvent<HTMLButtonElement>) => {
    e.preventDefault();
    const { value } = formData;
    const mathfield = node.getMathfield();
    if (!mathfield) return;
    mathfield.setValue(value, { selectionMode: 'after' });
    handleClose();
  }, [editor, formData, handleClose, node]);

  const openWolfram = useCallback(() => {
    const mathfield = node.getMathfield();
    if (!mathfield) return;
    const selection = mathfield.selection;
    const value = mathfield.getValue(selection, 'latex-unstyled') || mathfield.getValue('latex-unstyled');
    window.open(`https://www.wolframalpha.com/input?i=${encodeURIComponent(value)}`);
  }, [node]);

  useFixedBodyScroll(open);

  // const handleFreeHand = useCallback(async () => {
  //   const exportToBlob = await import('@excalidraw/excalidraw/dist/excalidraw.production.min.js').then((module) => module.exportToBlob).catch((e) => console.error(e));
  //   if (!exportToBlob) return;
  //   const blob = await exportToBlob({
  //     elements: excalidrawAPI!.getSceneElements(),
  //     mimeType: 'image/png',
  //     exportPadding: 16,
  //   });
  //   const latex = await ocr(blob);
  //   if (!latex) return;
  //   const mathfield = node.getMathfield();
  //   if (!mathfield) return;
  //   mathfield.executeCommand(["insert", latex]);
  // }, [excalidrawAPI, node, ocr]);


  return (
    <ToggleButtonGroup size="small" sx={{ position: "relative", ...sx }} exclusive value={value} onChange={(e, newValue) => setValue(newValue)}>
      <ToggleButton value="wolfram" onClick={openWolfram}>
        <WolframIcon />
      </ToggleButton>
      <ToggleButton value="edit" onClick={openEditDialog}>
        <Edit />
      </ToggleButton>
      <Dialog open={open} onClose={handleClose} maxWidth="md" sx={{ '& .MuiDialog-paper': { width: '100%' } }}>
        <form onSubmit={handleEdit}>
          <DialogTitle>Edit LaTeX</DialogTitle>
          <DialogContent >
            <TextField margin="normal" size="small" fullWidth multiline id="value" value={formData.value} onChange={updateFormData} label="Latex Value" name="value" autoFocus />
            <Box sx={{ display: "flex", flexDirection: "column" }}>
              <Typography variant="button" component="h3" color="text.secondary" sx={{ my: 1 }}>
                Preview
              </Typography>
              <math-field ref={mathfieldRef} value={formData.value} style={{ width: "auto", margin: "0 auto" }} read-only></math-field>
            </Box>
          </DialogContent>
          <DialogActions>
            <Button onClick={handleClose}>Cancel</Button>
            <Button type='submit' onClick={handleEdit}>Save</Button>
          </DialogActions>
        </form>
      </Dialog>
      <ToggleButton component="label" value="ocr">
        <ImageSearch />
      </ToggleButton>
      <OCRDialog open={value === "ocr"} onClose={() => setValue(null)} editor={editor} node={node} />
      {/* <ToggleButton component="label" value="draw">
        <Draw />
      </ToggleButton>
      {value === "draw" && <Collapse in={value === "draw"}>
        <Paper sx={{
          position: "absolute",
          top: 48,
          left: 0,
          width: "100%",
          height: 128,
          border: "1px solid",
          borderColor: theme.palette.divider,
          zIndex: 1000,
          '& .App-top-bar': { display: "none !important" },
          '& .App-bottom-bar': { display: "none !important" },
          '& .popover': { display: 'none !important' },
        }}>
          <Excalidraw
            excalidrawAPI={excalidrawAPIRefCallback}
            initialData={{
              elements: [],
              appState: {
                activeTool: { type: "freedraw", lastActiveTool: null, customType: null, locked: true },
                currentItemStrokeWidth: 0.5,
              },
            }}
            theme={theme.palette.mode}
          />
          <IconButton onClick={handleFreeHand} sx={{ position: "absolute", bottom: 8, right: 8, zIndex: 1000 }}>
            <Save />
          </IconButton>
        </Paper>
      </Collapse>} */}
      <ColorPicker onColorChange={onColorChange} onClose={handleClose} />
      <ToggleButton value="delete"
        onClick={() => {
          editor.update(() => {
            node.selectPrevious();
            node.remove();
          });
        }}>
        <Delete />
      </ToggleButton>
      <ToggleButton value="menu"
        onClick={(e) => {
          const mathfield = node.getMathfield();
          const x = e.currentTarget.getBoundingClientRect().left;
          const y = e.currentTarget.getBoundingClientRect().top + 40;
          if (mathfield) mathfield.showMenu({ location: { x, y }, modifiers: { alt: false, control: false, shift: false, meta: false } });
        }}>
        <Menu />
      </ToggleButton>
      <Select size='small' onChange={onFontSizeSelect} value={fontSize}>
        {FONT_SIZE_OPTIONS.map(([option, text]) => <MenuItem key={option} value={option}>{text}</MenuItem>)}
      </Select>
    </ToggleButtonGroup>
  )
}

const OCRDialog = ({ open, onClose, editor, node }: { open: boolean, onClose: () => void, editor: LexicalEditor, node: MathNode }) => {
  const mathfieldRef = useRef<MathfieldElement>(null);
  const [formData, setFormData] = useState({ value: node.getValue() });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleClose = () => {
    setFormData({ value: '' });
    setError(null);
    onClose();
  };

  useEffect(() => {
    if (!open) return;
    setFormData({ value: node.getValue() });
  }, [open, node]);

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
        setError("Uploading image failed: " + "Unsupported file type");
      },
    });
  }, []);

  const ocr = useCallback(async (blob: Blob) => {
    try {
      const response = await fetch("/api/ocr", {
        method: "POST",
        body: blob,
      });
      const result = await response.json();
      if (result.error) {
        setError(`${result.error}: retrying in ${Math.floor(result.estimated_time)} seconds`);
        if (response.status !== 503) return;
        const waitTime = result.estimated_time * 1000;
        return new Promise((resolve) => {
          setTimeout(() => { resolve(ocr(blob)); }, waitTime);
        });
      }
      setError(null);
      return result[0].generated_text;
    } catch (error: any) {
      setError(`Something went wrong: ${error.message}`);
    }
  }, []);

  const updateValue = useCallback(async (blob: Blob) => {
    setLoading(true);
    const latex = await ocr(blob);
    setLoading(false);
    if (!latex) return;
    setFormData({ ...formData, value: latex });
  }, [mathfieldRef, formData]);

  useEffect(() => {
    if (!open) return;
    const mathfield = mathfieldRef.current;
    if (!mathfield) return;
    mathfield.setValue(formData.value);
  }, [open, formData]);

  useEffect(() => {
    if (!open || !error) return;
    const timeoutId = setTimeout(() => setError(null), 3000);
    return () => clearTimeout(timeoutId);
  }, [error, open]);

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
      setError('Reading image failed: ' + err)
    }
  }, []);

  const handleSubmit = async () => {
    const { value } = formData;
    const mathfield = node.getMathfield();
    if (!mathfield) return;
    mathfield.setValue(value, { selectionMode: 'after' });
    handleClose();
  };

  useFixedBodyScroll(open);

  return (
    <Dialog open={open} onClose={onClose} maxWidth="md" sx={{ '& .MuiDialog-paper': { width: '100%' } }}>
      <DialogTitle>Image to LaTeX</DialogTitle>
      <DialogContent>
        <Button variant="outlined" sx={{ my: 1, mr: 1 }} startIcon={<UploadFile />} component="label">
          Upload Image
          <input type="file" hidden accept="image/*" onChange={handleFilesChange} autoFocus />
        </Button>
        <Button variant="outlined" sx={{ my: 1 }} startIcon={<ContentPaste />} onClick={readFromClipboard}>
          Paste from Clipboard
        </Button>
        <TextField margin="normal" size="small" fullWidth multiline id="value" value={formData.value} onChange={updateFormData} label="Latex Value" name="value" />
        <Box sx={{ display: "flex", flexDirection: "column", mb: 2 }}>
          <Typography variant="button" component="h3" color="text.secondary" sx={{ my: 1 }}>
            Preview
          </Typography>
          <math-field ref={mathfieldRef} value={formData.value} style={{ width: "auto", margin: "0 auto" }} read-only></math-field>
        </Box>
        {loading && <LinearProgress />}
        {error && <Typography color="error">{error}</Typography>}
      </DialogContent>
      <DialogActions>
        <Button onClick={handleClose}>Cancel</Button>
        <Button type='submit' onClick={handleSubmit}>Save</Button>
      </DialogActions>
    </Dialog>
  )
}