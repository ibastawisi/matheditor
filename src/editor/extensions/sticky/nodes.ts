import {
  $create,
  $getState,
  $getStateChange,
  $setState,
  buildImportMap,
  DOMConversionOutput,
  DOMExportOutput,
  EditorConfig,
  ElementNode,
  LexicalEditor,
  LexicalNode,
  LexicalParseJSON,
  SerializedElementNode,
  StateConfigValue,
  StateValueOrUpdater,
} from "lexical";
import { addClassNamesToElement, removeClassNamesFromElement } from "@lexical/utils";
import { colorState, backgroundColorState, floatState } from "./states";
import type { NoteFloat } from "./types";
import { $appendLegacyNestedEditor, getLegacyStyle } from "@/editor/extensions/legacy/utils";
import { getNodeAnchorName } from "@/editor/utils/getEditorContainer";

const DRAG_ICON_PATH = "M11 18c0 1.1-.9 2-2 2s-2-.9-2-2 .9-2 2-2 2 .9 2 2m-2-8c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2m0-6c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2m6 4c1.1 0 2-.9 2-2s-.9-2-2-2-2 .9-2 2 .9 2 2 2m0 2c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2m0 6c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2";

function $convertStickyElement(domNode: HTMLElement): DOMConversionOutput {
  const color = colorState.parse(domNode.dataset.color);
  const backgroundColor = backgroundColorState.parse(domNode.dataset.backgroundColor);
  const float = floatState.parse(domNode.dataset.float);
  return {
    node: $createStickyNode(color, backgroundColor, float),
  };
}

function floatElement(dom: HTMLElement, config: EditorConfig, float: NoteFloat) {
  const floatTheme = config.theme.float;
  if (!floatTheme) return;
  for (const format of ["left", "right"] as const) {
    const className = floatTheme[format];
    if (!className) continue;
    if (format === float) addClassNamesToElement(dom, className);
    else removeClassNamesFromElement(dom, className);
  }
}

function createDragButton() {
  const tools = document.createElement("div");
  tools.className = "sticky-tools";
  tools.contentEditable = "false";
  const dragButton = document.createElement("button");
  dragButton.type = "button";
  dragButton.draggable = true;
  dragButton.className = "drag-btn";
  dragButton.title = "Drag";
  dragButton.setAttribute("aria-label", "Drag sticky note");
  dragButton.innerHTML = `<svg viewBox="0 0 24 24" width="1em" height="1em" fill="currentColor" aria-hidden="true"><path d="${DRAG_ICON_PATH}"></path></svg>`;
  tools.appendChild(dragButton);
  return tools;
}

export class StickyNode extends ElementNode {
  $config() {
    return this.config("sticky", {
      extends: ElementNode,
      importDOM: buildImportMap({
        div: (domNode: HTMLElement) => {
          if (domNode.dataset.type !== "sticky") {
            return null;
          }
          return {
            conversion: $convertStickyElement,
            priority: 2,
          };
        },
      }),
      stateConfigs: [
        { flat: true, stateConfig: colorState },
        { flat: true, stateConfig: backgroundColorState },
        { flat: true, stateConfig: floatState },
      ],
    });
  }

  updateFromJSON(serializedNode: LexicalParseJSON<SerializedElementNode>): this {
    const node = super.updateFromJSON(serializedNode);
    // sticky notes used to be decorators, with a nested editor and a css style string instead of children
    if ("children" in serializedNode) return node;
    const legacyStyle = getLegacyStyle(serializedNode);
    if (legacyStyle) {
      node.setColor(colorState.parse(legacyStyle.color));
      node.setBackgroundColor(backgroundColorState.parse(legacyStyle["background-color"]));
      node.setFloat(floatState.parse(legacyStyle.float));
    }
    if ("editor" in serializedNode) {
      $appendLegacyNestedEditor(node, serializedNode.editor);
    }
    return node;
  }

  createDOM(config: EditorConfig, editor: LexicalEditor): HTMLElement {
    const dom = document.createElement("div");
    dom.className = "sticky-note";
    dom.setAttribute("theme", "light");
    dom.style.setProperty("anchor-name", getNodeAnchorName(this.getKey()));
    const color = this.getColor();
    if (color) dom.style.color = color;
    dom.style.backgroundColor = this.getBackgroundColor();
    floatElement(dom, config, this.getFloat());
    if (editor.isEditable()) {
      dom.appendChild(createDragButton());
    }
    const content = document.createElement("div");
    content.className = "sticky-note-content";
    dom.appendChild(content);
    return dom;
  }

  getDOMSlot(element: HTMLElement) {
    return super.getDOMSlot(element).withElement(element.querySelector<HTMLElement>(":scope > .sticky-note-content")!);
  }

  updateDOM(prevNode: this, dom: HTMLElement, config: EditorConfig): boolean {
    const colorChange = $getStateChange(this, prevNode, colorState);
    const backgroundColorChange = $getStateChange(this, prevNode, backgroundColorState);
    const floatChange = $getStateChange(this, prevNode, floatState);
    if (colorChange) {
      dom.style.color = colorChange[0];
    }
    if (backgroundColorChange) {
      dom.style.backgroundColor = backgroundColorChange[0];
    }
    if (floatChange) {
      floatElement(dom, config, floatChange[0]);
    }
    return false;
  }

  exportDOM(editor: LexicalEditor): DOMExportOutput {
    const element = document.createElement("div");
    element.className = "sticky-note";
    element.setAttribute("theme", "light");
    const color = this.getColor();
    if (color) element.style.color = color;
    element.style.backgroundColor = this.getBackgroundColor();
    floatElement(element, editor._config, this.getFloat());
    element.dataset.type = this.getType();
    if (color) element.dataset.color = color;
    element.dataset.backgroundColor = this.getBackgroundColor();
    element.dataset.float = this.getFloat();
    return { element };
  }

  isShadowRoot(): boolean {
    return true;
  }

  isInline(): boolean {
    return false;
  }

  canBeEmpty(): boolean {
    return false;
  }

  getColor(): StateConfigValue<typeof colorState> {
    return $getState(this, colorState);
  }

  setColor(valueOrUpdater: StateValueOrUpdater<typeof colorState>): this {
    return $setState(this, colorState, valueOrUpdater);
  }

  getBackgroundColor(): StateConfigValue<typeof backgroundColorState> {
    return $getState(this, backgroundColorState);
  }

  setBackgroundColor(valueOrUpdater: StateValueOrUpdater<typeof backgroundColorState>): this {
    return $setState(this, backgroundColorState, valueOrUpdater);
  }

  getFloat(): StateConfigValue<typeof floatState> {
    return $getState(this, floatState);
  }

  setFloat(valueOrUpdater: StateValueOrUpdater<typeof floatState>): this {
    return $setState(this, floatState, valueOrUpdater);
  }
}

export function $createStickyNode(
  color: string = "",
  backgroundColor: string = "#bceac4",
  float: NoteFloat = "right"
): StickyNode {
  return $create(StickyNode).setColor(color).setBackgroundColor(backgroundColor).setFloat(float);
}

export function $isStickyNode(node: LexicalNode | null | undefined): node is StickyNode {
  return node instanceof StickyNode;
}
