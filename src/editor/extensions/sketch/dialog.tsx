"use client"
import { $getNodeByKey, NodeKey } from 'lexical';
import { useLexicalComposerContext } from '@lexical/react/LexicalComposerContext';
import { INSERT_SKETCH_COMMAND, InsertSketchPayload } from './commands';
import { useEffect, useState, memo, useCallback } from 'react';
import { $isSketchNode } from './nodes';
import { $isImageNode } from '@/editor/extensions/image/nodes';
import { getImageDimensions } from '@/editor/extensions/image/utils';
import { setOpenDialog } from '@/editor/extensions/store';
import useColorMode from '@/hooks/useColorMode';
import { Box, Button, CircularProgress, Dialog, DialogActions, DialogContent, debounce } from '@mui/material';
import dynamic from 'next/dynamic';
import { ALERT_COMMAND } from '@/editor/commands';
import type { Alert } from '@/types';
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

function SketchDialog({ nodeKey }: { nodeKey: NodeKey | null; }) {
  const [editor] = useLexicalComposerContext();
  const [node] = useState(() => editor.read(() => {
    const node = nodeKey ? $getNodeByKey(nodeKey) : null;
    if (!$isImageNode(node)) return null;
    return {
      isSketch: $isSketchNode(node),
      value: $isSketchNode(node) ? node.getValue() : null,
      src: node.getSrc(),
      width: node.getWidth(),
      height: node.getHeight(),
      altText: node.getAltText(),
      showCaption: node.getShowCaption(),
      id: node.getId(),
      float: node.getFloat(),
      filter: node.getFilter(),
    };
  }));
  const [excalidrawAPI, excalidrawAPIRefCallback] = useCallbackRefState();
  const [lastSceneVersion, setLastSceneVersion] = useState(0);
  const colorMode = useColorMode();

  useEffect(() => {
    if (!excalidrawAPI) return;
    loadSceneOrLibrary();
  }, [excalidrawAPI]);

  const insertSketch = (payload: InsertSketchPayload) => {
    if (!node?.isSketch || !nodeKey) return editor.dispatchCommand(INSERT_SKETCH_COMMAND, payload);
    editor.update(() => {
      const sketchNode = $getNodeByKey(nodeKey);
      if ($isSketchNode(sketchNode)) sketchNode.update(payload);
    });
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
      exportPadding: (!node || node.isSketch) ? 16 : 0,
    });

    const serialized = new XMLSerializer().serializeToString(element);
    const src = "data:image/svg+xml," + encodeURIComponent(serialized);
    const dimensions = await getImageDimensions(src);
    const showCaption = node?.showCaption ?? true;
    const altText = node?.altText;
    const id = node?.id ?? "";
    insertSketch({ src, showCaption, ...dimensions, altText, id, float: node?.float, filter: node?.isSketch ? node.filter : undefined });
    clearLocalStorage();
    closeDialog();
  };

  const closeDialog = () => {
    setOpenDialog(editor, null);
  }

  const handleClose = () => {
    function discard() {
      clearLocalStorage();
      closeDialog();
    }
    function cancel() {
      closeDialog();
    }
    const unsavedScene = localStorage.getItem("excalidraw");
    if (unsavedScene) {
      const alert: Alert = {
        title: "Discard unsaved Changes",
        description: "Are you sure you want to discard unsaved changes?",
        confirmText: "Discard",
        buttonVariant: "destructive",
        onConfirm: discard,
      };
      editor.dispatchCommand(ALERT_COMMAND, alert);
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
    return excalidrawAPI?.updateScene({ elements, appState: { theme: colorMode } });
  }

  const loadSceneOrLibrary = () => {
    const unsavedScene = localStorage.getItem("excalidraw");
    if (unsavedScene) {
      const alert: Alert = {
        title: "Restore last unsaved Changes",
        description: "You've unsaved changes from last session. Do you want to restore them?",
        confirmText: "Restore",
        cancelText: "Discard",
        onConfirm: () => { restoreSerializedScene(unsavedScene); },
        onCancel: () => {
          clearLocalStorage();
          tryLoadSceneFromNode();
        },
      };
      editor.dispatchCommand(ALERT_COMMAND, alert);
    } else tryLoadSceneFromNode();
  };

  async function tryLoadSceneFromNode() {
    const src = node?.src;
    if (!src) return;
    const blob = await (await fetch(src)).blob();
    try {
      const loadSceneOrLibraryFromBlob = await import('@excalidraw/excalidraw').then((module) => module.loadSceneOrLibraryFromBlob);
      const MIME_TYPES = await import('@excalidraw/excalidraw').then((module) => module.MIME_TYPES);
      const getSceneVersion = await import('@excalidraw/excalidraw').then((module) => module.getSceneVersion);
      if (node?.isSketch) {
        const elements = node.value;
        if (elements) {
          setLastSceneVersion(getSceneVersion(elements));
          excalidrawAPI?.updateScene({ elements, appState: { theme: colorMode } })
        } else {
          const contents = await loadSceneOrLibraryFromBlob(blob, null, elements ?? null);
          if (contents.type === MIME_TYPES.excalidraw) {
            excalidrawAPI?.addFiles(Object.values(contents.data.files));
            setLastSceneVersion(getSceneVersion(contents.data.elements));
            excalidrawAPI?.updateScene({ ...contents.data as any, appState: { theme: colorMode } });
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
    const dimensions = { width: node?.width ?? 0, height: node?.height ?? 0 }
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
              theme: colorMode
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

  return (
    <Dialog open fullScreen={true} onClose={(_, reason) => { if (reason !== 'escapeKeyDown') handleClose(); }}
      slotProps={{
        transition: {
          onEntered() { document.body.classList.add('fullscreen') },
        }
      }}>
      <DialogContent sx={{ p: 0, overflow: "hidden" }}>
        {loading && <Box sx={{ display: 'flex', height: '100%', justifyContent: 'center', alignItems: 'center' }}><CircularProgress size={36} disableShrink /></Box>}
        <Excalidraw
          excalidrawAPI={excalidrawAPIRefCallback}
          theme={colorMode}
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
    </Dialog>
  );
}

export default memo(SketchDialog);