import ToggleButton from "@mui/material/ToggleButton";
import ToggleButtonGroup from "@mui/material/ToggleButtonGroup";
import { LexicalEditor, } from "lexical";
import { ImageNode, $isImageNode } from "../../nodes/ImageNode";

import { SxProps, Theme } from '@mui/material/styles';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import ImageDialog, { ImageDialogMode } from "./ImageDialog";
import GraphDialog, { GraphDialogMode } from './GraphDialog';
import SketchDialog, { SketchDialogMode } from './Sketch/SketchDialog';
import { useState } from "react";
import { SketchNode, $isSketchNode } from "../../nodes/SketchNode";
import { $isGraphNode, GraphNode } from "../../nodes/GraphNode";

export default function ImageTools({ editor, node, sx }: { editor: LexicalEditor, node: ImageNode | GraphNode | SketchNode, sx?: SxProps<Theme> | undefined }): JSX.Element {
  const [imageDialogOpen, setImageDialogOpen] = useState(false);
  const [graphDialogOpen, setGraphDialogOpen] = useState(false);
  const [sketchDialogOpen, setSketchDialogOpen] = useState(false);

  return (
    <>
      <ToggleButtonGroup size="small" sx={{ ...sx }} >
        {$isGraphNode(node) &&
          <ToggleButton value={node.getGraphType()}
            onClick={() => { setGraphDialogOpen(true) }}>
            <EditIcon />
          </ToggleButton>
        }
        {$isSketchNode(node) &&
          <ToggleButton value="sketch"
            onClick={() => { setSketchDialogOpen(true) }}>
            <EditIcon />
          </ToggleButton>
        }
        <ToggleButton value="delete"
          onClick={() => {
            editor.update(() => {
              const parent = node?.getParentOrThrow();
              parent?.selectStart();
              node?.remove();
            });
          }}>
          <DeleteIcon />
        </ToggleButton>
      </ToggleButtonGroup>
      {$isImageNode(node) && <ImageDialog editor={editor} node={node} mode={ImageDialogMode.update} open={imageDialogOpen} onClose={() => setImageDialogOpen(false)} />}
      {$isGraphNode(node) && <GraphDialog editor={editor} node={node} mode={GraphDialogMode.update} open={graphDialogOpen} onClose={() => setGraphDialogOpen(false)} />}
      {$isSketchNode(node) && <SketchDialog editor={editor} node={node} mode={SketchDialogMode.update} open={sketchDialogOpen} onClose={() => setSketchDialogOpen(false)} />}
    </>
  )
}