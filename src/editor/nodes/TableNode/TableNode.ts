import {
  TableNode as LexicalTableNode,
  SerializedTableNode as LexicalSerializedTableNode,
} from '@lexical/table';


import type {
  BaseSelection,
  DOMConversionMap,
  DOMConversionOutput,
  DOMExportOutput,
  EditorConfig,
  LexicalEditor,
  LexicalNode,
  NodeKey,
} from 'lexical';

import { isHTMLElement, $isEditorIsNestedEditor } from '@lexical/utils';
import {
  $applyNodeReplacement,
} from 'lexical';
import { getStyleObjectFromRawCSS } from '../utils';
import { getEditorNodes } from '@/editor/utils/getEditorNodes';

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
    const node = $createTableNode();
    node.setFormat(_serializedNode.format);
    node.setDirection(_serializedNode.direction);
    node.setStyle(_serializedNode.style);
    node.setRowStriping(_serializedNode.rowStriping || false);
    // if (_serializedNode.colWidths) node.setColWidths(_serializedNode.colWidths);
    return node;
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

  createDOM(config: EditorConfig, editor: LexicalEditor): HTMLElement {
    const element = super.createDOM(config, editor);

    const formatType = this.getFormatType();
    element.style.textAlign = formatType;
    const direction = this.getDirection();
    if (direction) {
      element.dir = direction;
    }
    const styles = getStyleObjectFromRawCSS(this.__style);
    const float = styles.float;
    element.style.float = float;

    const nodes = getEditorNodes(editor).filter($isTableNode);
    const index = nodes.findIndex((node) => node.getKey() === this.getKey());
    element.id = `table-${index + 1}`;
    return element;
  }

  updateDOM(prevNode: this, dom: HTMLElement, config: EditorConfig): boolean {
    if (!isHTMLElement(dom)) {
      return super.updateDOM(prevNode, dom, config);
    }
    if (this.__style !== prevNode.__style) {
      const styles = getStyleObjectFromRawCSS(this.__style);
      const float = styles.float;
      dom.style.float = float;
    }
    return super.updateDOM(prevNode, dom, config);
  }

  exportDOM(editor: LexicalEditor): DOMExportOutput {
    const output = super.exportDOM(editor);
    const element = output.element;
    if (element && isHTMLElement(element)) {
      const style = this.getStyle();
      if (style) {
        element.style.cssText = style;
      }
      const formatType = this.getFormatType();
      element.style.textAlign = formatType;
      const direction = this.getDirection();
      if (direction) {
        element.dir = direction;
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

  isSelected(selection?: null | BaseSelection): boolean {
    try {
      return super.isSelected(selection);
    } catch (e) {
      return false;
    }
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