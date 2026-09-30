"use client"
import { $getNodeByKey, NodeKey } from "lexical";
import { useLexicalComposerContext } from "@lexical/react/LexicalComposerContext";
import { $isMathNode } from "./nodes";
import { useCallback, useEffect, useRef, useState } from "react";
import { $getNodeStyleValueForProperty, $patchStyle } from "@/editor/extensions/shared/utils";
import ColorPicker, { textPalette, backgroundPalette } from "@/editor/extensions/shared/components/ColorPicker";
import type { MathfieldElement } from "mathlive";
import useFixedBodyScroll from "@/hooks/useFixedBodyScroll";
import { SxProps, Theme } from '@mui/material/styles';
import { Box, Button, Dialog, DialogActions, DialogContent, DialogTitle, IconButton, LinearProgress, MenuItem, Paper, Select, SelectChangeEvent, SvgIcon, TextField, ToggleButton, ToggleButtonGroup, Typography } from '@mui/material';
import { Delete, Draw, Edit, Menu, Save } from "@mui/icons-material";
import useColorMode from "@/hooks/useColorMode";
import { ANNOUNCE_COMMAND } from "@/editor/commands";
import { Announcement } from "@/types";

import dynamic from "next/dynamic";
import type { ExcalidrawImperativeAPI, ExcalidrawProps } from "@excalidraw/excalidraw/types";
import useOnlineStatus from "@/hooks/useOnlineStatus";
import { FontSizePicker } from "@/editor/extensions/shared/components/FontSizePicker";
import { AnchoredToolbar } from "@/editor/extensions/shared/components/AnchoredToolbar";
import { createPortal } from "react-dom";

const Excalidraw = dynamic<ExcalidrawProps>(() => import('@excalidraw/excalidraw').then((module) => ({ default: module.Excalidraw })), { ssr: false });

const WolframIcon = () => <SvgIcon viewBox='0 0 20 20' fontSize='small'>
  <path d="M15.33 10l2.17-2.47-3.19-.71.33-3.29-3 1.33L10 2 8.35 4.86l-3-1.33.32 3.29-3.17.71L4.67 10 2.5 12.47l3.19.71-.33 3.29 3-1.33L10 18l1.65-2.86 3 1.33-.32-3.29 3.19-.71zm-2.83 1.5h-5v-1h5zm0-2h-5v-1h5z" fill="currentColor"></path>
</SvgIcon>;

const EraserIcon = () => <SvgIcon fontSize='small'>
  <path d="M16.24 3.56l4.95 4.94c.78.79.78 2.05 0 2.84L12 20.53a4.008 4.008 0 0 1-5.66 0L2.81 17c-.78-.79-.78-2.05 0-2.84l10.6-10.6c.79-.78 2.05-.78 2.83 0M4.22 15.58l3.54 3.53c.78.79 2.04.79 2.83 0l3.53-3.53-4.95-4.95-4.95 4.95z" fill="currentColor"></path>
</SvgIcon>;

const FASTAPI_URL = process.env.NEXT_PUBLIC_FASTAPI_URL;
// Matches the math virtual keyboard height (--_keyboard-height in index.css)
const DRAW_CANVAS_HEIGHT = 295;

export const useCallbackRefState = () => {
  const [refValue, setRefValue] =
    useState<ExcalidrawImperativeAPI | null>(null);
  const refCallback = useCallback(
    (value: ExcalidrawImperativeAPI | null) => setRefValue(value),
    [],
  );
  return [refValue, refCallback] as const;
};

