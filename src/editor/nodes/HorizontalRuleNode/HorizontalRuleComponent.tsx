"use client"
import type { NodeKey } from 'lexical';
import { useLexicalComposerContext } from '@lexical/react/LexicalComposerContext';
import { useLexicalNodeSelection } from '@lexical/react/useLexicalNodeSelection';
import { mergeRegister } from '@lexical/utils';
import {
  $getNodeByKey,
  $getSelection,
  $isNodeSelection,
  CLICK_COMMAND,
  COMMAND_PRIORITY_LOW, KEY_BACKSPACE_COMMAND,
  KEY_DELETE_COMMAND
} from 'lexical';
import { useCallback, useEffect } from 'react';
import { $isHorizontalRuleNode } from '.';

function HorizontalRuleComponent({ nodeKey }: { nodeKey: NodeKey; }) {
  const [editor] = useLexicalComposerContext();
  const [isSelected, setSelected, clearSelection] = useLexicalNodeSelection(nodeKey);

  const onDelete = useCallback(
    (event: KeyboardEvent) => {
      if (isSelected && $isNodeSelection($getSelection())) {
        event.preventDefault();
        const node = $getNodeByKey(nodeKey);
        if ($isHorizontalRuleNode(node)) {
          node.remove();
        }
      }
      return false;
    },
    [isSelected, nodeKey]
  );

  useEffect(() => {
    return mergeRegister(
      editor.registerCommand(
        CLICK_COMMAND,
        (event: MouseEvent) => {
          const hrElem = editor.getElementByKey(nodeKey);

          if (event.target === hrElem) {
            if (!event.shiftKey) {
              clearSelection();
            }
            setSelected(!isSelected);
            return true;
          }

          return false;
        },
        COMMAND_PRIORITY_LOW
      ),
      editor.registerCommand(
        KEY_DELETE_COMMAND,
        onDelete,
        COMMAND_PRIORITY_LOW
      ),
      editor.registerCommand(
        KEY_BACKSPACE_COMMAND,
        onDelete,
        COMMAND_PRIORITY_LOW
      )
    );
  }, [clearSelection, editor, isSelected, nodeKey, onDelete, setSelected]);

  useEffect(() => {
    const hrElem = editor.getElementByKey(nodeKey);
    if (hrElem !== null) {
      hrElem.className = isSelected ? 'selected' : '';
    }
  }, [editor, isSelected, nodeKey]);

  return null;
}

export default HorizontalRuleComponent;