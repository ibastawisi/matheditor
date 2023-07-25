"use client"
import { $getSelection, $setSelection, LexicalEditor } from 'lexical';
import { INSERT_SKETCH_COMMAND, InsertSketchPayload } from '../../SketchPlugin';
import { Suspense, lazy, useEffect, useState, memo } from 'react';
import LogicGates from "./SketchLibraries/Logic-Gates.json";
import CircuitComponents from "./SketchLibraries/circuit-components.json";
import { SketchNode } from '../../../nodes/SketchNode';
import { ExcalidrawImperativeAPI, LibraryItems_anyVersion } from '@excalidraw/excalidraw/types/types';
import { ImportedLibraryData } from '@excalidraw/excalidraw/types/data/types';
import { Button, CircularProgress, Dialog, DialogActions, DialogContent, useTheme } from '@mui/material';
import { SET_DIALOGS_COMMAND } from '..';

const Excalidraw = lazy(() => import('@excalidraw/excalidraw').then((module) => ({ default: module.Excalidraw })));

export type ExcalidrawElementFragment = { isDeleted?: boolean; };

function SketchDialog({ editor, node, open }: { editor: LexicalEditor, node: SketchNode | null; open: boolean; }) {
  const [excalidrawAPI, setExcalidrawAPI] = useState<ExcalidrawImperativeAPI | null>(null);
  const theme = useTheme();

  useEffect(() => {
    if (!excalidrawAPI) return;
    if (open) {
      loadSceneOrLibrary();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [excalidrawAPI, open]);

  const insertSketch = (payload: InsertSketchPayload) => {
    if (!node) editor.dispatchCommand(INSERT_SKETCH_COMMAND, payload,);
    else editor.update(() => node.update(payload));
  };

  const handleSubmit = async () => {
    const elements = excalidrawAPI?.getSceneElements();
    const files = excalidrawAPI?.getFiles();
    const exportToSvg = await import('@excalidraw/excalidraw').then((module) => module.exportToSvg).catch((e) => console.error(e));
    if (!elements || !files || !exportToSvg) return;
    const element: SVGElement = await exportToSvg({
      appState: {
        exportEmbedScene: true,
      },
      elements: elements!,
      files: files!,
      exportPadding: 16,
    });

    const serialized = new XMLSerializer().serializeToString(element);
    const src = "data:image/svg+xml," + encodeURIComponent(serialized);

    insertSketch({ src });
    closeDialog();
    setTimeout(() => { editor.focus() }, 0);
  };

  const closeDialog = () => {
    editor.dispatchCommand(SET_DIALOGS_COMMAND, { sketch: { open: false } })
  }

  const restoreSelection = () => {
    editor.getEditorState().read(() => {
      const selection = $getSelection()?.clone() ?? null;
      editor.update(() => $setSelection(selection));
    })
  }

  const handleClose = () => {
    closeDialog();
    restoreSelection();
  }

  const loadSceneOrLibrary = async () => {
    const src = node?.getSrc();
    const elements = node?.getValue();
    if (!src) return;
    const blob = await (await fetch(src)).blob();
    try {
      const loadSceneOrLibraryFromBlob = await import('@excalidraw/excalidraw').then((module) => module.loadSceneOrLibraryFromBlob);
      const MIME_TYPES = await import('@excalidraw/excalidraw').then((module) => module.MIME_TYPES);
      const contents = await loadSceneOrLibraryFromBlob(blob, null, elements ?? null);
      if (contents.type === MIME_TYPES.excalidraw) {
        excalidrawAPI?.addFiles(Object.values(contents.data.files));
        excalidrawAPI?.updateScene({ ...contents.data as any, appState: { theme: theme.palette.mode } });
      } else if (contents.type === MIME_TYPES.excalidrawlib) {
        excalidrawAPI?.updateLibrary({
          libraryItems: (contents.data as ImportedLibraryData).libraryItems!,
          openLibraryMenu: true,
        });
      }
    } catch (error) {
      excalidrawAPI?.updateScene({ elements, appState: { theme: theme.palette.mode } })
    }
  };

  const libraryItems = [...LogicGates.library, ...CircuitComponents.libraryItems] as any as LibraryItems_anyVersion;

  return <Dialog open={open} fullScreen={true} onClose={handleClose} disableEscapeKeyDown>
    <DialogContent sx={{ display: "flex", justifyContent: "center", alignItems: "center", p: 0, overflow: "hidden" }}>
      {open &&
        <Suspense fallback={<CircularProgress size={36} disableShrink />}>
          <Excalidraw
            ref={(api: ExcalidrawImperativeAPI) => setExcalidrawAPI(api)}
            initialData={{ libraryItems }}
            theme={theme.palette.mode}
          />
        </Suspense>}
    </DialogContent>
    <DialogActions>
      <Button autoFocus onClick={handleClose}>
        Cancel
      </Button>
      <Button onClick={handleSubmit}>
        {!node ? "Insert" : "Update"}
      </Button>
    </DialogActions>
  </Dialog>;
}

export default memo(SketchDialog);