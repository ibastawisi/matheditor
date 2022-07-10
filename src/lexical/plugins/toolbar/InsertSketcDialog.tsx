import { LexicalEditor } from 'lexical';
import Button from '@mui/material/Button';
import Dialog from '@mui/material/Dialog';
import DialogActions from '@mui/material/DialogActions';
import DialogContent from '@mui/material/DialogContent';
import { Excalidraw, exportToSvg } from '@excalidraw/excalidraw';
import { ExcalidrawElement, NonDeleted } from '@excalidraw/excalidraw/types/element/types';
import { AppState } from '@excalidraw/excalidraw/types/types';
import { INSERT_IMAGE_COMMAND } from '../../plugins/ImagePlugin';
import { useState } from 'react';

export type ExcalidrawElementFragment = {
  isDeleted?: boolean;
};

export default function InsertSketchDialog({ editor, open, onClose }: { editor: LexicalEditor; open: boolean; onClose: () => void; }) {
  const [elements, setElements] = useState<ReadonlyArray<ExcalidrawElementFragment>>([]);

  const handleSubmit = async () => {
    const element: SVGElement = await exportToSvg({
      appState: null as unknown as AppState,
      elements: elements as NonDeleted<ExcalidrawElement>[],
      files: null,
      exportPadding: 16,
    });

    const blob = new Blob([element.outerHTML], { type: 'image/svg+xml' });
    const reader = new FileReader();
    reader.readAsDataURL(blob);
    reader.onload = () => {
      const dataUrl = reader.result as string;
      editor.dispatchCommand(INSERT_IMAGE_COMMAND, { src: dataUrl },);
      onClose();
    }
  };

  const onChange = (els: ReadonlyArray<ExcalidrawElementFragment>) => {
    setElements(els);
  };

  return (
    <Dialog open={open} fullScreen={true} onClose={onClose}>
      <DialogContent sx={{ display: "flex", justifyContent: "center", alignItems: "center", p: 0, overflow: "hidden" }}>
        <Excalidraw
          onChange={onChange}
          initialData={{
            appState: { isLoading: false },
            elements: [],
          }}
        />
      </DialogContent>
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
