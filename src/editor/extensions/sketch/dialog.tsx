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
import type { ExcalidrawImperativeAPI, ExcalidrawProps, DataURL, LibraryItem, LibraryItems, LibraryItems_anyVersion, BinaryFiles, AppState, BinaryFileData } from '@excalidraw/excalidraw/types';
import '@excalidraw/excalidraw/index.css';

const Excalidraw = dynamic<ExcalidrawProps>(() => import('@excalidraw/excalidraw').then((module) => ({ default: module.Excalidraw })), { ssr: false });

export type ExcalidrawElementFragment = { isDeleted?: boolean; };
declare global {
  interface Window {
    EXCALIDRAW_ASSET_PATH: string;
  }
}

window.EXCALIDRAW_ASSET_PATH = "/"

const getLibraryItemsFromStorage = () => {
  try {
    const libraryItems: LibraryItems = JSON.parse(localStorage.getItem("excalidraw-library") as string);
    return libraryItems || [];
  } catch (error) {
    console.error(error);
    return [];
  }
};

// the libraries that come with the app, offered until the user has a library of their own
const getDefaultLibraryItems = async () => {
  const LogicGates = await import("./libs/logic.json");
  const CircuitComponents = await import("./libs/circuits.json");
  return [...LogicGates.library, ...CircuitComponents.libraryItems] as any as LibraryItems_anyVersion;
};

/**
 * @returns `true` if the URL is valid, throws otherwise.
 */
const validateLibraryUrl = (libraryUrl: string, allowedUrls = ["excalidraw.com"]): true => {
  const { hostname, pathname } = new URL(libraryUrl);
  const isAllowed = allowedUrls.some((allowedUrlDef) => {
    const allowedUrl = new URL(`https://${allowedUrlDef.replace(/^https?:\/\//, "")}`);
    return (
      new RegExp(`(^|\\.)${allowedUrl.hostname}$`).test(hostname) &&
      new RegExp(`^${allowedUrl.pathname.replace(/\/+$/, "")}(/+|$)`).test(pathname)
    );
  });
  if (isAllowed) return true;
  throw new Error(`Invalid or disallowed library URL: "${libraryUrl}"`);
};

const importLibraryFromURL = async (excalidrawAPI: ExcalidrawImperativeAPI, libraryUrl: string) => {
  const libraryPromise = async () => {
    libraryUrl = decodeURIComponent(libraryUrl);
    validateLibraryUrl(libraryUrl);
    const request = await fetch(libraryUrl);
    return request.blob();
  };

  try {
    await excalidrawAPI.updateLibrary({
      libraryItems: libraryPromise,
      prompt: false,
      merge: true,
      defaultStatus: "published",
      openLibraryMenu: true,
    });
  } catch (error: any) {
    excalidrawAPI.updateScene({ appState: { errorMessage: error.message } });
    throw error;
  }
};

