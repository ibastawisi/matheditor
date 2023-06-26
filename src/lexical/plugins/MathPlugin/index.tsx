/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import { $createParagraphNode, $insertNodes, $isRootNode, LexicalCommand, TextNode } from 'lexical';

import { useLexicalComposerContext } from '@lexical/react/LexicalComposerContext';
import { COMMAND_PRIORITY_EDITOR, createCommand } from 'lexical';
import { useEffect } from 'react';
import { $wrapNodeInElement } from '@lexical/utils';

import { $createMathNode, MathNode } from '../../nodes/MathNode';

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

    return editor.registerCommand<CommandPayload>(
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
    );
  }, [editor]);

  useEffect(() => {
    const removeTransform = editor.registerNodeTransform(TextNode, markdownTransform);
    return () => {
      removeTransform();
    };
  }, [editor]);

  return null;
}

function markdownTransform(node: TextNode) {
  const textContent = node.getTextContent();
  const regex = /\$+([^$]+?)\$+/;
  const match = textContent.match(regex);
  if (!match) return;
  let currentNode: TextNode;
  if (match[0] === textContent) {
    currentNode = node;
  } else {
    const startIndex = match.index || 0;
    const endIndex = startIndex + match[0].length;
    if (startIndex === 0) {
      [currentNode,] = node.splitText(endIndex);
    } else {
      [, currentNode,] = node.splitText(startIndex, endIndex);
    }
  }
  const value = match[1].trim();
  const mathNode = $createMathNode(value);
  currentNode.replace(mathNode);
}