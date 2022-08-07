/* eslint-disable react-hooks/exhaustive-deps */
import { $createNodeSelection, $createRangeSelection, $getSelection, $isRangeSelection, $setSelection, EditorConfig, GridSelection, LexicalEditor, LexicalNode, NodeKey, NodeSelection, RangeSelection, SerializedLexicalNode, Spread, } from 'lexical';
import { useLexicalComposerContext } from '@lexical/react/LexicalComposerContext';
import { $getNodeByKey, DecoratorNode, } from 'lexical';
import { useEffect, useLayoutEffect, useRef, useState } from 'react';
import { useLexicalNodeSelection } from '@lexical/react/useLexicalNodeSelection';
import { mergeRegister } from '@lexical/utils';

import { MathfieldElement } from "mathlive";
import 'mathlive/dist/mathlive-fonts.css';
import 'mathlive/dist/mathlive.min';

declare global {
  /** @internal */
  namespace JSX {
    interface IntrinsicElements {
      'math-field': React.DetailedHTMLProps<React.HTMLAttributes<MathfieldElement>, MathfieldElement>
    }
  }
}

type MathComponentProps = { initialValue: string; nodeKey: NodeKey; };

function MathComponent({ initialValue, nodeKey, }: MathComponentProps): JSX.Element {
  const [editor] = useLexicalComposerContext();
  const [value, setValue] = useState(initialValue);
  const ref = useRef<MathfieldElement>(null);
  const [isSelected, setSelected, clearSelection] = useLexicalNodeSelection(nodeKey);
  const [wasSelected, setWasSelected] = useState(false);
  const [selection, setSelection] = useState<RangeSelection | NodeSelection | GridSelection | null>(null);
  const previousSelectionRef = useRef<RangeSelection | NodeSelection | GridSelection | null>(null);

  useEffect(() => {
    mergeRegister(
      editor.registerUpdateListener(({ editorState }) => {
        setSelection(editorState.read(() => $getSelection()));
      }),
    );
  }, []);

  useEffect(() => {
    editor.getEditorState().read(() => {
      const mathfield = ref.current;
      if (!mathfield) return;
      const selection = $getSelection();
      const previousSelection = previousSelectionRef.current;
      if ($isRangeSelection(previousSelection) && $isRangeSelection(selection) && selection.isCollapsed()) {
        const node = selection.getNodes()[0];
        const mathNode = $getNodeByKey(nodeKey);
        if (node.getParent() !== mathNode?.getParent()) return;
        if (!wasSelected) {
          const currentKey = node.getKey();
          const nextSiblingKey = node.getNextSibling()?.getKey();
          const prevSiblingKey = node.getPreviousSibling()?.getKey();
          if (currentKey === nodeKey||nextSiblingKey === nodeKey||prevSiblingKey === nodeKey) {
            const isDirty = selection.dirty;
            const anchor = selection.anchor;
            const anchorType = anchor.type;
            const anchorOffset = anchor.offset;
            const anchorNode = anchor.getNode();
            const prevAnchor = previousSelection.anchor;
            const prevAnchorType = prevAnchor.type;
            const prevAnchorOffset = prevAnchor.offset;
            const offset = isDirty ?
              prevAnchorType === "element" ?
                prevAnchorOffset - mathNode.getIndexWithinParent() :
                anchorNode.isBefore(mathNode) ? anchorOffset - anchorNode.getTextContentSize() : anchorOffset + 2 :
              anchorType === "element" ?
                anchorOffset - mathNode.getIndexWithinParent() :
                anchorNode.isBefore(mathNode) ? anchorOffset - anchorNode.getTextContentSize() : anchorOffset + 1;

            if (offset === 0 || offset === 1) {
              mathfield.focus();
              mathfield.executeCommand(offset === 0 ? 'moveToMathFieldStart' : 'moveToMathFieldEnd');
            }
          }
        }
      } else {
        if (!selection && document.activeElement === mathfield) {
          setSelected(true);
        }
      }

      setWasSelected(isSelected);
      previousSelectionRef.current = selection;

      // hack to restore cursor focus
      if (mathfield.hasFocus()) {
        const mathfieldSelection = mathfield.selection;
        mathfield.select();
        mathfield.selection = mathfieldSelection;
      }
    });
  }, [ref, selection, isSelected]);

  useLayoutEffect(() => {
    editor.getEditorState().read(() => {
      const mathfield = ref.current!;
      const active = isSelected && $isRangeSelection(selection);
      mathfield.classList.toggle("selection-active", active);
    });
  }, [isSelected, selection]);

  useEffect(() => {
    if (value === initialValue) return;
    editor.update(() => {
      const node = $getNodeByKey(nodeKey);
      if ($isMathNode(node)) {
        node.setValue(value);
        if (value.trim().length === 0) {
          node.selectPrevious();
          node.remove();
        }
      }
    });
  }, [value]);

  useEffect(() => {
    if (value === initialValue) return;
    setValue(initialValue);
  }, [initialValue]);

  useEffect(() => {
    const mathfield = ref.current;
    if (!mathfield) return;
    const readOnly = editor.isReadOnly();

    mathfield.virtualKeyboardMode = readOnly ? "off" : "onfocus";
    mathfield.virtualKeyboardTheme = "material";
    mathfield.keypressSound = "none";
    mathfield.plonkSound = "none";
    mathfield.readOnly = readOnly;

    if (readOnly) return;

    mathfield.addEventListener("change", e => {
      setValue(mathfield.value)
    }, false);

    if (isSelected && !mathfield.hasFocus()) {
      mathfield.focus();
    }

    mathfield.addEventListener("focus", event => {
      if (event.isTrusted) {
        clearSelection();
        setSelected(true)
      };
    });

    mathfield.addEventListener("blur", event => {
      if (event.isTrusted) {
        const rootElement = editor.getRootElement();
        if (rootElement?.contains(event.relatedTarget as HTMLElement)) {
          clearSelection();
        }
      }
    });

    mathfield.addEventListener("move-out", event => {
      const direction = event.detail.direction;
      var range = document.createRange();
      var selection = window.getSelection();
      const span = mathfield.parentElement!;
      const paragraph = span.parentElement!;

      switch (direction) {
        case "backward":
          range.setStartBefore(span);
          break;
        case "forward":
          range.setStartAfter(span);
          break;
        case "upward":
          range.setStartBefore(paragraph);
          break;
        case "downward":
          range.setStartAfter(paragraph);
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

  return <math-field id={`mfe-${nodeKey}`} ref={ref}>{value}</math-field>;
}

export type SerializedMathNode = Spread<{ type: 'math'; value: string; }, SerializedLexicalNode>;

export class MathNode extends DecoratorNode<JSX.Element> {
  __value: string;

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

  getMathfield(): MathfieldElement {
    return document.getElementById(`mfe-${this.__key}`) as MathfieldElement;
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
    return <MathComponent initialValue={this.__value} nodeKey={this.__key} />
  }
}

export function $createMathNode(value = ''): MathNode {
  const mathNode = new MathNode(value);
  return mathNode;
}

export function $isMathNode(node: LexicalNode | null | undefined): node is MathNode {
  return node instanceof MathNode;
}