// loads the saved library, and installs a library linked from the URL hash,
// which is where the libraries site sends one when "Add to Excalidraw" is clicked
const useHandleLibrary = (excalidrawAPI: ExcalidrawImperativeAPI | null) => {
  useEffect(() => {
    if (!excalidrawAPI) return;
    // the libraries site targets this window by its name to send a library back
    window.name = excalidrawAPI.id;
    const libraryItems = getLibraryItemsFromStorage();
    Promise.resolve(libraryItems.length ? libraryItems : getDefaultLibraryItems()).then((libraryItems) => {
      excalidrawAPI.updateLibrary({ libraryItems, merge: true });
    });
  }, [excalidrawAPI]);

  useEffect(() => {
    if (!excalidrawAPI) return;
    const importLibraryFromHash = async () => {
      const { parseLibraryTokensFromUrl } = await import('@excalidraw/excalidraw');
      const libraryUrlTokens = parseLibraryTokensFromUrl();
      if (!libraryUrlTokens) return;
      window.history.replaceState(null, "", location.pathname + location.search);
      importLibraryFromURL(excalidrawAPI, libraryUrlTokens.libraryUrl).catch(console.error);
    };
    importLibraryFromHash();
    window.addEventListener("hashchange", importLibraryFromHash);
    return () => window.removeEventListener("hashchange", importLibraryFromHash);
  }, [excalidrawAPI]);
};

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

  useHandleLibrary(excalidrawAPI);

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
    try {
      const { loadSceneOrLibraryFromBlob, MIME_TYPES, hashElementsVersion } = await import('@excalidraw/excalidraw');
      if (node?.isSketch) {
        const elements = node.value;
        if (elements) {
          setLastSceneVersion(hashElementsVersion(elements));
          excalidrawAPI?.updateScene({ elements, appState: { theme: colorMode } })
        } else {
          const blob = await (await fetch(src)).blob();
          const contents = await loadSceneOrLibraryFromBlob(blob, null, null);
          if (contents.type === MIME_TYPES.excalidraw) {
            excalidrawAPI?.addFiles(Object.values(contents.data.files));
            setLastSceneVersion(hashElementsVersion(contents.data.elements));
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
    const hashElementsVersion = await import('@excalidraw/excalidraw').then((module) => module.hashElementsVersion);
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
          setLastSceneVersion(hashElementsVersion([imageElement]));
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

  // an item is a duplicate when an earlier item is made of the same elements
  const isUniqueItem = (items: LibraryItems, item: LibraryItem, index: number) => {
    const elementIds = item.elements.map((element) => element.id);
    const firstIndex = items.findIndex((other) => other.elements.every((element) => elementIds.includes(element.id)));
    return firstIndex === -1 || index === firstIndex;
  };

  const onLibraryChange = async (items: LibraryItems) => {
    try {
      const previousItems = localStorage.getItem("excalidraw-library") || "[]";
      const uniqueItems = items.filter((item, index) => isUniqueItem(items, item, index));
      const serializedItems = JSON.stringify(uniqueItems);
      if (serializedItems === previousItems) return;
      if (!uniqueItems.length) return localStorage.removeItem("excalidraw-library");
      localStorage.setItem("excalidraw-library", serializedItems);
      if (uniqueItems.length !== items.length) excalidrawAPI?.updateLibrary({ libraryItems: uniqueItems, merge: false });
    } catch (error) {
      console.error(error);
    }
  };

  const saveToLocalStorage = debounce(async (elements: readonly ExcalidrawElement[], appState: AppState, files: BinaryFiles) => {
    if (elements.length === 0) return;
    const scene = { elements, files };
    const hashElementsVersion = await import('@excalidraw/excalidraw').then((module) => module.hashElementsVersion);
    const sceneVersion = hashElementsVersion(elements);
    if (lastSceneVersion && sceneVersion === lastSceneVersion) return;
    setLastSceneVersion(sceneVersion);
    const serialized = JSON.stringify(scene);
    localStorage.setItem("excalidraw", serialized);
  }, 300);

  const clearLocalStorage = () => {
    localStorage.removeItem("excalidraw");
  };

  const loading = !excalidrawAPI;

  const isCanvasIdle = () => {
    const appState = excalidrawAPI?.getAppState();
    if (!appState) return true;
    return !appState.newElement && !appState.multiElement && !appState.editingTextElement && !appState.editingLinearElement && !appState.croppingElementId
      && !appState.openDialog && !appState.openMenu && !appState.openPopup && !appState.contextMenu;
  };

  // escape steps out one layer at a time: an error, then the sidebar, then the dialog.
  // the canvas consumes every escape, so this runs in the capture phase, before it does,
  // and leaves the key to the canvas while it has something of its own to cancel, like a line or a menu
  const handleEscape = (event: React.KeyboardEvent) => {
    if (event.key !== 'Escape') return;
    const appState = excalidrawAPI?.getAppState();
    if (appState?.errorMessage) {
      event.stopPropagation();
      return excalidrawAPI?.updateScene({ appState: { errorMessage: null } });
    }
    if (appState?.openSidebar) {
      event.stopPropagation();
      return excalidrawAPI?.toggleSidebar({ name: appState.openSidebar.name, force: false });
    }
    if (!isCanvasIdle()) return;
    event.stopPropagation();
    handleClose();
  };

  useEffect(() => {
    const navigation = (window as any).navigation;
    if (!navigation) return;

    const preventBackNavigation = (event: any) => {
      if (event.navigationType !== 'traverse') return;
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
      onKeyDownCapture={handleEscape}
      slotProps={{
        paper: { 'aria-label': node ? "Edit Sketch" : "Insert Sketch" },
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