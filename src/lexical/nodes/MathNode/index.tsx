import { $getSelection, $isNodeSelection, CLICK_COMMAND, COMMAND_PRIORITY_LOW, EditorConfig, KEY_BACKSPACE_COMMAND, KEY_DELETE_COMMAND, LexicalNode, NodeKey, SerializedLexicalNode, Spread, } from 'lexical';
import { useLexicalComposerContext } from '@lexical/react/LexicalComposerContext';
import { $getNodeByKey, DecoratorNode, } from 'lexical';
import { useCallback, useEffect, useRef } from 'react';
import MathField from './MathField';

import { MathfieldElement } from 'mathlive';
import { useLexicalNodeSelection } from '@lexical/react/useLexicalNodeSelection';
import { mergeRegister } from '@lexical/utils';

type MathComponentProps = { value: string; nodeKey: NodeKey; };

function MathComponent({ value, nodeKey, }: MathComponentProps): JSX.Element {
  const [editor] = useLexicalComposerContext();
  const [isSelected, setSelected, clearSelection] =
    useLexicalNodeSelection(nodeKey);

  const mathfieldRef = useRef<MathfieldElement>(null);

  const handleInput = (value: string) => {
    editor.update(() => {
      const node = $getNodeByKey(nodeKey);
      if ($isMathNode(node)) {
        node.setValue(value);
      }
    });
  };

  const onDelete = useCallback(
    (payload: KeyboardEvent) => {
      if (isSelected && $isNodeSelection($getSelection())) {
        const event: KeyboardEvent = payload;
        event.preventDefault();
        const node = $getNodeByKey(nodeKey);
        if ($isMathNode(node)) {
          node.remove();
        }
        setSelected(false);
      }
      return false;
    },
    [isSelected, nodeKey, setSelected],
  );

  const onClick = useCallback((event: Event) => {
    const rootElement = editor.getRootElement();

    if (rootElement?.contains(event.target as Node) && event.target === mathfieldRef.current) {
      if (event instanceof MouseEvent && !event.shiftKey) {
        clearSelection();
      }
      setSelected(mathfieldRef.current === document.activeElement);
      return true;
    }

    return false;

  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);


  useEffect(() => {
    return mergeRegister(
      editor.registerCommand<MouseEvent>(
        CLICK_COMMAND,
        (payload) => {
          return onClick(payload);
        },
        COMMAND_PRIORITY_LOW,
      ),
      editor.registerCommand(
        KEY_DELETE_COMMAND,
        onDelete,
        COMMAND_PRIORITY_LOW,
      ),
      editor.registerCommand(
        KEY_BACKSPACE_COMMAND,
        onDelete,
        COMMAND_PRIORITY_LOW,
      ),
    );
  }, [clearSelection, editor, isSelected, nodeKey, onClick, onDelete, setSelected]);

  return <MathField value={value} onInput={handleInput} onFocus={onClick} mathfieldRef={mathfieldRef} />
}

export type SerializedMathNode = Spread<{ type: 'math'; value: string; }, SerializedLexicalNode>;

export class MathNode extends DecoratorNode<JSX.Element> {
  __value: string;

  static getType(): string {
    return 'math';
  }

  static clone(node: MathNode): MathNode {
    return new MathNode(node.__value, node.__inline, node.__key);
  }

  constructor(value: string, inline?: boolean, key?: NodeKey) {
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

  createDOM(_config: EditorConfig): HTMLElement {
    return document.createElement('span');
  }

  updateDOM(prevNode: MathNode): boolean {
    return false;
  }

  getValue(): string {
    return this.__value;
  }

  setValue(value: string): void {
    const writable = this.getWritable();
    writable.__value = value;
  }

  decorate(): JSX.Element {
    return <MathComponent value={this.__value} nodeKey={this.__key} />
  }
}

export function $createMathNode(value = ''): MathNode {
  const mathNode = new MathNode(value);
  return mathNode;
}

export function $isMathNode(node: LexicalNode | null | undefined): node is MathNode {
  return node instanceof MathNode;
}
