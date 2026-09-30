import type { JSX } from "react";
import { createElement } from "react";
import {
  $create,
  $createNodeSelection,
  $getState,
  $getStateChange,
  $setSelection,
  $setState,
  BaseSelection,
  buildImportMap,
  createState,
  DOMConversionOutput,
  DOMExportOutput,
  EditorConfig,
  LexicalNode,
  StateConfigValue,
  StateValueOrUpdater,
} from "lexical";
import { DecoratorTextNode } from "@lexical/extension";
import { convertLatexToMarkup } from "mathlive";
import MathComponent from "./decorator";
import { idState } from "@/editor/extensions/shared/states";
import { getNodeAnchorName } from "@/editor/utils/getEditorContainer";

const valueState = createState("value", {
  parse: (v) => (typeof v === "string" ? v : ""),
});

const styleState = createState("style", {
  parse: (v) => (typeof v === "string" ? v : ""),
});

function $convertMathElement(domNode: HTMLElement): null | DOMConversionOutput {
  const value = valueState.parse(domNode.dataset.value);
  const id = idState.parse(domNode.id);
  const style = styleState.parse(domNode.style.cssText);
  const node = $createMathNode(value, style, id);
  return { node };
}

export class MathNode extends DecoratorTextNode {
  $config() {
    return this.config("math", {
      extends: DecoratorTextNode,
      importDOM: buildImportMap({
        span: (domNode: HTMLElement) => {
          if (domNode.dataset.type !== "math") {
            return null;
          }
          return {
            conversion: $convertMathElement,
            priority: 1,
          };
        },
      }),
      stateConfigs: [
        { flat: true, stateConfig: valueState },
        { flat: true, stateConfig: styleState },
        { flat: true, stateConfig: idState },
      ],
    });
  }

  exportDOM(): DOMExportOutput {
    const element = document.createElement("span");
    element.className = "LexicalTheme__math";
    const style = this.getStyle();
    if (style) element.style.cssText = style;
    const id = this.getId();
    if (id) element.id = id;
    element.dataset.type = this.getType();
    element.dataset.value = this.getValue();
    element.innerHTML = convertLatexToMarkup(this.getValue(), {
      registers: { arraystretch: 1.5 },
    });
    return { element };
  }

  createDOM(config: EditorConfig): HTMLElement {
    const element = document.createElement("span");
    const className = config.theme.math;
    if (className !== undefined) {
      element.className = className;
    }
    element.style.cssText = this.getStyle();
    element.style.setProperty("anchor-name", getNodeAnchorName(this.getKey()));
    const id = this.getId();
    if (id) element.id = id;
    return element;
  }

  updateDOM(prevNode: this, dom: HTMLElement): boolean {
    const styleChange = $getStateChange(this, prevNode, styleState);
    if (styleChange) {
      dom.style.cssText = styleChange[0];
      dom.style.setProperty("anchor-name", getNodeAnchorName(this.getKey()));
    }
    const idChange = $getStateChange(this, prevNode, idState);
    if (idChange) {
      dom.id = idChange[0];
    }
    return false;
  }

  getText(): string {
    return `$${this.getValue()}$`;
  }

  getTextContentSize(): number {
    return this.getValue().length + 2;
  }

  getTextContent(): string {
    return `$${this.getValue()}$`;
  }

  getValue(): StateConfigValue<typeof valueState> {
    return $getState(this, valueState);
  }

  setValue(valueOrUpdater: StateValueOrUpdater<typeof valueState>): this {
    return $setState(this, valueState, valueOrUpdater);
  }

  getStyle(): StateConfigValue<typeof styleState> {
    return $getState(this, styleState);
  }

  setStyle(valueOrUpdater: StateValueOrUpdater<typeof styleState>): this {
    return $setState(this, styleState, valueOrUpdater);
  }

  getId(): StateConfigValue<typeof idState> {
    return $getState(this, idState);
  }

  setId(valueOrUpdater: StateValueOrUpdater<typeof idState>): this {
    return $setState(this, idState, valueOrUpdater);
  }

  select() {
    const nodeSelection = $createNodeSelection();
    nodeSelection.add(this.getKey());
    $setSelection(nodeSelection);
  }

  isSelected(selection?: null | BaseSelection): boolean {
    try {
      return super.isSelected(selection);
    } catch {
      return false;
    }
  }

  decorate(): JSX.Element {
    return createElement(MathComponent, { initialValue: this.getValue(), nodeKey: this.getKey() });
  }
}

export function $createMathNode(value = "", style = "", id = ""): MathNode {
  return $create(MathNode).setValue(value).setStyle(style).setId(id);
}

export function $isMathNode(node: LexicalNode | null | undefined): node is MathNode {
  return node instanceof MathNode;
}
