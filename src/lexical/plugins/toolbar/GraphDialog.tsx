import { LexicalEditor } from 'lexical';
import Button from '@mui/material/Button';
import Dialog from '@mui/material/Dialog';
import DialogActions from '@mui/material/DialogActions';
import DialogContent from '@mui/material/DialogContent';
import { INSERT_IMAGE_COMMAND } from '../ImagePlugin';
import { ImageNode, ImageNodeType } from '../../nodes/ImageNode';
import { useRef } from 'react';

export enum DialogMode {
  create,
  update,
}

export default function GraphDialog({ editor, node, open, onClose, mode }: { editor: LexicalEditor; node?: ImageNode; mode: DialogMode; open: boolean; onClose: () => void; }) {

  const app = useRef<any>(null);

  const mountGGBApplet = (container: HTMLDivElement) => {
    const parameters = {
      showToolBar: true,
      borderColor: null,
      showMenuBar: false,
      allowStyleBar: true,
      showAlgebraInput: true,
      enableLabelDrags: false,
      enableShiftDragZoom: true,
      capturingThreshold: null,
      showToolBarHelp: false,
      errorDialogsActive: true,
      showTutorialLink: true,
      useBrowserForJS: false,
      ggbBase64: "",
      appletOnLoad(api: any) {
        app.current = api;
      },
      perspective: "AG",
    };

    if (node) {
      const data = node.getData();
      parameters.ggbBase64 = data.value!;
    }

    const applet = new (window as any).GGBApplet(parameters, '5.0');
    applet.setHTML5Codebase('/GeoGebra/HTML5/5.0/web3d/');
    applet.inject(container);

    window.addEventListener('resize', () => {
      app.current?.setSize(window.innerWidth, window.innerHeight - 52.5);
    })

  }

  const handleSubmit = () => {
    app.current?.exportSVG((html: string) => {
      const blob = new Blob([html], { type: 'image/svg+xml' });
      const reader = new FileReader();
      reader.readAsDataURL(blob);
      reader.onload = () => {
        const src = reader.result as string;
        const value = app.current?.getBase64() as string;
        switch (mode) {
          case DialogMode.create:
            editor.dispatchCommand(INSERT_IMAGE_COMMAND, { src, data: { type: ImageNodeType.Graph, value } },);
            break;
          case DialogMode.update:
            editor.update(() => node?.update(src, value));
            break;
        }
        onClose();
      }
    });
  };

  if (!open) return null;

  return (
    <Dialog open={open} fullScreen={true} onClose={onClose}>
      <DialogContent sx={{ display: "flex", justifyContent: "center", alignItems: "center", p: 0, overflow: "hidden" }} ref={(el: HTMLDivElement | undefined) => el && mountGGBApplet(el)} />
      <DialogActions>
        <Button autoFocus onClick={onClose}>
          Cancel
        </Button>
        <Button onClick={handleSubmit}>
          {mode === DialogMode.create ? "Insert" : "Update"}
        </Button>
      </DialogActions>
    </Dialog>
  );
}
