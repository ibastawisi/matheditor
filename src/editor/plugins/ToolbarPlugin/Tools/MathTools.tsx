"use client"
import { LexicalEditor, } from "lexical";
import { MathNode } from "@/editor/nodes/MathNode";
import { useCallback, useEffect, useRef, useState } from "react";
import { $getNodeStyleValueForProperty, $patchStyle } from "@/editor/nodes/utils";
import ColorPicker, { textPalette, backgroundPalette } from "./ColorPicker";
import type { MathfieldElement } from "mathlive";
import useFixedBodyScroll from "@/hooks/useFixedBodyScroll";
import { SxProps, Theme } from '@mui/material/styles';
import { Box, Button, Collapse, Dialog, DialogActions, DialogContent, DialogTitle, IconButton, LinearProgress, MenuItem, Paper, Select, SelectChangeEvent, SvgIcon, TextField, ToggleButton, ToggleButtonGroup, Typography } from '@mui/material';
import { Delete, Draw, Edit, Menu, Save } from "@mui/icons-material";
import { useTheme } from '@mui/material/styles';
import { ANNOUNCE_COMMAND } from "@/editor/commands";
import { Announcement } from "@/types";

import dynamic from "next/dynamic";
import type { ExcalidrawImperativeAPI, ExcalidrawProps } from "@excalidraw/excalidraw/types";
import useOnlineStatus from "@/hooks/useOnlineStatus";
import { FontSizePicker } from "./FontSizePicker";

const Excalidraw = dynamic<ExcalidrawProps>(() => import('@excalidraw/excalidraw').then((module) => ({ default: module.Excalidraw })), { ssr: false });

const WolframIcon = () => <SvgIcon viewBox='0 0 20 20' fontSize='small'>
  <path d="M15.33 10l2.17-2.47-3.19-.71.33-3.29-3 1.33L10 2 8.35 4.86l-3-1.33.32 3.29-3.17.71L4.67 10 2.5 12.47l3.19.71-.33 3.29 3-1.33L10 18l1.65-2.86 3 1.33-.32-3.29 3.19-.71zm-2.83 1.5h-5v-1h5zm0-2h-5v-1h5z" fill="currentColor"></path>
</SvgIcon>;