export default function MathTools({ nodeKey, sx }: { nodeKey: NodeKey, sx?: SxProps<Theme> | undefined }) {
  const [editor] = useLexicalComposerContext();
  const getMathfield = useCallback(() => editor.getElementByKey(nodeKey)?.querySelector("math-field") as MathfieldElement | null, [editor, nodeKey]);
  const getNodeValue = useCallback(() => editor.read(() => {
    const node = $getNodeByKey(nodeKey);
    return $isMathNode(node) ? node.getValue() : "";
  }), [editor, nodeKey]);
  const [value, setValue] = useState<string | null>(null);
  const colorMode = useColorMode();
  const isOnline = useOnlineStatus();
  const [excalidrawAPI, excalidrawAPIRefCallback] = useCallbackRefState();
  const [fontSize, setFontSize] = useState('16px');
  const [textColor, setTextColor] = useState<string>();
  const [backgroundColor, setBackgroundColor] = useState<string>();
  const [loading, setLoading] = useState(false);
  const [drawTool, setDrawTool] = useState<"freedraw" | "eraser">("freedraw");

  useEffect(() => {
    editor.read(() => {
      const node = $getNodeByKey(nodeKey);
      const mathfield = getMathfield();
      if (!node || !mathfield) return;
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
  }, [nodeKey]);

  const applyStyleMath = useCallback(
    (styles: Record<string, string>) => {
      editor.update(() => {
        const node = $getNodeByKey(nodeKey);
        if (!$isMathNode(node)) return;
        $patchStyle(node, styles);
      });
    },
    [editor, nodeKey],
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
    const mathfield = getMathfield();
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
  }, [applyStyleMath, getMathfield]);

  const readMathfieldColor = useCallback(() => {
    editor.read(() => {
      const node = $getNodeByKey(nodeKey);
      const mathfield = getMathfield();
      if (!node || !mathfield) return;
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
  }, [nodeKey, editor, getMathfield]);

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
    const mathfield = getMathfield();
    if (!mathfield) return;
    setTimeout(() => mathfield.focus(), 0);
  }

  const mathfieldRef = useRef<MathfieldElement>(null);
  const [formData, setFormData] = useState(() => ({ value: getNodeValue() }));
  useEffect(() => {
    setFormData({ value: getNodeValue() });
    if (value === "draw") setTimeout(() => window.mathVirtualKeyboard.hide(), 0);
  }, [nodeKey, open]);

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
    const mathfield = getMathfield();
    if (!mathfield) return;
    mathfield.setValue(value, { selectionMode: 'after' });
    handleClose();
  }, [formData, handleClose, getMathfield]);

  const openWolfram = useCallback(() => {
    const mathfield = getMathfield();
    if (!mathfield) return;
    const selection = mathfield.selection;
    const value = mathfield.getValue(selection, 'latex-unstyled') || mathfield.getValue('latex-unstyled');
    window.open(`https://www.wolframalpha.com/input?i=${encodeURIComponent(value)}`);
    setTimeout(() => { setValue(null); }, 0);
  }, [getMathfield]);

  useFixedBodyScroll(open);

  useEffect(() => {
    if (value !== "draw") return;
    const mathfield = getMathfield();
    if (!mathfield) return;
    const mathfieldBounds = mathfield.getBoundingClientRect();
    const canvasTop = window.innerHeight - DRAW_CANVAS_HEIGHT;
    if (mathfieldBounds.bottom > canvasTop - 8) {
      scrollBy({ top: mathfieldBounds.bottom - canvasTop + 8, behavior: "smooth" });
    }
  }, [value, getMathfield]);

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
    const mathfield = getMathfield();
    if (!mathfield) return;
    mathfield.executeCommand(["insert", latex]);
    excalidrawAPI?.updateScene({ elements: [] });
    handleClose();
  }, [excalidrawAPI, getMathfield, ocr]);

  const updateDrawTool = (_: React.MouseEvent<HTMLElement>, tool: "freedraw" | "eraser" | null) => {
    if (!tool) return;
    setDrawTool(tool);
    excalidrawAPI?.setActiveTool({ type: tool, locked: true });
  };

  const annouunce = useCallback((announcement: Announcement) => {
    editor.dispatchCommand(ANNOUNCE_COMMAND, announcement);
  }, [editor]);

  const handleToggle = (event: React.MouseEvent<HTMLElement>, value: string | null) => {
    setValue(value);
    if (value === "draw") {
      setDrawTool("freedraw");
      setTimeout(() => window.mathVirtualKeyboard.hide(), 0);
    }
    if (value === null) restoreFocus();
  }

  return (
    <>
      <AnchoredToolbar nodeKey={nodeKey} placement="top" id="math-tools" className="math-toolbar" sx={sx}>
        <ToggleButtonGroup size="small">
          <ToggleButton value="edit" onClick={openEditDialog} title="Edit LaTeX" aria-label="Edit LaTeX">
            <Edit fontSize='small' />
          </ToggleButton>
          <ToggleButton value="delete" title="Delete math" aria-label="Delete math"
            onClick={() => {
              editor.update(() => {
                const node = $getNodeByKey(nodeKey);
                if (!node) return;
                node.selectPrevious();
                node.remove();
              });
            }}>
            <Delete fontSize='small' />
          </ToggleButton>
        </ToggleButtonGroup>
        <ToggleButtonGroup size="small" exclusive value={value} onChange={handleToggle}>
          <ToggleButton value="wolfram" onClick={openWolfram} disabled={!isOnline} sx={{ color: isOnline ? "#f96932" : undefined }} title="Open in Wolfram Alpha" aria-label="Open in Wolfram Alpha">
            <WolframIcon />
          </ToggleButton>
          <ToggleButton component="label" value="draw" disabled={!isOnline} title="Handwriting" aria-label="Handwriting">
            <Draw fontSize='small' />
          </ToggleButton>
        </ToggleButtonGroup>
        <FontSizePicker fontSize={fontSize} updateFontSize={updateFontSize} onBlur={restoreFocus} sx={{ bgcolor: 'background.default' }} />
        <ToggleButtonGroup size="small" exclusive value={value} onChange={handleToggle}>
          <ColorPicker onColorChange={onColorChange} onClose={handleClose} textColor={textColor} backgroundColor={backgroundColor} onOpen={readMathfieldColor} />
          <ToggleButton value="menu" title="Math menu" aria-label="Math menu"
            onClick={(e) => {
              const mathfield = getMathfield();
              if (!mathfield) return;
              const x = e.currentTarget.getBoundingClientRect().left;
              const y = e.currentTarget.getBoundingClientRect().top + 40;
              mathfield.showMenu({ location: { x, y }, modifiers: { alt: false, control: false, shift: false, meta: false } });
              setTimeout(() => { setValue(null); }, 0);
            }}>
            <Menu fontSize='small' />
          </ToggleButton>
        </ToggleButtonGroup>
      </AnchoredToolbar>
      {value === "draw" && createPortal(
        <Paper square elevation={0} className="math-draw-canvas" sx={{
          position: 'fixed',
          left: 0,
          right: 0,
          bottom: 0,
          height: DRAW_CANVAS_HEIGHT,
          boxSizing: 'content-box',
          pb: 'env(safe-area-inset-bottom)',
          borderTop: "1px solid",
          borderColor: 'divider',
          boxShadow: '0 -5px 6px 0 rgba(0, 0, 0, 0.08)',
          zIndex: 1200,
          displayPrint: 'none',
          '& .excalidraw > :not(.SVGLayer, .excalidraw__canvas-wrapper, .excalidraw__canvas)': { display: 'none !important' },
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
            theme={colorMode}
            langCode='en'
          />
          <ToggleButtonGroup size="small" exclusive value={drawTool} onChange={updateDrawTool}
            sx={{ position: "absolute", top: 8, left: "50%", transform: "translateX(-50%)", zIndex: 1000, bgcolor: 'background.default' }}>
            <ToggleButton value="freedraw" title="Pen" aria-label="Pen">
              <Draw fontSize='small' />
            </ToggleButton>
            <ToggleButton value="eraser" title="Eraser" aria-label="Eraser">
              <EraserIcon />
            </ToggleButton>
          </ToggleButtonGroup>
          <IconButton onClick={handleFreeHand} title="Convert to math" aria-label="Convert to math" disabled={loading}
            sx={{ position: "absolute", bottom: 'calc(8px + env(safe-area-inset-bottom))', right: 8, zIndex: 1000, bgcolor: 'background.default', border: 1, borderColor: 'divider', '&:hover': { bgcolor: 'action.hover' } }}>
            <Save fontSize='small' />
          </IconButton>
          <LinearProgress sx={{ visibility: loading ? 'visible' : 'hidden', position: "absolute", bottom: 0, left: 0, right: 0, zIndex: 1000 }} />
        </Paper>,
        document.body
      )}
      <Dialog open={open} onClose={handleClose} maxWidth="md" sx={{ '& .MuiDialog-paper': { width: '100%' } }}>
        <form onSubmit={handleEdit}>
          <DialogTitle>Edit LaTeX</DialogTitle>
          <DialogContent >
            <TextField margin="normal" size="small" fullWidth multiline id="value" value={formData.value} onChange={updateFormData} label="Latex Value" name="value" autoFocus inputRef={mathfieldValueRef} />
            <Box sx={{ display: "flex", flexDirection: "column" }}>
              <Typography
                variant="button"
                component="h3"
                sx={{
                  color: "text.secondary",
                  my: 1
                }}>
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
    </>
  );
}
