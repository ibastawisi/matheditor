import {
  $create,
  $getState,
  $setState,
  buildImportMap,
  createState,
  DOMConversionOutput,
  LexicalNode,
  StateConfigValue,
} from "lexical";
import type { NonDeleted, ExcalidrawElement } from "@excalidraw/excalidraw/element/types";

import { $parseImagePayloadFromDOM, IMAGE_STATE_CONFIGS, ImageNode } from "@/editor/extensions/image/nodes";
import { createInlineSvg } from "@/editor/extensions/image/utils";
import type { ImagePayload } from "@/editor/extensions/image/types";

/**
 * @deprecated The scene is now embedded in the src, this is kept to read older documents
 */
const sketchValueState = createState("value", {
  parse: (v) => (Array.isArray(v) ? (v as NonDeleted<ExcalidrawElement>[]) : null),
});

export type SketchPayload = ImagePayload;

export class SketchNode extends ImageNode {
  $config() {
    return this.config("sketch", {
      extends: ImageNode,
      importDOM: buildImportMap({
        figure: (domNode: HTMLElement) => {
          if (domNode.dataset.type !== "sketch") {
            return null;
          }
          return {
            conversion: (domNode: HTMLElement): DOMConversionOutput => ({
              node: $createSketchNode($parseImagePayloadFromDOM(domNode)),
            }),
            priority: 2,
          };
        },
      }),
      stateConfigs: [...IMAGE_STATE_CONFIGS, { flat: true, stateConfig: sketchValueState }],
    });
  }

  getDefaultFilter() {
    return "auto" as const;
  }

  getDefaultAltText() {
    return "Sketch";
  }

  createMediaElement() {
    return createInlineSvg(this.getSrc(), this.getWidth(), this.getHeight());
  }

  /** @deprecated The scene is now embedded in the src */
  getValue(): StateConfigValue<typeof sketchValueState> {
    return $getState(this, sketchValueState);
  }

  update(payload: Partial<SketchPayload>): this {
    const writable = super.update(payload);
    if (payload.src !== undefined) $setState(writable, sketchValueState, null);
    return writable;
  }
}

export function $createSketchNode({
  src,
  altText = "Sketch",
  width,
  height,
  float = "none",
  filter = "auto",
  id = "",
  showCaption = false,
}: SketchPayload): SketchNode {
  return $create(SketchNode)
    .setSrc(src)
    .setAltText(altText)
    .setWidth(width)
    .setHeight(height)
    .setFloat(float)
    .setFilter(filter)
    .setId(id)
    .setShowCaption(showCaption);
}

export function $isSketchNode(node: LexicalNode | null | undefined): node is SketchNode {
  return node instanceof SketchNode;
}
