import { LexicalEditor } from 'lexical';
import Button from '@mui/material/Button';
import Dialog from '@mui/material/Dialog';
import DialogActions from '@mui/material/DialogActions';
import DialogContent from '@mui/material/DialogContent';
import { INSERT_GRAPH_COMMAND } from '../../GraphPlugin';
import { GraphNode, GraphType } from '../../../nodes/GraphNode';
import { useEffect, useRef, useState } from 'react';
import CircularProgress from '@mui/material/CircularProgress';
import Box from '@mui/material/Box';

export enum GraphDialogMode {
  create,
  update,
}

export default function GraphDialog({ editor, node, type, open, onClose, mode }: { editor: LexicalEditor; node?: GraphNode; type: GraphType; mode: GraphDialogMode; open: boolean; onClose: () => void; }) {
  const [parameters, setParameters] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!open) return;
    const parameters = {
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
      appName: type === GraphType["2D"] ? 'suite' : '3d',
      ggbBase64: node?.getValue() ?? "",
      appletOnLoad() { setLoading(false); },
    };

    setParameters(parameters);
  }, [open]);

  const insertGraph = (src: string, value: string) => {
    switch (mode) {
      case GraphDialogMode.create:
        editor.dispatchCommand(INSERT_GRAPH_COMMAND, { src, value, graphType: type },);
        break;
      case GraphDialogMode.update:
        editor.update(() => node?.update(src, value));
        break;
    }
  }

  const handleSubmit = () => {
    const app = (window as any).ggbApplet;
    const src = "data:image/png;base64," + app.getPNGBase64(1, true, 72);
    const value = app.getBase64();
    insertGraph(src, value);
    if (type === GraphType["2D"]) {
      app.exportSVG((html: string) => {
        const src = "data:image/svg+xml," + encodeURIComponent(html);
        const value = app.getBase64() as string;
        insertGraph(src, value);
      });
    }
    handleClose();
  };

  const handleClose = () => {
    setLoading(true);
    setParameters(null);
    onClose();
  }

  if (!open) return null;

  return (
    <Dialog open={open} fullScreen={true} onClose={handleClose}>
      <DialogContent sx={{ p: 0, overflow: "hidden" }}>
        {loading && <Box sx={{ display: 'flex', height: '100%', justifyContent: 'center', alignItems: 'center' }}><CircularProgress size={36} disableShrink /></Box>}
        {parameters && <GeogebraApplet parameters={parameters} />}
      </DialogContent>
      <DialogActions>
        <Button onClick={handleClose}>
          Cancel
        </Button>
        <Button onClick={handleSubmit}>
          {mode === GraphDialogMode.create ? "Insert" : "Update"}
        </Button>
      </DialogActions>
    </Dialog>
  );
}

const GeogebraApplet = ({ parameters }: { parameters: any }) => {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const applet = new (window as any).GGBApplet(parameters, '5.0');
    applet.setHTML5Codebase('/geogebra/HTML5/5.0/web3d/');
    applet.inject(containerRef.current);
    const resizeHandler = () => (window as any).ggbApplet.setSize(window.innerWidth, window.innerHeight - 52.5);
    window.addEventListener('resize', resizeHandler);
    return () => window.removeEventListener('resize', resizeHandler);
  }, [parameters]);

  return <div ref={containerRef} />;

}