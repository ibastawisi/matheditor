import { $createNodeSelection, $setSelection, DOMExportOutput, EditorConfig, LexicalEditor, LexicalNode, NodeKey, SerializedLexicalNode, Spread, isHTMLElement, } from 'lexical';
import { DecoratorNode, } from 'lexical';
import { createRef } from 'react';
import { convertLatexToMarkup, type MathfieldElement } from 'mathlive';
import MathComponent from './MathComponent';
import { $isEditorIsNestedEditor } from '@lexical/utils';

export type SerializedMathNode = Spread<{ type: 'math'; value: string; style: string }, SerializedLexicalNode>;

export class MathNode extends DecoratorNode<JSX.Element> {
  __value: string;
  __style: string;
  __mathfieldRef = createRef<MathfieldElement>();

  static getType(): string {
    return 'math';
  }

  static clone(node: MathNode): MathNode {
    return new MathNode(node.__value, node.__style, node.__key);
  }

  constructor(value: string, style: string, key?: NodeKey) {
    super(key);
    this.__value = value;
    this.__style = style;
  }

  static importJSON(serializedNode: SerializedMathNode): MathNode {
    const node = $createMathNode(
      serializedNode.value,
      serializedNode.style,
    );
    return node;
  }

  exportJSON(): SerializedMathNode {
    return {
      value: this.getValue(),
      style: this.getStyle(),
      type: 'math',
      version: 1,
    };
  }

  exportDOM(editor: LexicalEditor): DOMExportOutput {
    const { element } = super.exportDOM(editor);
    if (element && isHTMLElement(element)) {
      element.innerHTML = convertLatexToMarkup(this.getValue(), {
        registers: { 'arraystretch': 1.5 },
      });
    }
    return { element };
  }

  createDOM(config: EditorConfig, editor: LexicalEditor): HTMLElement {
    const dom = document.createElement('span');
    const style = this.__style;
    if (style !== '') {
      dom.style.cssText = style;
    }
    const className = config.theme.math;
    if (className !== undefined) {
      dom.className = className;
    }
    const nodeMap = Object.fromEntries(editor.getEditorState()._nodeMap);
    const mathNodes = Object.values(nodeMap).filter($isMathNode);
    if ($isEditorIsNestedEditor(editor)) return dom;
    const index = mathNodes.findIndex((node) => node.getKey() === this.getKey());
    dom.id = `formula-${index + 1}`;
    return dom;
  }

  updateDOM(prevNode: MathNode, dom: HTMLElement): boolean {
    const prevStyle = prevNode.__style;
    const nextStyle = this.__style;
    if (prevStyle !== nextStyle) {
      dom.style.cssText = nextStyle;
      dom.style.display = 'inline-flex';
      dom.style.maxWidth = '100%';
    }
    return false;
  }

  getMathfield(): MathfieldElement | null {
    return this.__mathfieldRef.current;
  }

  getText(): string {
    return `$${this.__value}$`
  }

  getTextContentSize(): number {
    return this.__value.length + 2;
  }

  getTextContent(): string {
    return `$${this.__value}$`;
  }

  getValue(): string {
    return this.__value;
  }

  setValue(value: string): void {
    const writable = this.getWritable();
    writable.__value = value;
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

  select() {
    const nodeSelection = $createNodeSelection();
    nodeSelection.add(this.getKey());
    $setSelection(nodeSelection);
  }

  decorate(): JSX.Element {
    return (
      <MathComponent initialValue={this.__value} nodeKey={this.__key} mathfieldRef={this.__mathfieldRef} />
    );
  }
}

export function $createMathNode(value = '', style = ''): MathNode {
  const mathNode = new MathNode(value, style);
  return mathNode;
}

export function $isMathNode(node: LexicalNode | null | undefined): node is MathNode {
  return node instanceof MathNode;
}