const FASTAPI_URL = process.env.NEXT_PUBLIC_FASTAPI_URL;

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
  const isOnline = useOnlineStatus();
  const [excalidrawAPI, excalidrawAPIRefCallback] = useCallbackRefState();
  const [fontSize, setFontSize] = useState('16px');
  const [textColor, setTextColor] = useState<string>();
  const [backgroundColor, setBackgroundColor] = useState<string>();
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    editor.getEditorState().read(() => {
      const mathfield = editor.getElementByKey(node.__key)?.querySelector("math-field") as MathfieldElement | null;
      if (!mathfield) return;
      const computedStyle = window.getComputedStyle(mathfield);
      const currentFontSize = computedStyle.getPropertyValue('font-size');
      const fontSize = $getNodeStyleValueForProperty(node, 'font-size', currentFontSize);
      setFontSize(fontSize);
      const mathTools = document.getElementById("math-tools");
      const virtualKeyboard = window.mathVirtualKeyboard;
      const container = (virtualKeyboard as any)?.element?.firstElementChild as HTMLElement;
      if (!container || !mathTools) return;
      document.documentElement.style.setProperty('--keyboard-inset-height', container.clientHeight + "px");
      if (getComputedStyle(mathTools).position === "fixed") {
        const mathToolsBounds = mathTools.getBoundingClientRect();
        const mathfieldBounds = mathfield.getBoundingClientRect();
        const kbdBounds = container.getBoundingClientRect();
        if (mathfieldBounds.bottom > kbdBounds.top - mathToolsBounds.height) {
          scrollBy(0, mathfieldBounds.bottom - kbdBounds.top + mathToolsBounds.height + 8);
        }
      }
    });
  }, [node]);

  const applyStyleMath = useCallback(
    (styles: Record<string, string>) => {
      editor.update(() => {
        $patchStyle(node, styles);
      });
    },
    [editor, node],
  );

  const updateFontSize = useCallback(
    (fontSize: number) => {
      setFontSize(fontSize + 'px');
      applyStyleMath({ 'font-size': fontSize + 'px' });
    },
    [applyStyleMath],
  );

  const onColorChange = useCallback((key: string, value: string) => {
    const styleKey = key === 'text' ? 'color' : 'background-color';
    const mathfield = editor.getElementByKey(node.__key)?.querySelector("math-field") as MathfieldElement | null;
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
    key === 'text' ? setTextColor(value) : setBackgroundColor(value);
  }, [applyStyleMath, node]);

  const readMathfieldColor = useCallback(() => {
    editor.getEditorState().read(() => {
      const mathfield = editor.getElementByKey(node.__key)?.querySelector("math-field") as MathfieldElement | null;
      if (!mathfield) return;
      if (mathfield.selectionIsCollapsed) {
        const color = $getNodeStyleValueForProperty(node, 'color');
        setTextColor(color);
        const backgroundColor = $getNodeStyleValueForProperty(node, 'background-color');
        setBackgroundColor(backgroundColor);
      } else {
        const color = textPalette.find(color => mathfield.queryStyle({ color }) === "all") || '';
        setTextColor(color);
        const backgroundColor = backgroundPalette.find(backgroundColor => mathfield.queryStyle({ backgroundColor }) === "all") || '';
        setBackgroundColor(backgroundColor);
      }
    });
  }, [node, editor]);

  const [open, setOpen] = useState(false);
  const mathfieldValueRef = useRef<HTMLInputElement | null>(null);
  const openEditDialog = () => {
    setOpen(true);
  };

  useEffect(() => {
    if (!open) return;
    setTimeout(() => {
      const textarea = mathfieldValueRef.current;
      if (!textarea) return;
      textarea.setSelectionRange(textarea.value.length, textarea.value.length);
    }, 0);
  }, [open]);

  const handleClose = () => {
    setOpen(false);
    if (value === "draw") setTimeout(() => window.mathVirtualKeyboard.hide(), 0);
    else restoreFocus();
  };
  const restoreFocus = () => {
    window.mathVirtualKeyboard.show();
    const mathfield = editor.getElementByKey(node.__key)?.querySelector("math-field") as MathfieldElement | null;
    if (!mathfield) return;
    setTimeout(() => mathfield.focus(), 0);
  }

  const mathfieldRef = useRef<MathfieldElement>(null);
  const [formData, setFormData] = useState({ value: node.getValue() });
  useEffect(() => {
    setFormData({ value: node.getValue() });
    if (value === "draw") setTimeout(() => window.mathVirtualKeyboard.hide(), 0);
  }, [node]);

  const updateFormData = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    e.target.focus();
    setFormData({ ...formData, [e.target.name]: e.target.value });
    if (mathfieldRef.current) {
      mathfieldRef.current.setValue(e.target.value);
    }
  }, [formData]);
  const handleEdit = useCallback((e: React.FormEvent<HTMLFormElement> | React.MouseEvent<HTMLButtonElement>) => {
    e.preventDefault();
    const { value } = formData;
    const mathfield = editor.getElementByKey(node.__key)?.querySelector("math-field") as MathfieldElement | null;
    if (!mathfield) return;
    mathfield.setValue(value, { selectionMode: 'after' });
    handleClose();
  }, [editor, formData, handleClose, node]);

  const openWolfram = useCallback(() => {
    const mathfield = editor.getElementByKey(node.__key)?.querySelector("math-field") as MathfieldElement | null;
    if (!mathfield) return;
    const selection = mathfield.selection;
    const value = mathfield.getValue(selection, 'latex-unstyled') || mathfield.getValue('latex-unstyled');
    window.open(`https://www.wolframalpha.com/input?i=${encodeURIComponent(value)}`);
    setTimeout(() => { setValue(null); }, 0);
  }, [node]);

  useFixedBodyScroll(open);

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

  const handleFreeHand = useCallback(async () => {
    const exportToBlob = await import('@excalidraw/excalidraw').then((module) => module.exportToBlob).catch((e) => console.error(e));
    if (!exportToBlob) return;
    const blob = await exportToBlob({
      elements: excalidrawAPI!.getSceneElements(),
      files: excalidrawAPI!.getFiles(),
      mimeType: 'image/png',
      exportPadding: 16,
    });
    const latex = await ocr(blob);
    if (!latex) return;
    const mathfield = editor.getElementByKey(node.__key)?.querySelector("math-field") as MathfieldElement | null;
    if (!mathfield) return;
    mathfield.executeCommand(["insert", latex]);
    excalidrawAPI?.updateScene({ elements: [] });
    handleClose();
  }, [excalidrawAPI, node, ocr]);

  const annouunce = useCallback((announcement: Announcement) => {
    editor.dispatchCommand(ANNOUNCE_COMMAND, announcement);
  }, [editor]);

  const handleToggle = (event: React.MouseEvent<HTMLElement>, value: string | null) => {
    setValue(value);
    if (value === "draw") setTimeout(() => window.mathVirtualKeyboard.hide(), 0);
    if (value === null) restoreFocus();
  }

  return (
    <>
      <ToggleButtonGroup size="small" sx={{ position: "relative", ...sx }} exclusive>
        <ToggleButton value="edit" onClick={openEditDialog}>
          <Edit fontSize='small' />
        </ToggleButton>
        <Dialog open={open} onClose={handleClose} maxWidth="md" sx={{ '& .MuiDialog-paper': { width: '100%' } }}>
          <form onSubmit={handleEdit}>
            <DialogTitle>Edit LaTeX</DialogTitle>
            <DialogContent >
              <TextField margin="normal" size="small" fullWidth multiline id="value" value={formData.value} onChange={updateFormData} label="Latex Value" name="value" autoFocus inputRef={mathfieldValueRef} />
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
        <ToggleButton value="delete"
          onClick={() => {
            editor.update(() => {
              node.selectPrevious();
              node.remove();
            });
          }}>
          <Delete fontSize='small' />
        </ToggleButton>
      </ToggleButtonGroup>
      <Box id="math-tools" sx={{
        ...sx,
        display: 'flex',
        gap: 0.5,
        position: ['fixed', 'static'],
        justifyContent: ['center', 'start'],
        inset: 'auto auto calc(var(--keyboard-inset-height) + 4px)',
        zIndex: 1000,
        transition: 'bottom 0.3s'
      }}>
        <ToggleButtonGroup size="small" exclusive value={value} onChange={handleToggle} sx={{ bgcolor: 'background.default' }}>
          <ToggleButton value="wolfram" onClick={openWolfram} disabled={!isOnline} sx={{ color: isOnline ? "#f96932" : undefined }}>
            <WolframIcon />
          </ToggleButton>
          <ToggleButton component="label" value="draw" disabled={!isOnline}>
            <Draw fontSize='small' />
          </ToggleButton>
          {value === "draw" && <Collapse in={value === "draw"}>
            <Paper sx={{
              position: ['fixed', 'absolute'],
              top: ['auto', 56],
              bottom: [0.5, 'auto'],
              left: "50%",
              transform: "translateX(-50%)",
              width: "calc(100% - 2px)",
              height: 294.5,
              maxWidth: 1000,
              border: "1px solid",
              borderColor: theme.palette.divider,
              zIndex: 1000,
              '& .layer-ui__wrapper, .App-toolbar .Stack > :not(:nth-child(7),:nth-child(10)), .mobile-misc-tools-container, .App-bottom-bar, .popover, .LaserToolOverlay': { display: 'none !important' },
              '& canvas': { borderRadius: 1 },
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
                langCode='en'
              />
              <IconButton onClick={handleFreeHand} sx={{ position: "absolute", bottom: 8, right: 8, zIndex: 1000 }} disabled={loading}>
                <Save fontSize='small' />
              </IconButton>
              <LinearProgress sx={{ visibility: loading ? 'visible' : 'hidden', position: "absolute", bottom: 0, left: 0, right: 0, zIndex: 1000 }} />
            </Paper>
          </Collapse>}
        </ToggleButtonGroup>
        <FontSizePicker fontSize={fontSize} updateFontSize={updateFontSize} onBlur={restoreFocus} sx={{ bgcolor: 'background.default' }} />
        <ToggleButtonGroup size="small" sx={{ bgcolor: 'background.default' }} exclusive value={value} onChange={handleToggle} >
          <ColorPicker onColorChange={onColorChange} onClose={handleClose} textColor={textColor} backgroundColor={backgroundColor} onOpen={readMathfieldColor} />
          <ToggleButton value="menu"
            onClick={(e) => {
              const mathfield = editor.getElementByKey(node.__key)?.querySelector("math-field") as MathfieldElement | null;
              if (!mathfield) return;
              const x = e.currentTarget.getBoundingClientRect().left;
              const y = e.currentTarget.getBoundingClientRect().top + 40;
              mathfield.showMenu({ location: { x, y }, modifiers: { alt: false, control: false, shift: false, meta: false } });
              setTimeout(() => { setValue(null); }, 0);
            }}>
            <Menu fontSize='small' />
          </ToggleButton>
        </ToggleButtonGroup>
      </Box>
    </>
  )
}
