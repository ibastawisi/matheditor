import {
  $createTextNode,
  $getSelection,
  $isRangeSelection,
  COMMAND_PRIORITY_EDITOR,
  defineExtension,
} from "lexical";
import { $findMatchingParent, mergeRegister } from "@lexical/utils";

import { $insertImageNode, ImageExtension, registerStorageService } from "@/editor/extensions/image";
import { $isImageNode } from "@/editor/extensions/image/nodes";
import { ServicesExtension } from "@/editor/extensions/services";
import { INSERT_SKETCH_COMMAND, type InsertSketchPayload } from "./commands";
import { $createSketchNode, SketchNode } from "./nodes";

export const SketchExtension = defineExtension({
  name: "sketch",
  dependencies: [ImageExtension, ServicesExtension],
  nodes: () => [SketchNode],
  register: (editor) => {
    return mergeRegister(
      editor.registerCommand<InsertSketchPayload>(
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
      ),
      registerStorageService(editor, SketchNode)
    );
  },
});
