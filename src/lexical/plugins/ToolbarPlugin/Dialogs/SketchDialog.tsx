import { LexicalEditor } from 'lexical';
import Button from '@mui/material/Button';
import Dialog from '@mui/material/Dialog';
import DialogActions from '@mui/material/DialogActions';
import DialogContent from '@mui/material/DialogContent';
import { INSERT_SKETCH_COMMAND } from '../../SketchPlugin';
import { Suspense, lazy, useEffect, useState } from 'react';
import LogicGates from "./SketchLibraries/Logic-Gates.json";
import CircuitComponents from "./SketchLibraries/circuit-components.json";
import { useTheme } from '@mui/material/styles';
import { SketchNode } from '../../../nodes/SketchNode';
import { ExcalidrawImperativeAPI } from '@excalidraw/excalidraw/types/types';
import { ImportedLibraryData } from '@excalidraw/excalidraw/types/data/types';
import CircularProgress from '@mui/material/CircularProgress';

const Excalidraw = lazy(() => import('@excalidraw/excalidraw').then((module) => ({ default: module.Excalidraw })));

export type ExcalidrawElementFragment = { isDeleted?: boolean; };

export enum SketchDialogMode { create, update }

export default function InsertSketchDialog({ editor, node, mode, open, onClose }: { editor: LexicalEditor; node?: SketchNode; mode: SketchDialogMode; open: boolean; onClose: () => void; }) {
  const [excalidrawAPI, setExcalidrawAPI] = useState<ExcalidrawImperativeAPI | null>(null);
  const theme = useTheme();

  useEffect(() => {
    if (!excalidrawAPI) return;
    if (open) {
      loadSceneOrLibrary();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [excalidrawAPI, open]);

  const handleSubmit = async () => {
    const elements = excalidrawAPI?.getSceneElements();
    const files = excalidrawAPI?.getFiles();
    const exportToSvg = await import('@excalidraw/excalidraw').then((module) => module.exportToSvg);
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

    switch (mode) {
      case SketchDialogMode.create:
        editor.dispatchCommand(INSERT_SKETCH_COMMAND, { src },);
        break;
      case SketchDialogMode.update:
        editor.update(() => node?.update(src));
        break;
    }
    onClose();
  };

  const loadSceneOrLibrary = async () => {
    const src = node?.getSrc();
    const elements = node?.getValue();
    if (!src) return;
    const blob = await (await fetch(src)).blob();
    const loadSceneOrLibraryFromBlob = await import('@excalidraw/excalidraw').then((module) => module.loadSceneOrLibraryFromBlob);
    const MIME_TYPES = await import('@excalidraw/excalidraw').then((module) => module.MIME_TYPES);
    try {
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

  if (!open) return null;

  return (
    <Dialog open={open} fullScreen={true} onClose={onClose}>
      <DialogContent sx={{ display: "flex", justifyContent: "center", alignItems: "center", p: 0, overflow: "hidden" }}>
        {open &&
          <Suspense fallback={<CircularProgress size={36} disableShrink />}>
            <Excalidraw
              ref={(api: ExcalidrawImperativeAPI) => setExcalidrawAPI(api)}
              initialData={{
                libraryItems: [...LogicGates.library, ...CircuitComponents.libraryItems],
              }}
              theme={theme.palette.mode}
            />
          </Suspense>}
      </DialogContent>
      <DialogActions>
        <Button autoFocus onClick={onClose}>
          Cancel
        </Button>
        <Button onClick={handleSubmit}>
          {mode === SketchDialogMode.create ? "Insert" : "Update"}
        </Button>
      </DialogActions>
    </Dialog>
  );
}
