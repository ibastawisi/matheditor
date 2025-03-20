"use client"
import type { LexicalEditor } from 'lexical';
import { INSERT_SKETCH_COMMAND, InsertSketchPayload } from '@/editor/plugins/SketchPlugin';
import { useEffect, useState, memo, useCallback } from 'react';
import { $isSketchNode } from '@/editor/nodes/SketchNode';
import { SET_DIALOGS_COMMAND } from '../commands';
import { getImageDimensions } from '@/editor/nodes/utils';
import { useTheme } from '@mui/material/styles';
import { Box, Button, CircularProgress, Dialog, DialogActions, DialogContent, debounce } from '@mui/material';
import dynamic from 'next/dynamic';
import { ImageNode } from '@/editor/nodes/ImageNode';
import { ALERT_COMMAND } from '@/editor/commands';
import { v4 as uuid } from 'uuid';
import { ExcalidrawElement, ExcalidrawImageElement, FileId } from '@excalidraw/excalidraw/element/types';
import { ImportedLibraryData } from '@excalidraw/excalidraw/data/types';
import type { ExcalidrawImperativeAPI, ExcalidrawProps, DataURL, LibraryItems, BinaryFiles, AppState, BinaryFileData } from '@excalidraw/excalidraw/types';
import '@excalidraw/excalidraw/index.css';

const Excalidraw = dynamic<ExcalidrawProps>(() => import('@excalidraw/excalidraw').then((module) => ({ default: module.Excalidraw })), { ssr: false });
const AddLibraries = dynamic(() => import('./AddLibraries'), { ssr: false });

export type ExcalidrawElementFragment = { isDeleted?: boolean; };
declare global {
  interface Window {
    EXCALIDRAW_ASSET_PATH: string;
  }
}

window.EXCALIDRAW_ASSET_PATH = "/"

export const useCallbackRefState = () => {
  const [refValue, setRefValue] =
    useState<ExcalidrawImperativeAPI | null>(null);
  const refCallback = useCallback(
    (value: ExcalidrawImperativeAPI | null) => setRefValue(value),
    [],
  );
  return [refValue, refCallback] as const;
};

