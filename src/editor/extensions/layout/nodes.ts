import {
  $create,
  $getState,
  $getStateChange,
  $setState,
  buildImportMap,
  createState,
  DOMConversionOutput,
  DOMExportOutput,
  EditorConfig,
  ElementNode,
  isHTMLElement,
  LexicalEditor,
  LexicalNode,
  StateConfigValue,
  StateValueOrUpdater,
} from "lexical";
import { addClassNamesToElement } from "@lexical/utils";

const templateColumnsState = createState("templateColumns", {
  parse: (v) => (typeof v === "string" && v.trim() !== "" ? v.trim() : "1fr 1fr"),
});

function $convertLayoutContainerElement(domNode: HTMLElement): DOMConversionOutput | null {
  const template = templateColumnsState.parse(domNode.dataset.templateColumns);
  return {
    node: $createLayoutContainerNode(template),
  };
}

export class LayoutContainerNode extends ElementNode {
  $config() {
    return this.config("layout-container", {
      extends: ElementNode,
      importDOM: buildImportMap({
        div: (domNode: HTMLElement) => {
          if (domNode.dataset.type !== "layout-container") {
            return null;
          }
          return {
            conversion: $convertLayoutContainerElement,
            priority: 1,
          };
        },
      }),
      stateConfigs: [{ flat: true, stateConfig: templateColumnsState }],
    });
  }

  createDOM(config: EditorConfig): HTMLElement {
    const dom = document.createElement("div");
    dom.style.gridTemplateColumns = this.getTemplateColumns();
    if (typeof config.theme.layoutContainer === "string") {
      addClassNamesToElement(dom, config.theme.layoutContainer);
    }
    return dom;
  }

  exportDOM(editor: LexicalEditor): DOMExportOutput {
    const element = this.createDOM(editor._config);
    if (isHTMLElement(element)) {
      element.dataset.type = this.getType();
      element.dataset.templateColumns = this.getTemplateColumns();
    }
    return { element };
  }

  updateDOM(prevNode: this, dom: HTMLElement): boolean {
    const change = $getStateChange(this, prevNode, templateColumnsState);
    if (change) {
      dom.style.gridTemplateColumns = change[0];
    }
    return false;
  }

  canBeEmpty(): boolean {
    return false;
  }

  getTemplateColumns(): StateConfigValue<typeof templateColumnsState> {
    return $getState(this, templateColumnsState);
  }

  setTemplateColumns(valueOrUpdater: StateValueOrUpdater<typeof templateColumnsState>): this {
    return $setState(this, templateColumnsState, valueOrUpdater);
  }
}

export function $createLayoutContainerNode(templateColumns: string): LayoutContainerNode {
  return $create(LayoutContainerNode).setTemplateColumns(templateColumns);
}

export function $isLayoutContainerNode(node: LexicalNode | null | undefined): node is LayoutContainerNode {
  return node instanceof LayoutContainerNode;
}

function $convertLayoutItemElement(): DOMConversionOutput | null {
  return {
    node: $createLayoutItemNode(),
  };
}

export class LayoutItemNode extends ElementNode {
  $config() {
    return this.config("layout-item", {
      extends: ElementNode,
      importDOM: buildImportMap({
        div: (domNode: HTMLElement) => {
          if (domNode.dataset.type !== "layout-item") {
            return null;
          }
          return {
            conversion: $convertLayoutItemElement,
            priority: 1,
          };
        },
      }),
    });
  }

  createDOM(config: EditorConfig): HTMLElement {
    const dom = document.createElement("div");
    if (typeof config.theme.layoutItem === "string") {
      addClassNamesToElement(dom, config.theme.layoutItem);
    }
    return dom;
  }

  exportDOM(editor: LexicalEditor): DOMExportOutput {
    const element = this.createDOM(editor._config);
    if (isHTMLElement(element)) {
      element.dataset.type = this.getType();
    }
    return { element };
  }

  updateDOM(): boolean {
    return false;
  }

  isShadowRoot(): boolean {
    return true;
  }
}

export function $createLayoutItemNode(): LayoutItemNode {
  return $create(LayoutItemNode);
}

export function $isLayoutItemNode(node: LexicalNode | null | undefined): node is LayoutItemNode {
  return node instanceof LayoutItemNode;
}
