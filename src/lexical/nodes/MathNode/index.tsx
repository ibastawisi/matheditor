/* eslint-disable react-hooks/exhaustive-deps */
import { $createNodeSelection, $createRangeSelection, $getSelection, $isNodeSelection, $isRangeSelection, $setSelection, DOMExportOutput, EditorConfig, GridSelection, LexicalEditor, LexicalNode, NodeKey, NodeSelection, RangeSelection, SerializedLexicalNode, Spread, } from 'lexical';
import { useLexicalComposerContext } from '@lexical/react/LexicalComposerContext';
import { $getNodeByKey, DecoratorNode, } from 'lexical';
import { createRef, useCallback, useEffect, useState } from 'react';
import { useLexicalNodeSelection } from '@lexical/react/useLexicalNodeSelection';
import { mergeRegister } from '@lexical/utils';
import { MathfieldElement, MathfieldElementAttributes, convertLatexToMarkup } from "mathlive";
import { DOMAttributes } from "react";
import './index.css';

type CustomElement<T> = Partial<T & DOMAttributes<T>>;

declare global {
  namespace JSX {
    interface IntrinsicElements {
      ["math-field"]: CustomElement<MathfieldElementAttributes>;
    }
  }
}

MathfieldElement.soundsDirectory = null;
MathfieldElement.fontsDirectory = "/mathlive/fonts";
MathfieldElement.computeEngine = null;

type MathComponentProps = { initialValue: string; nodeKey: NodeKey; mathfieldRef: React.RefObject<MathfieldElement>; };

function MathComponent({ initialValue, nodeKey, mathfieldRef: ref }: MathComponentProps): JSX.Element {
  const [editor] = useLexicalComposerContext();
  const [selection, setSelection] = useState<RangeSelection | NodeSelection | GridSelection | null>(null);
  const [lastRangeSelection, setLastRangeSelection] = useState<RangeSelection | null>(null);
  const [isSelected, setSelected, clearSelection] = useLexicalNodeSelection(nodeKey);

  const isMathField = (el: HTMLElement) => el instanceof MathfieldElement;

  useEffect(() => {
    const mathfield = ref.current;
    if (!mathfield || !isMathField(mathfield)) return;
    if (initialValue !== mathfield.getValue()) {
      mathfield.setValue(initialValue, { silenceNotifications: true });
    }
  }, [initialValue]);

  useEffect(() => {
    return mergeRegister(
      editor.registerUpdateListener(({ editorState }) => {
        const newSelection = editorState.read(() => $getSelection())
        setSelection(newSelection);
        if ($isRangeSelection(newSelection)) {
          setLastRangeSelection(newSelection);
        }
      }),
    );
  }, []);

  useEffect(() => {
    const mathfield = ref.current;
    if (!mathfield) return;
    if (!isMathField(mathfield)) return;

    // reselect when selection is lost and mathfield is focused
    if (!selection && document.activeElement === mathfield) setSelected(true);

    // highlight when range selected
    const active = isSelected && $isRangeSelection(selection);
    mathfield.classList.toggle("selection-active", active);

    // focus when node selected
    if (isSelected && !mathfield.hasFocus()) {
      if (!$isNodeSelection(selection)) return;
      editor.getEditorState().read(() => {
        const mathNode = $getNodeByKey(nodeKey)
        if (!$isMathNode(mathNode)) return;
        const anchor = lastRangeSelection?.anchor;
        if (!anchor) return;
        const anchorNode = anchor.getNode();
        const anchorOffset = anchor.offset;
        const isParentAnchor = anchorNode === mathNode.getParent();
        const indexWithinParent = mathNode.getIndexWithinParent();
        const isBefore = isParentAnchor ? anchorOffset - indexWithinParent === 0 : anchorNode.isBefore(mathNode);
        focus(mathfield);
        mathfield.executeCommand(isBefore ? 'moveToMathfieldStart' : 'moveToMathfieldEnd');
      });
    }
  }, [ref, isSelected, selection]);

  useEffect(() => {
    const mathfield = ref.current;
    if (!mathfield || !isMathField(mathfield)) return;

    const readOnly = !editor.isEditable();
    mathfield.mathModeSpace = "\\,";
    mathfield.readOnly = readOnly;

    if (readOnly) return;

    // focus newly created mathfield
    if (isSelected && !mathfield.hasFocus()) {
      focus(mathfield);
    }

    mathfield.addEventListener("change", e => {
      editor.update(() => {
        const value = mathfield.getValue();
        const node = $getNodeByKey(nodeKey);
        if (!$isMathNode(node)) return;
        if (value.trim().length === 0) {
          node.selectPrevious();
          return node.remove();
        }
        value !== initialValue && node.setValue(value);
      });
    }, false);

    mathfield.addEventListener("click", event => {
      clearSelection();
      setSelected(true);
      focus(mathfield);
    });

    mathfield.addEventListener("keydown", event => {
      event.stopPropagation();
    });

    mathfield.addEventListener("move-out", event => {
      const direction = event.detail.direction;
      var range = document.createRange();
      var selection = window.getSelection();
      const span = mathfield.parentElement!;

      switch (direction) {
        case "backward":
        case "upward":
          range.setStartBefore(span);
          break;
        case "forward":
        case "downward":
          range.setStartAfter(span);
          break;
      }

      range.collapse(true);
      selection?.removeAllRanges();
      selection?.addRange(range);

      editor.update(() => {
        const rangeSelection = $createRangeSelection();
        rangeSelection.applyDOMRange(range);
        $setSelection(rangeSelection);
        if (mathfield.value.trim().length === 0) {
          const node = $getNodeByKey(nodeKey);
          $isMathNode(node) && node.remove();
        }
      });
    });

  }, []);

  const focus = useCallback((mathfield: MathfieldElement) => {
    setTimeout(() => {
      mathfield.focus();
      window.mathVirtualKeyboard.show({ animate: true });
      setTimeout(() => mathfield.hasFocus() && mathfield.executeCommand("scrollIntoView"), 300);
    });
  }, []);

  return <math-field ref={ref} read-only={true} />;
}

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

  exportDOM(): DOMExportOutput {
    const element = this.createDOM();
    element.innerHTML = convertLatexToMarkup(this.__value);
    return { element };
  }

  createDOM(): HTMLElement {
    const dom = document.createElement('span');
    const style = this.__style;
    if (style !== '') {
      dom.style.cssText = style;
    }
    dom.style.display = 'inline-flex';
    dom.style.maxWidth = '100%';
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

  setMathfield(mathfield: MathfieldElement) {
    const writable = this.getWritable();
    writable.__mathfield = mathfield;
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
    return <MathComponent initialValue={this.__value} nodeKey={this.__key} mathfieldRef={this.__mathfieldRef} />
  }
}

export function $createMathNode(value = '', style = ''): MathNode {
  const mathNode = new MathNode(value, style);
  return mathNode;
}

export function $isMathNode(node: LexicalNode | null | undefined): node is MathNode {
  return node instanceof MathNode;
}
