import {
  $create,
  $getState,
  $getStateChange,
  $setState,
  buildImportMap,
  createState,
  DOMConversionOutput,
  LexicalEditor,
  LexicalNode,
  StateConfigValue,
  StateValueOrUpdater,
} from "lexical";

import { $parseImagePayloadFromDOM, IMAGE_STATE_CONFIGS, ImageNode } from "@/editor/extensions/image/nodes";
import { createInlineSvg } from "@/editor/extensions/image/utils";
import type { ImagePayload } from "@/editor/extensions/image/types";

/** The GeoGebra applet state encoded as base64 */
const graphValueState = createState("value", {
  parse: (v) => (typeof v === "string" ? v : ""),
});

export type GraphPayload = ImagePayload & { value: string };

export class GraphNode extends ImageNode {
  $config() {
    return this.config("graph", {
      extends: ImageNode,
      importDOM: buildImportMap({
        figure: (domNode: HTMLElement) => {
          if (domNode.dataset.type !== "graph") {
            return null;
          }
          return {
            conversion: (domNode: HTMLElement): DOMConversionOutput => ({
              node: $createGraphNode({
                ...$parseImagePayloadFromDOM(domNode),
                value: graphValueState.parse(domNode.dataset.value),
              }),
            }),
            priority: 2,
          };
        },
      }),
      stateConfigs: [...IMAGE_STATE_CONFIGS, { flat: true, stateConfig: graphValueState }],
    });
  }

  getDefaultFilter() {
    return "auto" as const;
  }

  getDefaultAltText() {
    return "Graph";
  }

  createMediaElement(editor: LexicalEditor) {
    const src = this.getSrc();
    if (!src.startsWith("data:image/svg+xml")) return super.createMediaElement(editor);
    return createInlineSvg(src, this.getWidth(), this.getHeight());
  }

  shouldRecreateMedia(prevNode: this): boolean {
    return super.shouldRecreateMedia(prevNode) || $getStateChange(this, prevNode, graphValueState) !== null;
  }

  getValue(): StateConfigValue<typeof graphValueState> {
    return $getState(this, graphValueState);
  }

  setValue(valueOrUpdater: StateValueOrUpdater<typeof graphValueState>): this {
    return $setState(this, graphValueState, valueOrUpdater);
  }

  update(payload: Partial<GraphPayload>): this {
    const writable = super.update(payload);
    if (payload.value !== undefined) writable.setValue(payload.value);
    return writable;
  }
}

export function $createGraphNode({
  src,
  value,
  width,
  height,
  altText = "Graph",
  float = "none",
  filter = "auto",
  id = "",
  showCaption = false,
}: GraphPayload): GraphNode {
  return $create(GraphNode)
    .setSrc(src)
    .setValue(value)
    .setAltText(altText)
    .setWidth(width)
    .setHeight(height)
    .setFloat(float)
    .setFilter(filter)
    .setId(id)
    .setShowCaption(showCaption);
}

export function $isGraphNode(node: LexicalNode | null | undefined): node is GraphNode {
  return node instanceof GraphNode;
}
