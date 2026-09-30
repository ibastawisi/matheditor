import type { JSX } from "react";
import { createElement } from "react";
import {
  $create,
  buildImportMap,
  DecoratorNode,
  DOMConversionOutput,
  DOMExportOutput,
  EditorConfig,
  LexicalNode,
} from "lexical";

import HorizontalRuleComponent from "./decorator";

function $convertHorizontalRuleElement(): DOMConversionOutput {
  return { node: $createHorizontalRuleNode() };
}

export class HorizontalRuleNode extends DecoratorNode<JSX.Element> {
  $config() {
    return this.config("horizontalrule", {
      extends: DecoratorNode,
      importDOM: buildImportMap({
        hr: () => ({
          conversion: $convertHorizontalRuleElement,
          priority: 0,
        }),
      }),
    });
  }

  exportDOM(): DOMExportOutput {
    return { element: document.createElement("hr") };
  }

  createDOM(config: EditorConfig): HTMLElement {
    const dom = document.createElement("hr");
    const className = config.theme.hr;
    if (className !== undefined) {
      dom.className = className;
    }
    return dom;
  }

  getTextContent(): string {
    return "\n";
  }

  isInline(): false {
    return false;
  }

  updateDOM(): boolean {
    return false;
  }

  decorate() {
    return createElement(HorizontalRuleComponent, { nodeKey: this.getKey() });
  }
}

export function $createHorizontalRuleNode(): HorizontalRuleNode {
  return $create(HorizontalRuleNode);
}

export function $isHorizontalRuleNode(node: LexicalNode | null | undefined): node is HorizontalRuleNode {
  return node instanceof HorizontalRuleNode;
}
