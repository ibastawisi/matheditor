/* eslint-disable react-hooks/exhaustive-deps */
import { $getSelection, $isNodeSelection, EditorConfig, GridSelection, LexicalEditor, LexicalNode, NodeKey, NodeSelection, RangeSelection, SerializedLexicalNode, Spread, } from 'lexical';
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
  const [isSelected, setSelected, clearSelection] = useLexicalNodeSelection(nodeKey);
  const [selection, setSelection] = useState<RangeSelection | NodeSelection | GridSelection | null>(null);

  useEffect(() => {
    mergeRegister(
      editor.registerUpdateListener(({ editorState }) => {
        setSelection(editorState.read(() => $getSelection()));
      }),
    );
  }, []);

  useEffect(() => {
    if (value === initialValue) return;
    editor.update(() => {
      const node = $getNodeByKey(nodeKey);
      if ($isMathNode(node)) {
        node.setValue(value);
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

    if (isSelected) {
      if ($isNodeSelection(selection) || selection === null) {
        if (!mathfield.hasFocus()) {
          mathfield.focus();
          setTimeout(() => {
            mathfield.executeCommand("showVirtualKeyboard");
          }, 0);
        }
      }

      // hack to regain selection
      const mathfieldSelection = mathfield.selection;
      mathfield.select();
      mathfield.selection = mathfieldSelection;
    }
  }, [isSelected]);

  useEffect(() => {
    const mathfield = ref.current;
    if (!mathfield) return;

    mathfield.virtualKeyboardMode = "onfocus";
    mathfield.virtualKeyboardTheme = "material";
    mathfield.mathModeSpace = "\\,"
    mathfield.smartMode = true;
    mathfield.keypressSound = "none";
    mathfield.plonkSound = "none";

    mathfield.addEventListener("change", e => {
      setValue(mathfield.value)
    }, false);

    mathfield.addEventListener("focusin", event => {
      const rootElement = editor.getRootElement();
      const mathfield = ref.current;
      if (rootElement?.contains(event.target as Node) && event.target === mathfield) {
        clearSelection();
        setSelected(mathfield === document.activeElement);
      }
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

  createDOM(_config: EditorConfig,_editor: LexicalEditor): HTMLElement {
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
