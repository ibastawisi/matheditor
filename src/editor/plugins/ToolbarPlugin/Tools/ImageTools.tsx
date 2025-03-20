"use client"
import { LexicalEditor, } from "lexical";
import { ImageNode } from "@/editor/nodes/ImageNode";
import { $isSketchNode, SketchNode } from "@/editor/nodes/SketchNode";
import { $isGraphNode, GraphNode } from "@/editor/nodes/GraphNode";
import { $patchStyle, getStyleObjectFromCSS } from '@/editor/nodes/utils';
import { useEffect, useState } from "react";
import { SET_DIALOGS_COMMAND } from '../Dialogs/commands';
import { SxProps, Theme } from '@mui/material/styles';
import { ToggleButtonGroup, ToggleButton, SvgIcon, Box } from "@mui/material";
import { Edit, ClosedCaptionDisabled, ClosedCaption, ViewHeadline, Delete, Draw, FilterBAndW } from "@mui/icons-material";
import { $isIFrameNode, IFrameNode } from "@/editor/nodes/IFrameNode";

const FormatImageRight = () => <SvgIcon viewBox='0 -960 960 960' fontSize='small'>
  <path xmlns="http://www.w3.org/2000/svg" d="M450-285v-390h390v390H450Zm60-60h270v-270H510v270ZM120-120v-60h720v60H120Zm0-165v-60h270v60H120Zm0-165v-60h270v60H120Zm0-165v-60h270v60H120Zm0-165v-60h720v60H120Z" fontSize='small' />
</SvgIcon>;

const FormatImageLeft = () => <SvgIcon viewBox='0 -960 960 960' fontSize='small'>
  <path xmlns="http://www.w3.org/2000/svg" d="M120-285v-390h390v390H120Zm60-60h270v-270H180v270Zm-60-435v-60h720v60H120Zm450 165v-60h270v60H570Zm0 165v-60h270v60H570Zm0 165v-60h270v60H570ZM120-120v-60h720v60H120Z" fontSize='small' />
</SvgIcon>;


export default function ImageTools({ editor, node, sx }: { editor: LexicalEditor, node: ImageNode | GraphNode | SketchNode | IFrameNode, sx?: SxProps<Theme> | undefined }) {
  const openImageDialog = () => editor.dispatchCommand(SET_DIALOGS_COMMAND, ({ image: { open: true } }));
  const openGraphDialog = () => editor.dispatchCommand(SET_DIALOGS_COMMAND, ({ graph: { open: true } }));
  const openSketchDialog = () => editor.dispatchCommand(SET_DIALOGS_COMMAND, ({ sketch: { open: true } }));
  const openIFrameDialog = () => editor.dispatchCommand(SET_DIALOGS_COMMAND, ({ iframe: { open: true } }));
  const openDialog = $isGraphNode(node) ? openGraphDialog : $isSketchNode(node) ? openSketchDialog : $isIFrameNode(node) ? openIFrameDialog : openImageDialog;

  const [style, setStyle] = useState<Record<string, string> | null>();

  useEffect(() => { setStyle(currentNodeStyle()); }, [node]);

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
      $patchStyle(node, newStyle);
    });
  }

  const toggleShowCaption = () => {
    editor.update(() => {
      node.setShowCaption(!node.getShowCaption());
    });
  };

  const isImageNode = node.__type === 'image';
  const isGraphOrSketchNode = node.__type === 'graph' || node.__type === 'sketch';
  const isFiltered = isGraphOrSketchNode ? style?.filter !== "none" : !!style?.filter && style.filter !== "none";

  return (
    <>
      <ToggleButtonGroup size="small" sx={{
        ...sx, bgcolor: 'background.default',
      }} >
        <ToggleButton value="edit" key="edit"
          onClick={openDialog}>
          <Edit fontSize='small' />
        </ToggleButton>
        {isImageNode && <ToggleButton value="sketch" key="sketch"
          onClick={openSketchDialog}>
          <Draw fontSize='small' />
        </ToggleButton>}
        <ToggleButton value="delete"
          onClick={() => {
            editor.update(() => {
              node.selectPrevious();
              node.remove();
            });
          }}>
          <Delete fontSize='small' />
        </ToggleButton>
      </ToggleButtonGroup>
      <Box sx={{
        display: 'flex',
        flexWrap: 'wrap',
        gap: 0.5,
        position: ['fixed', 'static'],
        justifyContent: ['center', 'start'],
        inset: 'auto auto 4px',
        zIndex: 1000,
      }}>
        <ToggleButtonGroup size="small" sx={{ bgcolor: 'background.default' }}>
          <ToggleButton value="caption" key="caption" selected={node.getShowCaption()}
            onClick={toggleShowCaption}>
            {node.getShowCaption() ? <ClosedCaption fontSize='small' /> : <ClosedCaptionDisabled fontSize='small' />}
          </ToggleButton>
          <ToggleButton value="filter-toggle" key="filter-toggle" selected={isFiltered}
            onClick={() => {
              updateStyle({ "filter": isFiltered ? "none" : "" });
            }}>
            <FilterBAndW fontSize='small' />
          </ToggleButton>
        </ToggleButtonGroup>
        <ToggleButtonGroup size="small" sx={{ bgcolor: 'background.default' }}>
          <ToggleButton value="float-left" key="float-left" selected={style?.float === "left"}
            onClick={() => {
              updateStyle({ "float": "left" });
            }}>
            <FormatImageLeft />
          </ToggleButton>
          <ToggleButton value="float-none" key="float-none" selected={!style?.float || style?.float === "none"}
            onClick={() => {
              updateStyle({ "float": "none" });
            }}>
            <ViewHeadline fontSize='small' />
          </ToggleButton>
          <ToggleButton value="float-right" key="float-right" selected={style?.float === "right"}
            onClick={() => {
              updateStyle({ "float": "right" });
            }}>
            <FormatImageRight />
          </ToggleButton>
        </ToggleButtonGroup>
      </Box >
    </>
  )
}