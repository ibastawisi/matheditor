import { LexicalEditor } from 'lexical';
import Button from '@mui/material/Button';
import Dialog from '@mui/material/Dialog';
import DialogActions from '@mui/material/DialogActions';
import DialogContent from '@mui/material/DialogContent';
import { Excalidraw, exportToSvg } from '@excalidraw/excalidraw';
import { INSERT_SKETCH_COMMAND } from '../../SketchPlugin';
import { useEffect, useState } from 'react';
import LogicGates from "./Logic-Gates.json";
import CircuitComponents from "./circuit-components.json";
import { useTheme } from '@mui/material/styles';
import { SketchNode } from '../../../nodes/SketchNode';
import { NonDeleted, ExcalidrawElement } from '@excalidraw/excalidraw/types/element/types';
import { AppState } from '@excalidraw/excalidraw/types/types';

export type ExcalidrawElementFragment = {
  isDeleted?: boolean;
};

export enum SketchDialogMode {
  create,
  update,
}

export default function InsertSketchDialog({ editor, node, mode, open, onClose }: { editor: LexicalEditor; node?: SketchNode; mode: SketchDialogMode; open: boolean; onClose: () => void; }) {
  const [elements, setElements] = useState<ReadonlyArray<ExcalidrawElementFragment>>([]);
  const theme = useTheme();

  const handleSubmit = async () => {
    const element: SVGElement = await exportToSvg({
      appState: null as unknown as AppState,
      elements: elements as NonDeleted<ExcalidrawElement>[],
      files: null,
      exportPadding: 16,
    });

    const serialized = new XMLSerializer().serializeToString(element);
    const src = "data:image/svg+xml," + encodeURIComponent(serialized);

    switch (mode) {
      case SketchDialogMode.create:
        editor.dispatchCommand(INSERT_SKETCH_COMMAND, { src, value: elements as NonDeleted<ExcalidrawElement>[] },);
        break;
      case SketchDialogMode.update:
        editor.update(() => node?.update(src, elements as NonDeleted<ExcalidrawElement>[]),);
        break;
    }
    onClose();
  };

  useEffect(() => {
    if (node) {
      setElements(node.getValue());
    }
    return () => {
      setElements([]);
    }
  }, [node, open]);

  const onChange = (els: ReadonlyArray<ExcalidrawElementFragment>) => {
    setElements(els);
  };

  if (!open) return null;

  return (
    <Dialog open={open} fullScreen={true} onClose={() => { setElements([]); onClose() }}>
      <DialogContent sx={{ display: "flex", justifyContent: "center", alignItems: "center", p: 0, overflow: "hidden" }}>
        <Excalidraw
          onChange={onChange}
          initialData={{
            appState: { isLoading: false },
            elements,
            libraryItems: [...LogicGates.library, ...CircuitComponents.libraryItems],
          }}
          theme={theme.palette.mode}
        />
      </DialogContent>
      <DialogActions>
        <Button autoFocus onClick={onClose}>
          Cancel
        </Button>
        <Button onClick={handleSubmit}>
          {mode === SketchDialogMode.create ? "Insert" : "Update"}
        </Button>
      </DialogActions>
    </Dialog>
  );
}
