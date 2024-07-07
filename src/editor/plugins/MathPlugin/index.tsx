"use client"
/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import { $createParagraphNode, $insertNodes, $isRootNode, COMMAND_PRIORITY_LOW, KEY_ARROW_DOWN_COMMAND, KEY_ARROW_UP_COMMAND, LexicalCommand, SELECTION_CHANGE_COMMAND } from 'lexical';

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
          const mathNode = $createMathNode(value);
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
      if (!domSelection || domSelection.rangeCount === 0) return false;
      const range = domSelection.getRangeAt(0);
      const mathfields = document.querySelectorAll('math-field');
      if (range.collapsed) {
        mathfields.forEach((mathfield) => {
          mathfield.classList.remove("selection-active");
        });
        return false;
      }
      mathfields.forEach((mathfield) => {
        const startContainerBits = range.startContainer.compareDocumentPosition(mathfield);
        const endContainerBits = range.endContainer.compareDocumentPosition(mathfield);
        const startMask = Node.DOCUMENT_POSITION_FOLLOWING | Node.DOCUMENT_POSITION_CONTAINED_BY;
        const endMask = Node.DOCUMENT_POSITION_PRECEDING | Node.DOCUMENT_POSITION_CONTAINED_BY;
        const isFollowingStartContainer = !!(startContainerBits & startMask);
        const isPrecedingEndContainer = !!(endContainerBits & endMask);
        const isSelected = isFollowingStartContainer && isPrecedingEndContainer;
        mathfield.classList.toggle("selection-active", isSelected);
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
    };
  }, []);

  return null;
}
