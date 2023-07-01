import ToggleButton from "@mui/material/ToggleButton";
import ToggleButtonGroup from "@mui/material/ToggleButtonGroup";
import { LexicalEditor, } from "lexical";
import { ImageNode } from "../../../nodes/ImageNode";

import { SxProps, Theme } from '@mui/material/styles';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import { useState } from "react";
import { SketchNode, $isSketchNode } from "../../../nodes/SketchNode";
import { $isGraphNode, GraphNode, GraphType } from "../../../nodes/GraphNode";
import { useDispatch } from "react-redux";
import { actions } from "../../../../slices";

export default function ImageTools({ editor, node, sx }: { editor: LexicalEditor, node: ImageNode | GraphNode | SketchNode, sx?: SxProps<Theme> | undefined }): JSX.Element {
  const [imageDialogOpen, setImageDialogOpen] = useState(false);

  const dispatch = useDispatch();
  const openImageDialog = () => dispatch(actions.app.setDialogs({ image: { open: true } }));
  const openTableDialog = () => dispatch(actions.app.setDialogs({ table: { open: true } }));
  const openGraphDialog = () => dispatch(actions.app.setDialogs({ graph: { open: true, type: node.getGraphType() || GraphType["2D"] } }));
  const openSketchDialog = () => dispatch(actions.app.setDialogs({ sketch: { open: true } }));

  return (
    <>
      <ToggleButtonGroup size="small" sx={{ ...sx }} >
        {$isGraphNode(node) &&
          <ToggleButton value={node.getGraphType()}
            onClick={openGraphDialog}>
            <EditIcon />
          </ToggleButton>
        }
        {$isSketchNode(node) &&
          <ToggleButton value="sketch"
            onClick={openSketchDialog}>
            <EditIcon />
          </ToggleButton>
        }
        <ToggleButton value="delete"
          onClick={() => {
            editor.update(() => {
              node.selectPrevious();
              node.remove();
            });
          }}>
          <DeleteIcon />
        </ToggleButton>
      </ToggleButtonGroup>
    </>
  )
}