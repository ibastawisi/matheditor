/* eslint-disable react-hooks/exhaustive-deps */
import { $createNodeSelection, $createRangeSelection, $getSelection, $isRangeSelection, $setSelection, COMMAND_PRIORITY_LOW, EditorConfig, GridSelection, LexicalEditor, LexicalNode, NodeKey, NodeSelection, RangeSelection, SELECTION_CHANGE_COMMAND, SerializedLexicalNode, Spread, } from 'lexical';
import { useLexicalComposerContext } from '@lexical/react/LexicalComposerContext';
import { $getNodeByKey, DecoratorNode, } from 'lexical';
import { useEffect, useRef, useState } from 'react';
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
  const [selection, setSelection] = useState<RangeSelection | NodeSelection | GridSelection | null>(null);
  const [isSelected, setSelected, clearSelection] = useLexicalNodeSelection(nodeKey);

  useEffect(() => {
    return mergeRegister(
      editor.registerUpdateListener(({ editorState }) => {
        setSelection(editorState.read(() => $getSelection()));
      }),
      editor.registerCommand(SELECTION_CHANGE_COMMAND, () => {
        if (isSelected) return false;

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

        // console.group(`Mathfield ${nodeKey} offset: ${offset}`);
        // console.log(`anchor ${anchorNode.getKey()} offset: ${anchorOffset}`);
        // console.log(`isParentAnchor: ${isParentAnchor} indexWithinParent: ${indexWithinParent} isSelected: ${isSelected}`);
        // console.groupEnd();

        if (offset === 0 || offset === 1) {
          const mathfield = ref.current!;
          mathfield.focus();
          mathfield.executeCommand(offset === 0 ? 'moveToMathFieldStart' : 'moveToMathFieldEnd');
          // console.log(`------------------------------ focus mathfield ${nodeKey} ------------------------------`);
          return true;
        }

        return false;
      }, COMMAND_PRIORITY_LOW),
    );
  }, [isSelected]);

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
