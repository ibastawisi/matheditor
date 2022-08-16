/* eslint-disable react-hooks/exhaustive-deps */
import { $createNodeSelection, $createRangeSelection, $getSelection, $isRangeSelection, $setSelection, COMMAND_PRIORITY_LOW, CONTROLLED_TEXT_INSERTION_COMMAND, EditorConfig, GridSelection, LexicalEditor, LexicalNode, NodeKey, NodeSelection, RangeSelection, SELECTION_CHANGE_COMMAND, SerializedLexicalNode, Spread, } from 'lexical';
import { useLexicalComposerContext } from '@lexical/react/LexicalComposerContext';
import { $getNodeByKey, DecoratorNode, } from 'lexical';
import { createRef, useEffect, useState } from 'react';
import { useLexicalNodeSelection } from '@lexical/react/useLexicalNodeSelection';
import { mergeRegister } from '@lexical/utils';
import type { MathfieldElement } from "mathlive";
import "mathlive/dist/mathlive.min.js"

declare global {
  /** @internal */
  namespace JSX {
    interface IntrinsicElements {
      'math-field': React.DetailedHTMLProps<React.HTMLAttributes<MathfieldElement>, MathfieldElement>
    }
  }
}

type MathComponentProps = { initialValue: string; nodeKey: NodeKey; mathfieldRef: React.RefObject<MathfieldElement>; };

function MathComponent({ initialValue, nodeKey, mathfieldRef: ref }: MathComponentProps): JSX.Element {
  const [editor] = useLexicalComposerContext();
  const [selection, setSelection] = useState<RangeSelection | NodeSelection | GridSelection | null>(null);
  const [isSelected, setSelected, clearSelection] = useLexicalNodeSelection(nodeKey);
  const [wasBlured, setWasBlured] = useState(false);

  useEffect(() => {
    const mathfield = ref.current;
    if (!mathfield) return;
    return mergeRegister(
      editor.registerUpdateListener(({ editorState }) => {
        setSelection(editorState.read(() => $getSelection()));
      }),
      editor.registerCommand(SELECTION_CHANGE_COMMAND, () => {
        if (wasBlured) return false;
        const selection = $getSelection();
        if (!$isRangeSelection(selection) || !selection.isCollapsed()) return false;

        const node = selection.getNodes()[0];
        const nextSibling = node.getNextSibling();
        const previousSibling = node.getPreviousSibling();
        const currentKey = node.getKey();
        const nextSiblingKey = nextSibling?.getKey();
        const prevSiblingKey = previousSibling?.getKey();
        if (!$isMathNode(node) && !$isMathNode(nextSibling) && !$isMathNode(previousSibling)) return false;
        if (currentKey !== nodeKey && nextSiblingKey !== nodeKey && prevSiblingKey !== nodeKey) return false;

        const mathNode = $getNodeByKey(nodeKey)!;
        const anchor = selection.anchor;
        const anchorOffset = anchor.offset;
        const anchorNode = anchor.getNode();

        const isParentAnchor = anchorNode === mathNode.getParent();
        const indexWithinParent = mathNode.getIndexWithinParent();

        const offset = isParentAnchor ? anchorOffset - indexWithinParent :
          anchorNode.isBefore(mathNode) ? anchorOffset - anchorNode.getTextContentSize() : anchorOffset + 1;

        if (offset === 0 || offset === 1) {
          mathfield.focus();
          mathfield.executeCommand(offset === 0 ? 'moveToMathFieldStart' : 'moveToMathFieldEnd');
          return true;
        }

        return false;
      }, COMMAND_PRIORITY_LOW),
      editor.registerCommand(CONTROLLED_TEXT_INSERTION_COMMAND, eventOrText => {
        const node = $getNodeByKey(nodeKey);
        if (!$isMathNode(node)) return false;
        if (eventOrText === node.getValue()) return true;
        return false;
      }, COMMAND_PRIORITY_LOW),
    );
  }, [ref, wasBlured]);

  useEffect(() => {
    const mathfield = ref.current;
    if (!mathfield) return;
    const active = isSelected && $isRangeSelection(selection);
    mathfield.classList.toggle("selection-active", active);

    // hack to restore focus
    if (!selection && document.activeElement === mathfield) setSelected(true);
    if (mathfield.hasFocus()) {
      const mathfieldSelection = mathfield.selection;
      mathfield.select();
      mathfield.selection = mathfieldSelection;
    }
  }, [ref, isSelected, selection]);

  useEffect(() => {
    const mathfield = ref.current;
    if (!mathfield) return;

    const readOnly = editor.isReadOnly();
    mathfield.setValue(initialValue, { suppressChangeNotifications: true });
    mathfield.virtualKeyboardMode = readOnly ? "off" : "onfocus";
    mathfield.virtualKeyboardTheme = "material";
    mathfield.mathModeSpace = "\\,";
    mathfield.keypressSound = "none";
    mathfield.plonkSound = "none";
    mathfield.readOnly = readOnly;

    const shadowStyle = mathfield.shadowRoot?.querySelector('style');
    shadowStyle?.append('.ML__container{ min-height: unset !important; } :host(:not(:focus-within)) .ML__selection { background-color: transparent !important; }');

    if (readOnly) return;

    // focus newly created mathfield
    if (isSelected && !mathfield.hasFocus()) {
      mathfield.focus();
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
        const currentValue = node.getValue();
        value !== currentValue && node.setValue(value);
      });
    }, false);

    mathfield.addEventListener("focus", event => {
      clearSelection();
      setSelected(true);
    });

    mathfield.addEventListener("blur", event => {
      setWasBlured(true);
      setTimeout(() => setWasBlured(false), 100);
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

  }, [ref]);

  return <math-field ref={ref} {...{ "read-only": true, "fonts-directory": "/mathlive/fonts" }} />;
}

export type SerializedMathNode = Spread<{ type: 'math'; value: string; }, SerializedLexicalNode>;

export class MathNode extends DecoratorNode<JSX.Element> {
  __value: string;
  __mathfieldRef = createRef<MathfieldElement>();

  static getType(): string {
    return 'math';
  }

  static clone(node: MathNode): MathNode {
    return new MathNode(node.__value, node.__key);
  }

  constructor(value: string, key?: NodeKey) {
    super(key);
    this.__value = value;
  }

  static importJSON(serializedNode: SerializedMathNode): MathNode {
    const node = $createMathNode(
      serializedNode.value,
    );
    return node;
  }

  exportJSON(): SerializedMathNode {
    return {
      value: this.getValue(),
      type: 'math',
      version: 1,
    };
  }

  createDOM(_config: EditorConfig, _editor: LexicalEditor): HTMLElement {
    const dom = document.createElement('span');
    dom.style.display = 'inline-flex';
    return dom;
  }

  updateDOM(prevNode: MathNode): boolean {
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

  select() {
    const nodeSelection = $createNodeSelection();
    nodeSelection.add(this.getKey());
    $setSelection(nodeSelection);
  }

  decorate(): JSX.Element {
    return <MathComponent initialValue={this.__value} nodeKey={this.__key} mathfieldRef={this.__mathfieldRef} />
  }
}

export function $createMathNode(value = ''): MathNode {
  const mathNode = new MathNode(value);
  return mathNode;
}

export function $isMathNode(node: LexicalNode | null | undefined): node is MathNode {
  return node instanceof MathNode;
}
