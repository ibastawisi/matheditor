"use client"
import { $getNodeByKey, NodeKey } from 'lexical';
import { useLexicalComposerContext } from '@lexical/react/LexicalComposerContext';
import { INSERT_GRAPH_COMMAND, InsertGraphPayload } from './commands';
import { $isGraphNode } from './nodes';
import { memo, useEffect, useId, useRef, useState } from 'react';
import Script from 'next/script';
import { getImageDimensions } from '@/editor/extensions/image/utils';
import { setOpenDialog } from '@/editor/extensions/store';
import { Dialog, DialogContent, Box, CircularProgress, DialogActions, Button, debounce } from '@mui/material';
import { ALERT_COMMAND } from '@/editor/commands';
import type { Alert } from '@/types';

function GraphDialog({ nodeKey }: { nodeKey: NodeKey | null; }) {
  const [editor] = useLexicalComposerContext();
  const key = useId();
  const [node] = useState(() => editor.read(() => {
    const node = nodeKey ? $getNodeByKey(nodeKey) : null;
    if (!$isGraphNode(node)) return null;
    return { value: node.getValue(), showCaption: node.getShowCaption(), id: node.getId(), float: node.getFloat(), filter: node.getFilter() };
  }));
  const [geogebraAPI, setGeogebraAPI] = useState<any>(null);

  const parameters = {
    key,
    language: 'en',
    showToolBar: true,
    borderColor: null,
    showMenuBar: true,
    allowStyleBar: true,
    showAlgebraInput: true,
    enableLabelDrags: false,
    enableShiftDragZoom: true,
    capturingThreshold: null,
    showToolBarHelp: true,
    errorDialogsActive: true,
    showTutorialLink: true,
    width: window.innerWidth,
    height: window.innerHeight - 52.5,
    appName: 'suite',
    ggbBase64: node?.value ?? "",
    appletOnLoad(api: any) {
      setGeogebraAPI(api);
      const container = document.querySelector<HTMLDivElement>('.ggb-container');
      if (!container) return;
      container.onpointerup = debounce(() => {
        const value = api.getBase64();
        localStorage.setItem("geogebra", value);
      }, 300);
    }
  };
  useEffect(() => {
    if (!geogebraAPI) return;
    loadGgbBase64();
  }, [geogebraAPI]);

  const loadGgbBase64 = () => {
    const unsavedValue = localStorage.getItem("geogebra");
    if (unsavedValue) {
      const alert: Alert = {
        title: "Restore last unsaved Changes",
        description: "You've unsaved changes from last session. Do you want to restore them?",
        confirmText: "Restore",
        cancelText: "Discard",
        onConfirm: () => { geogebraAPI.setBase64(unsavedValue); },
        onCancel: clearLocalStorage,
      };
      editor.dispatchCommand(ALERT_COMMAND, alert);
    }
  };

  const clearLocalStorage = () => {
    localStorage.removeItem("geogebra");
  };

  const insertGraph = (payload: InsertGraphPayload) => {
    if (!node || !nodeKey) return editor.dispatchCommand(INSERT_GRAPH_COMMAND, payload);
    editor.update(() => {
      const graphNode = $getNodeByKey(nodeKey);
      if ($isGraphNode(graphNode)) graphNode.update(payload);
    });
  };

  const handleSubmit = async () => {
    const app = geogebraAPI;
    const src = await getBase64Src();
    const value = app.getBase64();
    const dimensions = await getImageDimensions(src);
    const showCaption = node?.showCaption ?? true;
    const id = node?.id ?? "";
    insertGraph({ src, value, showCaption, ...dimensions, id, float: node?.float, filter: node?.filter });
    clearLocalStorage();
    closeDialog();
  };

  const getBase64Src = () => new Promise<string>((resolve, reject) => {
    const app = geogebraAPI;
    const xml = app.getXML();
    const subApp = xml.match(/subApp="(.+?)"/)?.[1];
    switch (subApp) {
      case "graphing":
      case "geometry":
      case "cas": {
        app.exportSVG((html: string) => {
          const src = "data:image/svg+xml," + encodeURIComponent(html);
          resolve(src);
        });
      }
        break;
      default: {
        const src = "data:image/png;base64," + app.getPNGBase64(1, true, 72);
        resolve(src);
      }
    }
  });

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
    const unsavedValue = localStorage.getItem("geogebra");
    if (unsavedValue) {
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

  const loading = !geogebraAPI;

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
    <Dialog open fullScreen onClose={(_, reason) => { if (reason !== 'escapeKeyDown') handleClose(); }}
      slotProps={{
        transition: {
          onEntered() { document.body.classList.add('fullscreen'); },
        }
      }}>
      <DialogContent sx={{ p: 0, overflow: "hidden" }}>
        {loading && <Box sx={{ display: 'flex', height: '100%', justifyContent: 'center', alignItems: 'center' }}><CircularProgress size={36} disableShrink /></Box>}
        <GeogebraApplet parameters={parameters} />
      </DialogContent>
      <DialogActions>
        <Button onClick={handleClose}>
          Cancel
        </Button>
        <Button onClick={handleSubmit}>
          {!node ? "Insert" : "Update"}
        </Button>
      </DialogActions>
    </Dialog>
  );
}

const GeogebraApplet = memo(({ parameters }: { parameters: any }) => {
  const containerRef = useRef<HTMLDivElement>(null);

  const injectContainer = () => {
    const applet = new (window as any).GGBApplet(parameters, '5.0');
    applet.setHTML5Codebase('/geogebra/HTML5/5.0/web3d/');
    applet.inject(containerRef.current);
  }

  const resizeHandler = () => (window as any).ggbApplet?.setSize(window.innerWidth, window.innerHeight - 52.5);

  useEffect(() => {
    window.addEventListener('resize', resizeHandler);
    return () => window.removeEventListener('resize', resizeHandler);
  }, []);

  return <>
    <div ref={containerRef} className='ggb-container' />
    <Script src="/geogebra/deployggb.js" onReady={injectContainer} />
  </>;
}, (prevProps, nextProps) => prevProps.parameters.key === nextProps.parameters.key);

export default memo(GraphDialog);