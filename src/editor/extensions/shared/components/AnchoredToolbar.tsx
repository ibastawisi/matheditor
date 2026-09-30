"use client"
import { Box, SxProps, Theme } from "@mui/material";
import { useLexicalComposerContext } from "@lexical/react/LexicalComposerContext";
import type { NodeKey } from "lexical";
import { createPortal } from "react-dom";
import { getEditorContainer, getNodeAnchorName } from "@/editor/utils/getEditorContainer";

export type AnchoredToolbarPlacement = "top" | "bottom" | "inside-top-right";

const placementStyles = (placement: AnchoredToolbarPlacement) => {
  switch (placement) {
    case "top":
      return {
        bottom: "calc(anchor(top) + 0.25rem)",
        justifySelf: "anchor-center",
        positionTryFallbacks: "flip-block",
      };
    case "bottom":
      return {
        top: "calc(anchor(bottom) + 0.25rem)",
        justifySelf: "anchor-center",
        positionTryFallbacks: "flip-block",
      };
    case "inside-top-right":
      return {
        top: "calc(anchor(top) + 0.25rem)",
        right: "calc(anchor(right) + 0.25rem)",
      };
  }
};

/**
 * A toolbar rendered in the editor container and positioned next to a node
 * with css anchor positioning, the node's dom sets `anchor-name: --node-anchor-{key}`
 */
export function AnchoredToolbar({
  nodeKey,
  placement = "top",
  className,
  id,
  sx,
  children,
}: {
  nodeKey: NodeKey;
  placement?: AnchoredToolbarPlacement;
  className?: string;
  id?: string;
  sx?: SxProps<Theme>;
  children: React.ReactNode;
}) {
  const [editor] = useLexicalComposerContext();
  const container = getEditorContainer(editor);

  return createPortal(
    <Box
      id={id}
      className={className}
      sx={[
        {
          position: "absolute",
          positionAnchor: getNodeAnchorName(nodeKey),
          ...placementStyles(placement),
          zIndex: 30,
          display: "flex",
          flexWrap: "wrap",
          justifyContent: "center",
          alignItems: "center",
          gap: 0.5,
          maxWidth: "100%",
          willChange: "transform",
          displayPrint: "none",
          "& .MuiToggleButtonGroup-root, & > .MuiButtonBase-root": { bgcolor: "background.default" },
        },
        ...(Array.isArray(sx) ? sx : [sx]),
      ]}
    >
      {children}
    </Box>,
    container
  );
}
