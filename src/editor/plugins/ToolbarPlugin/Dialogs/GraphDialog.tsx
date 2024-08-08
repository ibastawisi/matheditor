"use client"
import type { LexicalEditor } from 'lexical';
import { INSERT_GRAPH_COMMAND, InsertGraphPayload } from '@/editor/plugins/GraphPlugin';
import { GraphNode } from '@/editor/nodes/GraphNode';
import { memo, useEffect, useId, useRef, useState } from 'react';
import { SET_DIALOGS_COMMAND } from './commands';
import Script from 'next/script';
import { getImageDimensions } from '@/editor/nodes/utils';
import { Dialog, DialogContent, Box, CircularProgress, DialogActions, Button, debounce } from '@mui/material';
import { ALERT_COMMAND } from '@/editor/commands';
import { v4 as uuid } from 'uuid';

function GraphDialog({ editor, node }: { editor: LexicalEditor, node: GraphNode | null; }) {
  const key = useId();
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
    ggbBase64: node?.getValue() ?? "",
    appletOnLoad(api: any) {
      setGeogebraAPI(api);
      const container = document.querySelector<HTMLDivElement>('.ggb-container');
      if (!container) return;
      container.onclick = () => {
        const value = api.getBase64();
        saveToLocalStorage(value);
      }
    }
  };
  useEffect(() => {
    if (!geogebraAPI) return;
    loadGgbBase64();
  }, [geogebraAPI]);

  const loadGgbBase64 = async () => {
    const unsavedValue = localStorage.getItem("geogebra");
    if (unsavedValue) {
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
      }
      if (id === alert.actions[1].id) geogebraAPI.setBase64(unsavedValue);
    }
  };

  const saveToLocalStorage = debounce(async (value: string) => {
    localStorage.setItem("geogebra", value);
  }, 300);

  const clearLocalStorage = () => {
    localStorage.removeItem("geogebra");
  };

  const restoreFromLocalStorage = () => {
    const value = localStorage.getItem("geogebra");
    if (value) geogebraAPI.setBase64(value);
  };

  useEffect(() => {

  }, [node]);

  const insertGraph = (payload: InsertGraphPayload) => {
    if (!node) editor.dispatchCommand(INSERT_GRAPH_COMMAND, payload,);
    else editor.update(() => node.update(payload));
  };

  const handleSubmit = async () => {
    const app = geogebraAPI;
    const src = await getBase64Src();
    const value = app.getBase64();
    const dimensions = await getImageDimensions(src);
    const showCaption = node?.getShowCaption() ?? true;
    insertGraph({ src, value, showCaption, ...dimensions });
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
    editor.dispatchCommand(SET_DIALOGS_COMMAND, { graph: { open: false } })
  }

  const handleClose = async () => {
    function discard() {
      clearLocalStorage();
      closeDialog();
    }
    function cancel() {
      closeDialog();
    }
    const unsavedValue = localStorage.getItem("geogebra");
    if (unsavedValue) {
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

  const loading = !geogebraAPI;

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

  return <Dialog open fullScreen onClose={handleClose} disableEscapeKeyDown
    TransitionProps={{
      onEntered() { document.body.classList.add('fullscreen'); },
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
  </Dialog>;
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