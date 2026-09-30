import {
  $createTextNode,
  $getSelection,
  $isRangeSelection,
  COMMAND_PRIORITY_EDITOR,
  defineExtension,
} from "lexical";
import { $findMatchingParent } from "@lexical/utils";

import { $insertImageNode, ImageExtension } from "@/editor/extensions/image";
import { $isImageNode } from "@/editor/extensions/image/nodes";
import { INSERT_SKETCH_COMMAND, type InsertSketchPayload } from "./commands";
import { $createSketchNode, SketchNode } from "./nodes";

export const SketchExtension = defineExtension({
  name: "sketch",
  dependencies: [ImageExtension],
  nodes: () => [SketchNode],
  register: (editor) => {
    return editor.registerCommand<InsertSketchPayload>(
      INSERT_SKETCH_COMMAND,
      (payload) => {
        const altText = payload.altText || "Sketch";
        const sketchNode = $createSketchNode(payload);
        const selection = $getSelection();
        // sketching over an image replaces it
        const imageNode = $isRangeSelection(selection)
          ? $findMatchingParent(selection.anchor.getNode(), $isImageNode)
          : null;
        if (imageNode) {
          sketchNode.append(...(imageNode.getChildrenSize() ? imageNode.getChildren() : [$createTextNode(altText)]));
          imageNode.replace(sketchNode);
          sketchNode.selectEnd();
          return true;
        }
        $insertImageNode(sketchNode, altText);
        return true;
      },
      COMMAND_PRIORITY_EDITOR
    );
  },
});
