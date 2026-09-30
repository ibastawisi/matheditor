import type { JSX } from "react";
import { createElement } from "react";
import {
  $create,
  buildImportMap,
  DecoratorNode,
  DOMExportOutput,
  LexicalNode,
} from "lexical";
import PageBreakComponent from "./decorator";

export class PageBreakNode extends DecoratorNode<JSX.Element> {
  $config() {
    return this.config("page-break", {
      extends: DecoratorNode,
      importDOM: buildImportMap({
        figure: (domNode: HTMLElement) => {
          const type = domNode.getAttribute("type") ?? domNode.dataset.type;
          if (type !== "page-break") return null;
          return {
            conversion: () => ({ node: $createPageBreakNode() }),
            priority: 1,
          };
        },
      }),
    });
  }

  createDOM(): HTMLElement {
    const element = document.createElement("figure");
    element.style.pageBreakAfter = "always";
    element.setAttribute("type", this.getType());
    return element;
  }

  exportDOM(): DOMExportOutput {
    return { element: this.createDOM() };
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

  decorate(): JSX.Element {
    return createElement(PageBreakComponent, { nodeKey: this.getKey() });
  }
}

export function $createPageBreakNode(): PageBreakNode {
  return $create(PageBreakNode);
}

export function $isPageBreakNode(node: LexicalNode | null | undefined): node is PageBreakNode {
  return node instanceof PageBreakNode;
}
