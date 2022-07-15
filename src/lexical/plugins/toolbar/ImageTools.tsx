import ToggleButton from "@mui/material/ToggleButton";
import ToggleButtonGroup from "@mui/material/ToggleButtonGroup";
import { $setSelection, LexicalEditor, } from "lexical";
import { ImageNode, ImageType } from "../../nodes/ImageNode";

import { SxProps, Theme } from '@mui/material/styles';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import ImageDialog, { ImageDialogMode } from "./ImageDialog";
import GraphDialog, { GraphDialogMode } from './GraphDialog';
import SketchDialog, { SketchDialogMode } from './Sketch/SketchDialog';
import { useState } from "react";

export default function ImageTools({ editor, node, sx }: { editor: LexicalEditor, node: ImageNode, sx?: SxProps<Theme> | undefined }): JSX.Element {
  const [imageDialogOpen, setImageDialogOpen] = useState(false);
  const [graphDialogOpen, setGraphDialogOpen] = useState(false);
  const [sketchDialogOpen, setSketchDialogOpen] = useState(false);
  const data = node.getData();

  return (
    <>
      <ToggleButtonGroup size="small" sx={{ ...sx }} >
        {/* {data.type === ImageType.Image &&
          <ToggleButton value="image"
            onClick={() => { setImageDialogOpen(true) }}>
            <EditIcon />
          </ToggleButton>
        } */}
        {data.type === ImageType.Graph2D &&
          <ToggleButton value={ImageType.Graph2D}
            onClick={() => { setGraphDialogOpen(true) }}>
            <EditIcon />
          </ToggleButton>
        }
        {data.type === ImageType.Graph3D &&
          <ToggleButton value={ImageType.Graph3D}
            onClick={() => { setGraphDialogOpen(true) }}>
            <EditIcon />
          </ToggleButton>
        }
        {data.type === ImageType.Sketch &&
          <ToggleButton value="sketch"
            onClick={() => { setSketchDialogOpen(true) }}>
            <EditIcon />
          </ToggleButton>
        }
        <ToggleButton value="delete"
          onClick={() => { editor.update(() => { node.remove(); $setSelection(null) }); }}>
          <DeleteIcon />
        </ToggleButton>
      </ToggleButtonGroup>
      <ImageDialog editor={editor} node={node} mode={ImageDialogMode.update} open={imageDialogOpen} onClose={() => setImageDialogOpen(false)} />
      <GraphDialog editor={editor} node={node} mode={GraphDialogMode.update} open={graphDialogOpen} onClose={() => setGraphDialogOpen(false)} />
      <SketchDialog editor={editor} node={node} mode={SketchDialogMode.update} open={sketchDialogOpen} onClose={() => setSketchDialogOpen(false)} />
    </>
  )
}