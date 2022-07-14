import { LexicalEditor } from 'lexical';
import Button from '@mui/material/Button';
import Dialog from '@mui/material/Dialog';
import DialogActions from '@mui/material/DialogActions';
import DialogContent from '@mui/material/DialogContent';
import { Excalidraw, exportToSvg } from '@excalidraw/excalidraw';
import { ExcalidrawElement, NonDeleted } from '@excalidraw/excalidraw/types/element/types';
import { AppState } from '@excalidraw/excalidraw/types/types';
import { INSERT_IMAGE_COMMAND } from '../ImagePlugin';
import { useEffect, useState } from 'react';
import { ImageNode, ImageNodeType } from '../../nodes/ImageNode';

export type ExcalidrawElementFragment = {
  isDeleted?: boolean;
};

export enum DialogMode {
  create,
  update,
}

export default function InsertSketchDialog({ editor, node, mode, open, onClose }: { editor: LexicalEditor; node?: ImageNode; mode: DialogMode; open: boolean; onClose: () => void; }) {
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
      const src = reader.result as string;
      const value = JSON.stringify(elements);
      switch (mode) {
        case DialogMode.create:
          editor.dispatchCommand(INSERT_IMAGE_COMMAND, { src, data: { type: ImageNodeType.Sketch, value } },);
          break;
        case DialogMode.update:
          editor.update(() => node?.update(src, value));
          break;
      }
      onClose();
    }
  };

  useEffect(() => {
    if (node) {
      try {
        const value = node.getData().value;
        const elements = JSON.parse(value!);
        setElements(elements);
      }
      catch (e) { }
    }
  }, [node]);

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
            elements,
          }}
        />
      </DialogContent>
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
