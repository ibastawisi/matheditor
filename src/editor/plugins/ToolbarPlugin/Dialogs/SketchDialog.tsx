"use client"
import { $getSelection, $setSelection, LexicalEditor } from 'lexical';
import { INSERT_SKETCH_COMMAND, InsertSketchPayload } from '../../SketchPlugin';
import { Suspense, useEffect, useState, memo, useCallback } from 'react';
import LogicGates from "./SketchLibraries/Logic-Gates.json";
import CircuitComponents from "./SketchLibraries/circuit-components.json";
import { $isSketchNode } from '../../../nodes/SketchNode';
import type { ExcalidrawImperativeAPI, LibraryItems_anyVersion, ExcalidrawProps, DataURL } from '@excalidraw/excalidraw/types/types';
import type { ImportedLibraryData } from '@excalidraw/excalidraw/types/data/types';
import { SET_DIALOGS_COMMAND } from './commands';
import { getImageDimensions } from '@/editor/nodes/utils';
import useFixedBodyScroll from '@/hooks/useFixedBodyScroll';
import { useTheme } from '@mui/material/styles';
import { Button, CircularProgress, Dialog, DialogActions, DialogContent } from '@mui/material';
import dynamic from 'next/dynamic';
import { ImageNode } from '@/editor/nodes/ImageNode';
import type { ExcalidrawImageElement, FileId } from '@excalidraw/excalidraw/types/element/types';

const Excalidraw = dynamic<ExcalidrawProps>(() => import('@excalidraw/excalidraw/dist/excalidraw.production.min.js').then((module) => ({ default: module.Excalidraw })), { ssr: false });

export type ExcalidrawElementFragment = { isDeleted?: boolean; };

export const useCallbackRefState = () => {
  const [refValue, setRefValue] =
    useState<ExcalidrawImperativeAPI | null>(null);
  const refCallback = useCallback(
    (value: ExcalidrawImperativeAPI | null) => setRefValue(value),
    [],
  );
  return [refValue, refCallback] as const;
};

function SketchDialog({ editor, node, open }: { editor: LexicalEditor, node: ImageNode | null; open: boolean; }) {
  const [excalidrawAPI, excalidrawAPIRefCallback] = useCallbackRefState();
  const theme = useTheme();

  useEffect(() => {
    if (!excalidrawAPI) return;
    if (open) {
      loadSceneOrLibrary();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [excalidrawAPI, open]);

  const insertSketch = (payload: InsertSketchPayload) => {
    if (!$isSketchNode(node)) {
      editor.dispatchCommand(INSERT_SKETCH_COMMAND, payload,);
    }
    else editor.update(() => node.update(payload));
  };

  const handleSubmit = async () => {
    const elements = excalidrawAPI?.getSceneElements();
    const files = excalidrawAPI?.getFiles();
    const exportToSvg = await import('@excalidraw/excalidraw/dist/excalidraw.production.min.js').then((module) => module.exportToSvg).catch((e) => console.error(e));
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
    const dimensions = await getImageDimensions(src);
    const showCaption = node?.getShowCaption() ?? true;
    const altText = node?.getAltText();
    insertSketch({ src, showCaption, ...dimensions, altText });
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
    if (!src) return;
    const blob = await (await fetch(src)).blob();
    try {
      const loadSceneOrLibraryFromBlob = await import('@excalidraw/excalidraw/dist/excalidraw.production.min.js').then((module) => module.loadSceneOrLibraryFromBlob);
      const MIME_TYPES = await import('@excalidraw/excalidraw/dist/excalidraw.production.min.js').then((module) => module.MIME_TYPES);
      if ($isSketchNode(node)) {
        const elements = node.getValue();
        if (elements) excalidrawAPI?.updateScene({ elements, appState: { theme: theme.palette.mode } })
        else {
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
        }
      } else {
        convertImagetoSketch(src);
      }
    } catch (error) {
      console.error(error);
    }
  };

  async function convertImagetoSketch(src: string) {
    const now = Date.now();
    const mimeType = src.split(',')[0].split(':')[1].split(';')[0];
    const dimensions = await getImageDimensions(src);
    const imageElement: ExcalidrawImageElement = {
      type: "image",
      id: `image-${now}`,
      status: "saved",
      fileId: now.toString() as FileId,
      version: 2,
      versionNonce: now,
      x: 200,
      y: 200,
      width: dimensions.width,
      height: dimensions.height,
      scale: [1, 1],
      isDeleted: false,
      fillStyle: "hachure",
      strokeWidth: 1,
      strokeStyle: "solid",
      roughness: 1,
      opacity: 100,
      groupIds: [],
      strokeColor: "#000000",
      backgroundColor: "transparent",
      seed: now,
      roundness: null,
      angle: 0,
      frameId: null,
      boundElements: null,
      updated: now,
      locked: false,
      link: null,
    };

    excalidrawAPI?.addFiles([
      {
        id: now.toString() as FileId,
        mimeType: mimeType as any,
        dataURL: src as DataURL,
        created: now,
        lastRetrieved: now,
      },
    ]);
    excalidrawAPI?.updateScene({ elements: [imageElement], appState: { theme: theme.palette.mode } });
  }

  const libraryItems = [...LogicGates.library, ...CircuitComponents.libraryItems] as any as LibraryItems_anyVersion;

  useFixedBodyScroll(open);

  return <Dialog open={open} fullScreen={true} onClose={handleClose} disableEscapeKeyDown>
    <DialogContent sx={{ display: "flex", justifyContent: "center", alignItems: "center", p: 0, overflow: "hidden" }}>
      {open &&
        <Suspense fallback={<CircularProgress size={36} disableShrink />}>
          <Excalidraw
            excalidrawAPI={excalidrawAPIRefCallback}
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