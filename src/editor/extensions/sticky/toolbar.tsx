"use client"
import { $getNodeByKey, NodeKey } from "lexical";
import { useLexicalComposerContext } from "@lexical/react/LexicalComposerContext";
import { ToggleButtonGroup, ToggleButton } from "@mui/material";
import { Delete } from "@mui/icons-material";
import ColorPicker from "@/editor/extensions/shared/components/ColorPicker";
import { AnchoredToolbar } from "@/editor/extensions/shared/components/AnchoredToolbar";
import { FormatImageLeftIcon as FormatImageLeft, FormatImageRightIcon as FormatImageRight } from "@/editor/extensions/shared/icons";
import { useStore } from "@/editor/extensions/store/hooks";
import { restoreFocus as restoreEditorFocus } from "@/editor/utils/restoreFocus";
import { $isStickyNode, StickyNode } from "./nodes";
import type { NoteFloat } from "./types";

export default function NoteTools({ nodeKey }: { nodeKey: NodeKey }) {
  const [editor] = useLexicalComposerContext();
  const [float] = useStore("noteFloat");
  const [textColor] = useStore("noteColor");
  const [backgroundColor] = useStore("noteBackgroundColor");

  const updateNode = (update: (node: StickyNode) => void) => {
    editor.update(() => {
      const node = $getNodeByKey(nodeKey);
      if (!$isStickyNode(node)) return;
      update(node);
    });
  };

  const deleteNode = () => {
    updateNode((node) => {
      node.selectPrevious();
      node.remove();
    });
  };

  const updateNoteColor = (key: string, value: string) => {
    updateNode((node) => {
      if (key === 'text') node.setColor(value === 'inherit' ? '' : value);
      else node.setBackgroundColor(value);
    });
  };

  const updateFloat = (newFloat: NoteFloat) => {
    updateNode((node) => { node.setFloat(newFloat); });
  };

  const restoreFocus = () => {
    setTimeout(() => restoreEditorFocus(editor), 0);
  };

  return (
    <AnchoredToolbar nodeKey={nodeKey} placement="top" className="note-toolbar">
      <ToggleButtonGroup size="small">
        <ToggleButton value="float-left" selected={float === "left"} title="Float left" aria-label="Float left"
          onClick={() => updateFloat("left")}>
          <FormatImageLeft />
        </ToggleButton>
        <ToggleButton value="float-right" selected={float === "right"} title="Float right" aria-label="Float right"
          onClick={() => updateFloat("right")}>
          <FormatImageRight />
        </ToggleButton>
      </ToggleButtonGroup>
      <ToggleButtonGroup size="small">
        <ColorPicker
          onColorChange={updateNoteColor}
          onClose={restoreFocus}
          textColor={textColor}
          backgroundColor={backgroundColor}
        />
        <ToggleButton value="delete-note" title="Delete note" aria-label="Delete note" onClick={deleteNode}>
          <Delete fontSize="small" />
        </ToggleButton>
      </ToggleButtonGroup>
    </AnchoredToolbar>
  );
}
