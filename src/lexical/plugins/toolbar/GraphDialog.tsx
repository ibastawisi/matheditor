import { LexicalEditor } from 'lexical';
import Button from '@mui/material/Button';
import Dialog from '@mui/material/Dialog';
import DialogActions from '@mui/material/DialogActions';
import DialogContent from '@mui/material/DialogContent';
import { INSERT_IMAGE_COMMAND } from '../ImagePlugin';
import { ImageNode, ImageType } from '../../nodes/ImageNode';
import { useRef } from 'react';

export enum GraphDialogMode {
  create,
  update,
}

export default function GraphDialog({ editor, node, type, open, onClose, mode }: { editor: LexicalEditor; node?: ImageNode; type?: ImageType; mode: GraphDialogMode; open: boolean; onClose: () => void; }) {

  const app = useRef<any>(null);

  const mountGGBApplet = (container: HTMLDivElement) => {
    const parameters: any = {
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
      useBrowserForJS: true,
      ggbBase64: "",
      width: window.innerWidth,
      height: window.innerHeight - 52.5,
      appletOnLoad(api: any) {
        app.current = api;
      },
    };

    if (node) {
      type = node.getType();
      const data = node.getData();
      parameters.ggbBase64 = data.value!;
    }

    parameters.appName = type === ImageType.Graph2D ? 'graphing' : '3d';

    const applet = new (window as any).GGBApplet(parameters, '5.0');
    applet.setHTML5Codebase('/GeoGebra/HTML5/5.0/web3d/');
    applet.inject(container);

    window.addEventListener('resize', () => {
      app.current?.setSize(window.innerWidth, window.innerHeight - 52.5);
    })

  }

  const handleSubmit = () => {
    switch (type) {
      case ImageType.Graph2D:
        app.current?.exportSVG((html: string) => {
          const blob = new Blob([html], { type: 'image/svg+xml' });
          const reader = new FileReader();
          reader.readAsDataURL(blob);
          reader.onload = () => {
            const src = reader.result as string;
            const value = app.current?.getBase64() as string;
            switch (mode) {
              case GraphDialogMode.create:
                editor.dispatchCommand(INSERT_IMAGE_COMMAND, { src, data: { type: ImageType.Graph2D, value } },);
                break;
              case GraphDialogMode.update:
                editor.update(() => node?.update(src, value));
                break;
            }
            onClose();
          }
        });
        break;
      case ImageType.Graph3D:
        const src = "data:image/png;base64," + app.current?.getPNGBase64();
        const value = app.current?.getBase64();
        switch (mode) {
          case GraphDialogMode.create:
            editor.dispatchCommand(INSERT_IMAGE_COMMAND, { src, data: { type: ImageType.Graph3D, value } },);
            break;
          case GraphDialogMode.update:
            editor.update(() => node?.update(src, value));
            break;
        }
        onClose();
        break;
    }
  };

  if (!open) return null;

  return (
    <Dialog open={open} fullScreen={true} onClose={onClose}>
      <DialogContent sx={{ p: 0, overflow: "hidden" }} ref={(el: HTMLDivElement | undefined) => el && mountGGBApplet(el)} />
      <DialogActions>
        <Button autoFocus onClick={onClose}>
          Cancel
        </Button>
        <Button onClick={handleSubmit}>
          {mode === GraphDialogMode.create ? "Insert" : "Update"}
        </Button>
      </DialogActions>
    </Dialog>
  );
}