function SketchDialog({ editor, node }: { editor: LexicalEditor, node: ImageNode | null; }) {
  const [excalidrawAPI, excalidrawAPIRefCallback] = useCallbackRefState();
  const [lastSceneVersion, setLastSceneVersion] = useState(0);
  const theme = useTheme();

  useEffect(() => {
    if (!excalidrawAPI) return;
    loadSceneOrLibrary();
  }, [excalidrawAPI]);

  const insertSketch = (payload: InsertSketchPayload) => {
    if (!$isSketchNode(node)) {
      editor.dispatchCommand(INSERT_SKETCH_COMMAND, payload,);
    }
    else editor.update(() => node.update(payload));
  };

  const handleSubmit = async () => {
    const elements = excalidrawAPI?.getSceneElements();
    const files = excalidrawAPI?.getFiles();
    const exportToSvg = await import('@excalidraw/excalidraw').then((module) => module.exportToSvg).catch(console.error);
    if (!elements || !files || !exportToSvg) return;
    const element: SVGElement = await exportToSvg({
      appState: {
        exportEmbedScene: true,
      },
      elements: elements!,
      files: files!,
      exportPadding: (!node || $isSketchNode(node)) ? 16 : 0,
    });

    const serialized = new XMLSerializer().serializeToString(element);
    const src = "data:image/svg+xml," + encodeURIComponent(serialized);
    const dimensions = await getImageDimensions(src);
    const showCaption = node?.getShowCaption() ?? true;
    const altText = node?.getAltText();
    const id = node?.getId() ?? "";
    const style = node?.getStyle() ?? "";
    insertSketch({ src, showCaption, ...dimensions, altText, style, id });
    clearLocalStorage();
    closeDialog();
  };

  const closeDialog = () => {
    editor.dispatchCommand(SET_DIALOGS_COMMAND, { sketch: { open: false } });
  }

  const handleClose = async () => {
    function discard() {
      clearLocalStorage();
      closeDialog();
    }
    function cancel() {
      closeDialog();
    }
    const unsavedScene = localStorage.getItem("excalidraw");
    if (unsavedScene) {
      const alert = {
        title: "Discard unsaved Changes",
        content: "Are you sure you want to discard unsaved changes?",
        actions: [
          { label: "Cancel", id: uuid() },
          { label: "Discard", id: uuid() },
        ]
      };
      editor.dispatchCommand(ALERT_COMMAND, alert);
      const id = await new Promise((resolve) => {
        const handler = (event: MouseEvent): any => {
          const target = event.target as HTMLElement;
          const button = target.closest("button");
          const paper = target.closest(".MuiDialog-paper");
          if (paper && !button) return document.addEventListener("click", handler, { once: true });
          resolve(button?.id ?? null);
        };
        setTimeout(() => { document.addEventListener("click", handler, { once: true }); }, 0);
      });
      if (id === alert.actions[1].id) discard();
    } else cancel();
  }

  async function restoreSerializedScene(serialized: string) {
    const scene = JSON.parse(serialized);
    const files = Object.values(scene.files) as BinaryFileData[];
    if (files.length) excalidrawAPI?.addFiles(files);
    const { getNonDeletedElements, isLinearElement } = await import('@excalidraw/excalidraw')
      .then((module) => ({ getNonDeletedElements: module.getNonDeletedElements, isLinearElement: module.isLinearElement }));
    const elements = getNonDeletedElements(scene.elements).map((element: ExcalidrawElement) =>
      isLinearElement(element) ? { ...element, lastCommittedPoint: null } : element,
    );
    return excalidrawAPI?.updateScene({ elements, appState: { theme: theme.palette.mode } });
  }

  const loadSceneOrLibrary = async () => {
    const unsavedScene = localStorage.getItem("excalidraw");
    if (unsavedScene) {
      const alert = {
        title: "Restore last unsaved Changes",
        content: "You've unsaved changes from last session. Do you want to restore them?",
        actions: [
          { label: "Discard", id: uuid() },
          { label: "Restore", id: uuid() },
        ]
      };
      editor.dispatchCommand(ALERT_COMMAND, alert);
      const id = await new Promise((resolve) => {
        const handler = (event: MouseEvent): any => {
          const target = event.target as HTMLElement;
          const button = target.closest("button");
          const paper = target.closest(".MuiDialog-paper");
          if (paper && !button) return document.addEventListener("click", handler, { once: true });
          resolve(button?.id ?? null);
        };
        setTimeout(() => { document.addEventListener("click", handler, { once: true }); }, 0);
      });
      if (!id || id === alert.actions[0].id) {
        clearLocalStorage();
        tryLoadSceneFromNode();
      }
      if (id === alert.actions[1].id) restoreSerializedScene(unsavedScene);
    } else tryLoadSceneFromNode();
  };

  async function tryLoadSceneFromNode() {
    const src = node?.getSrc();
    if (!src) return;
    const blob = await (await fetch(src)).blob();
    try {
      const loadSceneOrLibraryFromBlob = await import('@excalidraw/excalidraw').then((module) => module.loadSceneOrLibraryFromBlob);
      const MIME_TYPES = await import('@excalidraw/excalidraw').then((module) => module.MIME_TYPES);
      const getSceneVersion = await import('@excalidraw/excalidraw').then((module) => module.getSceneVersion);
      if ($isSketchNode(node)) {
        const elements = node.getValue();
        if (elements) {
          setLastSceneVersion(getSceneVersion(elements));
          excalidrawAPI?.updateScene({ elements, appState: { theme: theme.palette.mode } })
        } else {
          const contents = await loadSceneOrLibraryFromBlob(blob, null, elements ?? null);
          if (contents.type === MIME_TYPES.excalidraw) {
            excalidrawAPI?.addFiles(Object.values(contents.data.files));
            setLastSceneVersion(getSceneVersion(contents.data.elements));
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
  }

  async function convertImagetoSketch(src: string) {
    const now = Date.now();
    const dimensions = { width: node?.getWidth() ?? 0, height: node?.getHeight() ?? 0 }
    if (!dimensions.width || !dimensions.height) {
      const size = await getImageDimensions(src);
      dimensions.width = size.width;
      dimensions.height = size.height;
    }
    const getSceneVersion = await import('@excalidraw/excalidraw').then((module) => module.getSceneVersion);
    fetch(src).then((res) => res.blob()).then((blob) => {
      const mimeType = blob.type;
      const reader = new FileReader();
      reader.onloadend = () => {
        const base64data = reader.result;
        if (typeof base64data === "string") {
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
          } as any;

          excalidrawAPI?.addFiles([
            {
              id: now.toString() as FileId,
              mimeType: mimeType as any,
              dataURL: base64data as DataURL,
              created: now,
              lastRetrieved: now,
            },
          ]);
          setLastSceneVersion(getSceneVersion([imageElement]));
          excalidrawAPI?.updateScene({
            elements: [imageElement],
            appState: {
              activeTool: { type: "freedraw", lastActiveTool: null, customType: null, locked: true },
              currentItemStrokeWidth: 0.5,
              theme: theme.palette.mode
            }
          });
        }
      };
      reader.readAsDataURL(blob);
    });
  }

  const onLibraryChange = async (items: LibraryItems) => {
    if (!items.length) {
      localStorage.removeItem("excalidraw-library");
      return;
    }
    const serializedItems = JSON.stringify(items);
    localStorage.setItem("excalidraw-library", serializedItems);
  };

  const saveToLocalStorage = debounce(async (elements: readonly ExcalidrawElement[], appState: AppState, files: BinaryFiles) => {
    if (elements.length === 0) return;
    const scene = { elements, files };
    const getSceneVersion = await import('@excalidraw/excalidraw').then((module) => module.getSceneVersion);
    const sceneVersion = getSceneVersion(elements);
    if (lastSceneVersion && sceneVersion === lastSceneVersion) return;
    setLastSceneVersion(sceneVersion);
    const serialized = JSON.stringify(scene);
    localStorage.setItem("excalidraw", serialized);
  }, 300);

  const clearLocalStorage = () => {
    localStorage.removeItem("excalidraw");
  };

  const loading = !excalidrawAPI;

  useEffect(() => {
    const navigation = (window as any).navigation;
    if (!navigation) return;

    const preventBackNavigation = (event: any) => {
      if (event.navigationType === 'push') return;
      event.preventDefault();
      handleClose();
    };

    navigation.addEventListener('navigate', preventBackNavigation);
    return () => {
      document.body.classList.remove('fullscreen');
      navigation.removeEventListener('navigate', preventBackNavigation);
    };
  }, []);

  return <Dialog open fullScreen={true} onClose={handleClose} disableEscapeKeyDown
    TransitionProps={{
      onEntered() { document.body.classList.add('fullscreen') },
    }}>
    <DialogContent sx={{ p: 0, overflow: "hidden" }}>
      {loading && <Box sx={{ display: 'flex', height: '100%', justifyContent: 'center', alignItems: 'center' }}><CircularProgress size={36} disableShrink /></Box>}
      <Excalidraw
        excalidrawAPI={excalidrawAPIRefCallback}
        theme={theme.palette.mode}
        onLibraryChange={onLibraryChange}
        onChange={saveToLocalStorage}
        langCode='en'
      />
      {excalidrawAPI && <AddLibraries excalidrawAPI={excalidrawAPI} />}
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