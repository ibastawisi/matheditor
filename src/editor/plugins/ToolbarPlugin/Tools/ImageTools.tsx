"use client"
import { LexicalEditor, } from "lexical";
import { ImageNode } from "../../../nodes/ImageNode";
import { $isSketchNode, SketchNode } from "../../../nodes/SketchNode";
import { $isGraphNode, GraphNode } from "../../../nodes/GraphNode";
import { $patchStyle, getStyleObjectFromCSS } from '../../../nodes/utils';
import { useState } from "react";
import { SET_DIALOGS_COMMAND } from '../Dialogs/commands';
import { SxProps, Theme } from '@mui/material/styles';
import { ToggleButtonGroup, ToggleButton, SvgIcon } from "@mui/material";
import { Edit, ClosedCaptionDisabled, ClosedCaption, ViewHeadline, Delete } from "@mui/icons-material";
import { $isIFrameNode, IFrameNode } from "@/editor/nodes/IFrameNode";

const FormatImageRight = () => <SvgIcon viewBox='0 -960 960 960'>
  <path xmlns="http://www.w3.org/2000/svg" d="M450-285v-390h390v390H450Zm60-60h270v-270H510v270ZM120-120v-60h720v60H120Zm0-165v-60h270v60H120Zm0-165v-60h270v60H120Zm0-165v-60h270v60H120Zm0-165v-60h720v60H120Z" />
</SvgIcon>;

const FormatImageLeft = () => <SvgIcon viewBox='0 -960 960 960'>
  <path xmlns="http://www.w3.org/2000/svg" d="M120-285v-390h390v390H120Zm60-60h270v-270H180v270Zm-60-435v-60h720v60H120Zm450 165v-60h270v60H570Zm0 165v-60h270v60H570Zm0 165v-60h270v60H570ZM120-120v-60h720v60H120Z" />
</SvgIcon>;


export default function ImageTools({ editor, node, sx }: { editor: LexicalEditor, node: ImageNode | GraphNode | SketchNode | IFrameNode, sx?: SxProps<Theme> | undefined }): JSX.Element {
  const openImageDialog = () => editor.dispatchCommand(SET_DIALOGS_COMMAND, ({ image: { open: true } }));
  const openGraphDialog = () => editor.dispatchCommand(SET_DIALOGS_COMMAND, ({ graph: { open: true } }));
  const openSketchDialog = () => editor.dispatchCommand(SET_DIALOGS_COMMAND, ({ sketch: { open: true } }));
  const openIFrameDialog = () => editor.dispatchCommand(SET_DIALOGS_COMMAND, ({ iframe: { open: true } }));
  const openDialog = $isGraphNode(node) ? openGraphDialog : $isSketchNode(node) ? openSketchDialog : $isIFrameNode(node) ? openIFrameDialog : openImageDialog;

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

  const toggleShowCaption = () => {
    editor.update(() => {
      node.setShowCaption(!node.getShowCaption());
    });
  };

  return (
    <>
      <ToggleButtonGroup size="small" sx={{ ...sx }} >

        <ToggleButton value="edit" key="edit"
          onClick={openDialog}>
          <Edit />
        </ToggleButton>
        <ToggleButton value="caption" key="caption" selected={node.getShowCaption()}
          onClick={toggleShowCaption}>
          {node.getShowCaption() ? <ClosedCaption /> : <ClosedCaptionDisabled />}
        </ToggleButton>
        <ToggleButton value="float-left" key="float-left" selected={style?.float === "left"}
          onClick={() => {
            updateStyle({ "float": "left", "margin": "0 1em 0 0", "max-width": "50%" });
          }}>
          <FormatImageLeft />
        </ToggleButton>
        <ToggleButton value="float-none" key="float-none" selected={!style || style?.float === "none"}
          onClick={() => {
            updateStyle({ "float": "none", "margin": "0", "max-width": "100%" });
          }}>
          <ViewHeadline />
        </ToggleButton>,
        <ToggleButton value="float-right" key="float-right" selected={style?.float === "right"}
          onClick={() => {
            updateStyle({ "float": "right", "margin": "0 0 0 1em", "max-width": "50%" });
          }}>
          <FormatImageRight />
        </ToggleButton>
        <ToggleButton value="delete"
          onClick={() => {
            editor.update(() => {
              node.selectPrevious();
              node.remove();
            });
          }}>
          <Delete />
        </ToggleButton>
      </ToggleButtonGroup>
    </>
  )
}