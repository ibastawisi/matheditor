"use client"
import { $getNodeByKey, NodeKey } from "lexical";
import { useLexicalComposerContext } from "@lexical/react/LexicalComposerContext";
import { SxProps, Theme } from '@mui/material/styles';
import { ToggleButtonGroup, ToggleButton } from "@mui/material";
import { AnchoredToolbar } from "@/editor/extensions/shared/components/AnchoredToolbar";
import { Edit, ClosedCaptionDisabled, ClosedCaption, ViewHeadline, Delete, Draw, FilterBAndW } from "@mui/icons-material";
import { $isImageNode, ImageNode } from "./nodes";
import { useStore } from "@/editor/extensions/store/hooks";
import { setOpenDialog } from "@/editor/extensions/store";
import { FormatImageLeftIcon as FormatImageLeft, FormatImageRightIcon as FormatImageRight } from "@/editor/extensions/shared/icons";

export default function ImageTools({ nodeKey, sx }: { nodeKey: NodeKey, sx?: SxProps<Theme> | undefined }) {
  const [editor] = useLexicalComposerContext();
  const [imageType] = useStore("imageType");
  const [float] = useStore("imageFloat");
  const [filter] = useStore("imageFilter");
  const [showCaption] = useStore("imageShowCaption");

  const openDialog = () => setOpenDialog(editor, imageType);
  const openSketchDialog = () => setOpenDialog(editor, 'sketch');

  const updateNode = (update: (node: ImageNode) => void) => {
    editor.update(() => {
      const node = $getNodeByKey(nodeKey);
      if (!$isImageNode(node)) return;
      update(node);
    });
  };

  const isImageNode = imageType === 'image';
  const isFiltered = filter === "auto";

  return (
    <AnchoredToolbar nodeKey={nodeKey} placement="inside-top" className="image-toolbar" sx={sx}>
      <ToggleButtonGroup size="small">
        <ToggleButton value="edit" key="edit" onClick={openDialog} title={`Edit ${imageType}`} aria-label={`Edit ${imageType}`}>
          <Edit fontSize='small' />
        </ToggleButton>
        {isImageNode && <ToggleButton value="sketch" key="sketch" onClick={openSketchDialog} title="Draw on image" aria-label="Draw on image">
          <Draw fontSize='small' />
        </ToggleButton>}
      </ToggleButtonGroup>
      <ToggleButtonGroup size="small">
        <ToggleButton value="caption" key="caption" selected={showCaption} title="Toggle caption" aria-label="Toggle caption"
          onClick={() => updateNode((node) => {
            node.setShowCaption(!showCaption);
            node.selectEnd();
          })}>
          {showCaption ? <ClosedCaption fontSize='small' /> : <ClosedCaptionDisabled fontSize='small' />}
        </ToggleButton>
        <ToggleButton value="filter-toggle" key="filter-toggle" selected={isFiltered} title="Toggle dark mode filter" aria-label="Toggle dark mode filter"
          onClick={() => updateNode((node) => { node.setFilter(isFiltered ? "none" : "auto"); })}>
          <FilterBAndW fontSize='small' />
        </ToggleButton>
      </ToggleButtonGroup>
      <ToggleButtonGroup size="small">
        <ToggleButton value="float-left" key="float-left" selected={float === "left"} title="Float left" aria-label="Float left"
          onClick={() => updateNode((node) => { node.setFloat("left"); })}>
          <FormatImageLeft />
        </ToggleButton>
        <ToggleButton value="float-none" key="float-none" selected={float === "none"} title="Float none" aria-label="Float none"
          onClick={() => updateNode((node) => { node.setFloat("none"); })}>
          <ViewHeadline fontSize='small' />
        </ToggleButton>
        <ToggleButton value="float-right" key="float-right" selected={float === "right"} title="Float right" aria-label="Float right"
          onClick={() => updateNode((node) => { node.setFloat("right"); })}>
          <FormatImageRight />
        </ToggleButton>
      </ToggleButtonGroup>
      <ToggleButtonGroup size="small">
        <ToggleButton value="delete" title={`Delete ${imageType}`} aria-label={`Delete ${imageType}`}
          onClick={() => {
            updateNode((node) => {
              node.selectPrevious();
              node.remove();
            });
          }}>
          <Delete fontSize='small' />
        </ToggleButton>
      </ToggleButtonGroup>
    </AnchoredToolbar>
  )
}
