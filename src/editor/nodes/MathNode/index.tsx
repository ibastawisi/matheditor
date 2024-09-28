import { $createNodeSelection, $setSelection, BaseSelection, DOMExportOutput, EditorConfig, LexicalEditor, LexicalNode, NodeKey, SerializedLexicalNode, Spread, isHTMLElement, } from 'lexical';
import { DecoratorNode, } from 'lexical';
import { convertLatexToMarkup } from 'mathlive';
import MathComponent from './MathComponent';
import { $isEditorIsNestedEditor } from '@lexical/utils';

export type SerializedMathNode = Spread<{ type: 'math'; value: string; style: string }, SerializedLexicalNode>;

export class MathNode extends DecoratorNode<JSX.Element> {
  __value: string;
  __style: string;

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
    const element = document.createElement('span');
    const style = this.__style;
    if (style !== '') {
      element.style.cssText = style;
    }
    const className = config.theme.math;
    if (className !== undefined) {
      element.className = className;
    }
    const nodeMap = Object.fromEntries(editor.getEditorState()._nodeMap);
    const nodes = Object.values(nodeMap).filter($isMathNode);
    if ($isEditorIsNestedEditor(editor)) return element;
    const index = nodes.findIndex((node) => node.getKey() === this.getKey());
    element.id = `formula-${index + 1}`;
    return element;
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

  isSelected(selection?: null | BaseSelection): boolean {
    try {
      return super.isSelected(selection);
    } catch (e) {
      return false;
    }
  }

  decorate(): JSX.Element {
    return (
      <MathComponent initialValue={this.__value} nodeKey={this.__key} />
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
