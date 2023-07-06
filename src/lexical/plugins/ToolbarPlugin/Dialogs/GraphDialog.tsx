import { LexicalEditor, $setSelection } from 'lexical';
import Button from '@mui/material/Button';
import Dialog from '@mui/material/Dialog';
import DialogActions from '@mui/material/DialogActions';
import DialogContent from '@mui/material/DialogContent';
import { INSERT_GRAPH_COMMAND } from '../../GraphPlugin';
import { GraphNode, GraphType } from '../../../nodes/GraphNode';
import { memo, useEffect, useId, useRef, useState } from 'react';
import CircularProgress from '@mui/material/CircularProgress';
import Box from '@mui/material/Box';
import { useSelector, useDispatch } from 'react-redux';
import { actions, RootState } from '../../../../store';
import { $getSelection } from 'lexical';

export default function GraphDialog({ editor, node }: { editor: LexicalEditor, node: GraphNode | null; }) {
  const open = useSelector((state: RootState) => state.app.ui.dialogs.graph.open);
  const graphType = useSelector((state: RootState) => state.app.ui.dialogs.graph?.type) || GraphType["2D"];
  const dispatch = useDispatch();
  const [loading, setLoading] = useState(true);
  const key = useId();

  const parameters = {
    key,
    showLogging: false,
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
    appName: graphType === GraphType["2D"] ? 'suite' : '3d',
    ggbBase64: node?.getValue() ?? "",
    appletOnLoad() { setLoading(false); },
  };

  const insertGraph = (src: string, value: string) => {
    if (!node) editor.dispatchCommand(INSERT_GRAPH_COMMAND, { src, value, graphType },);
    else editor.update(() => node.update(src, value));
  };

  const handleSubmit = async () => {
    const app = (window as any).ggbApplet;
    const src = await getBase64Src();
    const value = app.getBase64();
    editor.getEditorState().read(() => {
      const selection = $getSelection()?.clone() ?? null;
      editor.update(() => $setSelection(selection));
      insertGraph(src, value);
      handleClose();
    })
  };

  const getBase64Src = () => new Promise<string>((resolve, reject) => {
    const app = (window as any).ggbApplet;
    if (graphType === GraphType["2D"]) {
      app.exportSVG((html: string) => {
        const src = "data:image/svg+xml," + encodeURIComponent(html);
        resolve(src);
      });
    } else {
      const src = "data:image/png;base64," + app.getPNGBase64(1, true, 72);
      resolve(src);
    }
  });


  const handleClose = () => {
    dispatch(actions.app.setDialogs({ graph: { open: false, type: graphType } }));
    setLoading(true);
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

  useEffect(() => {
    const applet = new (window as any).GGBApplet(parameters, '5.0');
    applet.setHTML5Codebase('/geogebra/HTML5/5.0/web3d/');
    applet.inject(containerRef.current);
    const resizeHandler = () => (window as any).ggbApplet.setSize(window.innerWidth, window.innerHeight - 52.5);
    window.addEventListener('resize', resizeHandler);
    return () => window.removeEventListener('resize', resizeHandler);
  }, [parameters]);

  return <div ref={containerRef} />;
}, (prevProps, nextProps) => prevProps.parameters.key === nextProps.parameters.key);