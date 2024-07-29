"use client"
import type { LexicalEditor } from 'lexical';
import { INSERT_GRAPH_COMMAND, InsertGraphPayload } from '@/editor/plugins/GraphPlugin';
import { GraphNode } from '@/editor/nodes/GraphNode';
import { memo, useEffect, useId, useRef, useState } from 'react';
import { SET_DIALOGS_COMMAND } from './commands';
import Script from 'next/script';
import { getImageDimensions } from '@/editor/nodes/utils';
import { Dialog, DialogContent, Box, CircularProgress, DialogActions, Button } from '@mui/material';

function GraphDialog({ editor, node }: { editor: LexicalEditor, node: GraphNode | null; }) {
  const [loading, setLoading] = useState(true);
  const key = useId();

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
    appletOnLoad() { setLoading(false); },
  };

  const insertGraph = (payload: InsertGraphPayload) => {
    if (!node) editor.dispatchCommand(INSERT_GRAPH_COMMAND, payload,);
    else editor.update(() => node.update(payload));
  };

  const handleSubmit = async () => {
    const app = (window as any).ggbApplet;
    const src = await getBase64Src();
    const value = app.getBase64();
    const dimensions = await getImageDimensions(src);
    const showCaption = node?.getShowCaption() ?? true;
    insertGraph({ src, value, showCaption, ...dimensions });
    closeDialog();
  };

  const getBase64Src = () => new Promise<string>((resolve, reject) => {
    const app = (window as any).ggbApplet;
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

  const handleClose = () => {
    closeDialog();
  }

  return <Dialog open fullScreen onClose={handleClose} disableEscapeKeyDown>
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
    <div ref={containerRef} />
    <Script src="/geogebra/deployggb.js" onReady={injectContainer} />
  </>;
}, (prevProps, nextProps) => prevProps.parameters.key === nextProps.parameters.key);

export default memo(GraphDialog);