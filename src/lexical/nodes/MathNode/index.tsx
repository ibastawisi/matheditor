/* eslint-disable react-hooks/exhaustive-deps */
import { $createNodeSelection, $createRangeSelection, $getSelection, $isNodeSelection, $isRangeSelection, $setSelection, COMMAND_PRIORITY_LOW, CONTROLLED_TEXT_INSERTION_COMMAND, EditorConfig, GridSelection, LexicalEditor, LexicalNode, NodeKey, NodeSelection, RangeSelection, SerializedLexicalNode, Spread, } from 'lexical';
import { useLexicalComposerContext } from '@lexical/react/LexicalComposerContext';
import { $getNodeByKey, DecoratorNode, } from 'lexical';
import { createRef, useEffect, useState } from 'react';
import { useLexicalNodeSelection } from '@lexical/react/useLexicalNodeSelection';
import { mergeRegister } from '@lexical/utils';
import type { MathfieldElement } from "mathlive";
import "mathlive/dist/mathlive.min.js"
import './index.css';

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
  const [lastRangeSelection, setLastRangeSelection] = useState<RangeSelection | null>(null);
  const [isSelected, setSelected, clearSelection] = useLexicalNodeSelection(nodeKey);

  useEffect(() => {
    const mathfield = ref.current;
    if (!mathfield) return;
    if (initialValue !== mathfield.getValue()) {
      mathfield.setValue(initialValue, { suppressChangeNotifications: true });
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
      editor.registerCommand(CONTROLLED_TEXT_INSERTION_COMMAND, eventOrText => {
        const node = $getNodeByKey(nodeKey);
        if (!$isMathNode(node)) return false;
        if (eventOrText === node.getValue()) return true;
        return false;
      }, COMMAND_PRIORITY_LOW),
    );
  }, []);

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
    // focus on selection
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
        const isBefore = isParentAnchor ? anchorOffset - indexWithinParent ===0 : anchorNode.isBefore(mathNode);
        mathfield.focus();
        mathfield.executeCommand(isBefore ? 'moveToMathFieldStart' : 'moveToMathFieldEnd');
      });
    }
  }, [ref, isSelected]);

  useEffect(() => {
    const mathfield = ref.current;
    if (!mathfield) return;

    const readOnly = !editor.isEditable();
    mathfield.virtualKeyboardMode = readOnly ? "off" : "onfocus";
    mathfield.virtualKeyboardTheme = "material";
    mathfield.mathModeSpace = "\\,";
    mathfield.keypressSound = "none";
    mathfield.plonkSound = "none";
    mathfield.readOnly = readOnly;

    const shadowStyle = mathfield.shadowRoot?.querySelector('style');
    shadowStyle?.append('.ML__container{ min-height: unset !important; }');

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
        value !== initialValue && node.setValue(value);
      });
    }, false);

    mathfield.addEventListener("focus", event => {
      clearSelection();
      setSelected(true);
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
    dom.style.maxWidth = '100%';
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
