import {
  TableNode as LexicalTableNode,
  SerializedTableNode as LexicalSerializedTableNode,
} from '@lexical/table';


import type {
  DOMConversionMap,
  DOMConversionOutput,
  DOMExportOutput,
  EditorConfig,
  LexicalEditor,
  LexicalNode,
  NodeKey,
} from 'lexical';

import { isHTMLElement } from '@lexical/utils';
import {
  $applyNodeReplacement,
} from 'lexical';

export type SerializedTableNode = LexicalSerializedTableNode & {
  style: string;
};

/** @noInheritDoc */
export class TableNode extends LexicalTableNode {
  __style: string;
  static getType(): string {
    return 'matheditor-table';
  }

  static clone(node: TableNode): TableNode {
    const tableNode = new TableNode(node.__key);
    tableNode.__style = node.__style;
    return tableNode;
  }

  static importDOM(): DOMConversionMap | null {
    return {
      table: (_node: Node) => ({
        conversion: $convertTableElement,
        priority: 1,
      }),
    };
  }

  static importJSON(_serializedNode: SerializedTableNode): TableNode {
    const tableNode = $createTableNode();
    tableNode.__style = _serializedNode.style;
    return tableNode;
  }

  constructor(key?: NodeKey) {
    super(key);
    this.__style = '';
  }

  exportJSON(): SerializedTableNode {
    return {
      ...super.exportJSON(),
      style: this.__style,
      type: TableNode.getType(),
    };
  }

  createDOM(config: EditorConfig, editor?: LexicalEditor): HTMLElement {
    const tableElement = super.createDOM(config, editor);

    if (this.__style) {
      tableElement.style.cssText = this.__style;
    }

    return tableElement;
  }

  updateDOM(): boolean {
    const prevNode = arguments[0] as TableNode;
    return (
      super.updateDOM() ||
      this.__style !== prevNode.__style
    );
  }

  exportDOM(editor: LexicalEditor): DOMExportOutput {
    const output = super.exportDOM(editor);
    const element = output.element;
    if (element && isHTMLElement(element)) {
      if (this.__style) {
        element.style.cssText = this.__style;
      }
    }
    return output;
  }

  getStyle(): string {
    const self = this.getLatest();
    return self.__style;
  }

  setStyle(style: string): this {
    const self = this.getWritable();
    self.__style = style;
    return self;
  }


}

export function $convertTableElement(_domNode: Node): DOMConversionOutput {
  const domNode = _domNode as HTMLTableElement;
  const tableNode = $createTableNode();
  tableNode.__style = domNode.style.cssText;
  return { node: tableNode };
}

export function $createTableNode(): TableNode {
  return $applyNodeReplacement(new TableNode());
}

export function $isTableNode(
  node: LexicalNode | null | undefined,
): node is TableNode {
  return node instanceof TableNode;
}