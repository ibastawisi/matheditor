"use client"
import { LexicalEditor, $setSelection } from 'lexical';
import Button from '@mui/material/Button';
import Dialog from '@mui/material/Dialog';
import DialogActions from '@mui/material/DialogActions';
import DialogContent from '@mui/material/DialogContent';
import { INSERT_GRAPH_COMMAND, InsertGraphPayload } from '../../GraphPlugin';
import { GraphNode } from '../../../nodes/GraphNode';
import { memo, useEffect, useId, useRef, useState } from 'react';
import CircularProgress from '@mui/material/CircularProgress';
import Box from '@mui/material/Box';
import { $getSelection } from 'lexical';
import { SET_DIALOGS_COMMAND } from '..';
import Script from 'next/script';

function GraphDialog({ editor, node, open }: { editor: LexicalEditor, node: GraphNode | null; open: boolean; }) {
  const [loading, setLoading] = useState(true);
  const key = useId();

  const parameters = {
    key,
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
    restoreSelection();
    insertGraph({ src, value });
    closeDialog();
    setTimeout(() => { editor.focus() }, 0);
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
    setLoading(true);
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

  return <Dialog open={open} fullScreen={true} onClose={handleClose} disableEscapeKeyDown>
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