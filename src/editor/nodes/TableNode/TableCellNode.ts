import {
  TableCellNode as LexicalTableCellNode,
  SerializedTableCellNode as LexicalSerializedTableCellNode,
  TableCellHeaderStates,
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

import {
  $applyNodeReplacement,
  $createParagraphNode,
  $isElementNode,
  $isLineBreakNode,
  $isTextNode,
  isHTMLElement,
} from 'lexical';

import { getStyleObjectFromRawCSS } from '../utils';

export type TableCellHeaderState =
  typeof TableCellHeaderStates[keyof typeof TableCellHeaderStates];

export type SerializedTableCellNode = LexicalSerializedTableCellNode & {
  style: string;
};

/** @noInheritDoc */
export class TableCellNode extends LexicalTableCellNode {
  __style: string;
  static getType(): string {
    return 'matheditor-tablecell';
  }

  static clone(node: TableCellNode): TableCellNode {
    const cellNode = new TableCellNode(
      node.__headerState,
      node.__colSpan,
      node.__width,
      node.__key,
    );
    cellNode.__rowSpan = node.__rowSpan;
    cellNode.__backgroundColor = node.__backgroundColor;
    cellNode.__style = node.__style;
    return cellNode;
  }

  static importDOM(): DOMConversionMap | null {
    return {
      td: (node: Node) => ({
        conversion: $convertTableCellNodeElement,
        priority: 0,
      }),
      th: (node: Node) => ({
        conversion: $convertTableCellNodeElement,
        priority: 0,
      }),
    };
  }

  static importJSON(serializedNode: SerializedTableCellNode): TableCellNode {
    const colSpan = serializedNode.colSpan || 1;
    const rowSpan = serializedNode.rowSpan || 1;
    const cellNode = $createTableCellNode(
      serializedNode.headerState,
      colSpan,
      serializedNode.width || undefined,
    );
    cellNode.__rowSpan = rowSpan;
    cellNode.__backgroundColor = serializedNode.backgroundColor || null;
    cellNode.__style = serializedNode.style;
    // set the background color from the style for selection highlight in base lexical node
    const styles = getStyleObjectFromRawCSS(cellNode.__style);
    const backgroundColor = styles['background-color'];
    if (backgroundColor) {
     cellNode.__backgroundColor = backgroundColor;
    }
    return cellNode;
  }

  constructor(
    headerState = TableCellHeaderStates.NO_STATUS,
    colSpan = 1,
    width?: number,
    key?: NodeKey,
  ) {
    super(headerState, colSpan, width, key);
    this.__style = '';
  }

  createDOM(config: EditorConfig): HTMLElement {
    const element = super.createDOM(config);
    const styles = getStyleObjectFromRawCSS(this.__style);
    const color = styles.color;
    const backgroundColor = styles['background-color'];
    const writingMode = styles['writing-mode'];
    element.style.color = color;
    element.style.backgroundColor = backgroundColor;
    element.style.writingMode = writingMode;
    return element;
  }

  exportDOM(editor: LexicalEditor): DOMExportOutput {
    const element = this.createDOM(editor._config);

    if (element && isHTMLElement(element)) {
      const styles = getStyleObjectFromRawCSS(this.__style);
      const color = styles.color;
      const backgroundColor = styles['background-color'];
      const writingMode = styles['writing-mode'];
      element.style.color = color;
      element.style.backgroundColor = backgroundColor;
      element.style.writingMode = writingMode;

      // linkedom does not implement setting colSpan and rowSpan
      if (this.__colSpan > 1) {
        element.setAttribute('colspan', this.__colSpan.toString());
      }
      if (this.__rowSpan > 1) {
        element.setAttribute('rowspan', this.__rowSpan.toString());
      }
    }

    return {
      element,
    };
  }

  exportJSON(): SerializedTableCellNode {
    return {
      ...super.exportJSON(),
      style: this.__style,
      type: TableCellNode.getType(),
    };
  }


  getStyle(): string {
    return this.getLatest().__style;
  }

  setStyle(newStyle: string): void {
    const self = this.getWritable();
    self.__style = newStyle;
    // set the background color from the style for selection highlight in base lexical node
    const styles = getStyleObjectFromRawCSS(newStyle);
    const backgroundColor = styles['background-color'];
    if (backgroundColor) {
      self.__backgroundColor = backgroundColor;
    }
  }

  updateDOM(prevNode: TableCellNode): boolean {
    return (
      super.updateDOM(prevNode) ||
      prevNode.__style !== this.__style
    );
  }

}

export function $convertTableCellNodeElement(
  domNode: Node,
): DOMConversionOutput {
  const domNode_ = domNode as HTMLTableCellElement;
  const nodeName = domNode.nodeName.toLowerCase();

  let width: number | undefined = undefined;
  const PIXEL_VALUE_REG_EXP = /^(\d+(?:\.\d+)?)px$/;

  if (PIXEL_VALUE_REG_EXP.test(domNode_.style.width)) {
    width = parseFloat(domNode_.style.width);
  }

  const tableCellNode = $createTableCellNode(
    nodeName === 'th'
      ? TableCellHeaderStates.ROW
      : TableCellHeaderStates.NO_STATUS,
    domNode_.colSpan,
    width,
  );

  tableCellNode.__rowSpan = domNode_.rowSpan;
  const cssText = domNode_.style.cssText;
  tableCellNode.__style = cssText;

  const style = domNode_.style;
  const textDecoration = style.textDecoration.split(' ');
  const hasBoldFontWeight =
    style.fontWeight === '700' || style.fontWeight === 'bold';
  const hasLinethroughTextDecoration = textDecoration.includes('line-through');
  const hasItalicFontStyle = style.fontStyle === 'italic';
  const hasUnderlineTextDecoration = textDecoration.includes('underline');
  return {
    after: (childLexicalNodes) => {
      if (childLexicalNodes.length === 0) {
        childLexicalNodes.push($createParagraphNode());
      }
      return childLexicalNodes;
    },
    forChild: (lexicalNode, parentLexicalNode) => {
      if ($isTableCellNode(parentLexicalNode) && !$isElementNode(lexicalNode)) {
        const paragraphNode = $createParagraphNode();
        if (
          $isLineBreakNode(lexicalNode) &&
          lexicalNode.getTextContent() === '\n'
        ) {
          return null;
        }
        if ($isTextNode(lexicalNode)) {
          if (hasBoldFontWeight) {
            lexicalNode.toggleFormat('bold');
          }
          if (hasLinethroughTextDecoration) {
            lexicalNode.toggleFormat('strikethrough');
          }
          if (hasItalicFontStyle) {
            lexicalNode.toggleFormat('italic');
          }
          if (hasUnderlineTextDecoration) {
            lexicalNode.toggleFormat('underline');
          }
        }
        paragraphNode.append(lexicalNode);
        return paragraphNode;
      }

      return lexicalNode;
    },
    node: tableCellNode,
  };
}

export function $createTableCellNode(
  headerState: TableCellHeaderState,
  colSpan = 1,
  width?: number,
): TableCellNode {
  return $applyNodeReplacement(new TableCellNode(headerState, colSpan, width));
}

export function $isTableCellNode(
  node: LexicalNode | null | undefined,
): node is TableCellNode {
  return node instanceof TableCellNode;
}