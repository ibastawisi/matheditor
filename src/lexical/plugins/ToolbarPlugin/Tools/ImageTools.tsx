import ToggleButton from "@mui/material/ToggleButton";
import ToggleButtonGroup from "@mui/material/ToggleButtonGroup";
import { LexicalEditor, } from "lexical";
import { $isImageNode, ImageNode } from "../../../nodes/ImageNode";
import { SxProps, Theme } from '@mui/material/styles';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import { SketchNode } from "../../../nodes/SketchNode";
import { $isGraphNode, GraphNode } from "../../../nodes/GraphNode";
import { useDispatch } from "react-redux";
import { actions } from "../../../../store";
import { $patchStyle, getStyleObjectFromCSS } from '../../../nodes/utils';
import SvgIcon from '@mui/material/SvgIcon';
import { useState } from "react";
import ViewHeadlineIcon from '@mui/icons-material/ViewHeadline';

const FormatImageRightIcon = () => <SvgIcon viewBox='0 -960 960 960'>
  <path xmlns="http://www.w3.org/2000/svg" d="M450-285v-390h390v390H450Zm60-60h270v-270H510v270ZM120-120v-60h720v60H120Zm0-165v-60h270v60H120Zm0-165v-60h270v60H120Zm0-165v-60h270v60H120Zm0-165v-60h720v60H120Z" />
</SvgIcon>;

const FormatImageLeftIcon = () => <SvgIcon viewBox='0 -960 960 960'>
  <path xmlns="http://www.w3.org/2000/svg" d="M120-285v-390h390v390H120Zm60-60h270v-270H180v270Zm-60-435v-60h720v60H120Zm450 165v-60h270v60H570Zm0 165v-60h270v60H570Zm0 165v-60h270v60H570ZM120-120v-60h720v60H120Z" />
</SvgIcon>;


export default function ImageTools({ editor, node, sx }: { editor: LexicalEditor, node: ImageNode | GraphNode | SketchNode, sx?: SxProps<Theme> | undefined }): JSX.Element {
  const dispatch = useDispatch();
  const openImageDialog = () => dispatch(actions.app.setDialogs({ image: { open: true } }));
  const openGraphDialog = () => dispatch(actions.app.setDialogs({ graph: { open: true } }));
  const openSketchDialog = () => dispatch(actions.app.setDialogs({ sketch: { open: true } }));
  const openDialog = $isImageNode(node) ? openImageDialog : $isGraphNode(node) ? openGraphDialog : openSketchDialog;

  const [style, setStyle] = useState(currentNodeStyle());

  function currentNodeStyle(): Record<string, string> | null {
    return editor.getEditorState().read(() => {
      if ('getStyle' in node === false) return null;
      const css = node.getStyle();
      if (!css) return null;
      const style = getStyleObjectFromCSS(css);
      return style;
    });
  }

  function updateStyle(newStyle: Record<string, string>) {
    setStyle({ ...style, ...newStyle });
    editor.update(() => {
      $patchStyle([node], newStyle);
    });
  }

  return (
    <>
      <ToggleButtonGroup size="small" sx={{ ...sx }} >

        <ToggleButton value="edit" key="edit"
          onClick={openDialog}>
          <EditIcon />
        </ToggleButton>
        <ToggleButton value="float-left" key="float-left"
          onClick={() => {
            updateStyle({ "float": "left", "margin": "1em 1em 0 0", "max-width": "50%" });
          }}>
          <FormatImageLeftIcon />
        </ToggleButton>
        <ToggleButton value="float-none" key="float-none"
          onClick={() => {
            updateStyle({ "float": "none", "margin": "0.5em", "max-width": "100%" });
          }}>
          <ViewHeadlineIcon />
        </ToggleButton>,
        <ToggleButton value="float-right" key="float-right"
          onClick={() => {
            updateStyle({ "float": "right", "margin": "1em 0 0 1em", "max-width": "50%" });
          }}>
          <FormatImageRightIcon />
        </ToggleButton>
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