import { LexicalEditor } from 'lexical';
import Button from '@mui/material/Button';
import Dialog from '@mui/material/Dialog';
import DialogActions from '@mui/material/DialogActions';
import DialogContent from '@mui/material/DialogContent';
import { INSERT_IMAGE_COMMAND } from '../ImagePlugin';

const parameters = {
  id: "ggbApplet",
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
  perspective: "AG"
};

const applet = new (window as any).GGBApplet(parameters, '5.0');

window.addEventListener('resize', () => {
  const app = (window as any).ggbApplet;
  app?.setSize(window.innerWidth, window.innerHeight - 52.5);
})

export default function InsertGraphDialog({ editor, open, onClose }: { editor: LexicalEditor; open: boolean; onClose: () => void; }) {

  const handleSubmit = () => {
    const app = (window as any).ggbApplet;
    app.exportSVG((html: string) => {
      const element = new DOMParser().parseFromString(html, "text/html").body.firstElementChild;
      const serialized = new XMLSerializer().serializeToString(element!);
      const decoded = decodeURIComponent(encodeURIComponent(serialized));
      const base64 = btoa(decoded);
      editor.dispatchCommand(INSERT_IMAGE_COMMAND, { src: "data:image/svg+xml;base64," + base64 },);
      onClose();
    });
  };

  return (
    <Dialog open={open} fullScreen={true} onClose={onClose}>
      <DialogContent sx={{ display: "flex", justifyContent: "center", alignItems: "center", p: 0, overflow: "hidden" }} ref={el => el && applet.inject(el)} />
      <DialogActions>
        <Button autoFocus onClick={onClose}>
          Cancel
        </Button>
        <Button onClick={handleSubmit}>
          Insert
        </Button>
      </DialogActions>
    </Dialog>
  );
}
