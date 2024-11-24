"use client"
import { $createParagraphNode, $getSelection, $insertNodes, $isRangeSelection, $isRootNode, KEY_ARROW_DOWN_COMMAND, KEY_ARROW_UP_COMMAND, LexicalCommand } from 'lexical';
import { useLexicalComposerContext } from '@lexical/react/LexicalComposerContext';
import { COMMAND_PRIORITY_EDITOR, createCommand } from 'lexical';
import { useEffect } from 'react';
import { $wrapNodeInElement, mergeRegister } from '@lexical/utils';
import { $createMathNode, MathNode } from '@/editor/nodes/MathNode';
import { IS_MOBILE } from '@/shared/environment';

type CommandPayload = {
  value: string;
};

export const INSERT_MATH_COMMAND: LexicalCommand<CommandPayload> =
  createCommand();

export default function MathPlugin(): JSX.Element | null {
  const [editor] = useLexicalComposerContext();

  useEffect(() => {
    if (!editor.hasNodes([MathNode])) {
      throw new Error(
        'MathPlugin: MathNode not registered on editor',
      );
    }

    return mergeRegister(
      editor.registerCommand<CommandPayload>(
        INSERT_MATH_COMMAND,
        (payload) => {
          const { value } = payload;
          const selection = $getSelection();
          const style = $isRangeSelection(selection)? selection.anchor.getNode().getStyle() : '';
          const mathNode = $createMathNode(value, style);
          $insertNodes([mathNode]);
          if ($isRootNode(mathNode.getParentOrThrow())) {
            $wrapNodeInElement(mathNode, $createParagraphNode);
          }
          mathNode.select();
          return true;
        },
        COMMAND_PRIORITY_EDITOR,
      ),
      // workaround for arrow up and arrow down key events
      editor.registerCommand<KeyboardEvent>(KEY_ARROW_UP_COMMAND, (event => {
        const rootElement = editor.getRootElement();
        if (!rootElement) return false;
        const mathfields = rootElement.querySelectorAll('math-field');
        mathfields.forEach(mathfield => {
          const keyboardSink = mathfield.shadowRoot?.querySelector('[part="keyboard-sink"]');
          keyboardSink?.removeAttribute('contenteditable');
          setTimeout(() => {
            keyboardSink?.setAttribute('contenteditable', 'true');
          }, 0);
        });
        return false;
      }), COMMAND_PRIORITY_EDITOR),
      editor.registerCommand<KeyboardEvent>(KEY_ARROW_DOWN_COMMAND, (event => {
        const rootElement = editor.getRootElement();
        if (!rootElement) return false;
        const mathfields = rootElement.querySelectorAll('math-field');
        mathfields.forEach(mathfield => {
          const keyboardSink = mathfield.shadowRoot?.querySelector('[part="keyboard-sink"]');
          keyboardSink?.removeAttribute('contenteditable');
          setTimeout(() => {
            keyboardSink?.setAttribute('contenteditable', 'true');
          }, 0);
        });
        return false;
      }), COMMAND_PRIORITY_EDITOR),

    );
  }, [editor]);

  useEffect(() => {
    const handleSelectionChange = () => {
      const domSelection = document.getSelection();
      if (!domSelection) return false;
      const mathfields = document.querySelectorAll('math-field');
      mathfields.forEach((mathfield) => {
        const isSelected = domSelection.containsNode(mathfield);
        mathfield.classList.toggle("selection-highlight", isSelected);
      });
    };

    document.addEventListener("selectionchange", handleSelectionChange);
    return () => {
      document.removeEventListener("selectionchange", handleSelectionChange);
    };
  }, []);

  useEffect(() => {
    const navigation = (window as any).navigation;
    if (!navigation || !IS_MOBILE) return;

    const preventBackNavigation = (event: any) => {
      if (event.navigationType === 'push') return;
      const mathVirtualKeyboard = window.mathVirtualKeyboard;
      if (!mathVirtualKeyboard?.visible) return;
      event.preventDefault();
      mathVirtualKeyboard.hide();
    };

    navigation.addEventListener('navigate', preventBackNavigation);
    return () => {
      navigation.removeEventListener('navigate', preventBackNavigation);
      const mathVirtualKeyboard = window.mathVirtualKeyboard;
      if (!mathVirtualKeyboard?.visible) return;
      mathVirtualKeyboard.hide();
    };
  }, []);

  return null;
}
