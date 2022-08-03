/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import { useLexicalComposerContext } from '@lexical/react/LexicalComposerContext';
import { LexicalCommand, createCommand, $getRoot, COMMAND_PRIORITY_EDITOR, $getSelection, $createParagraphNode, $isParagraphNode } from 'lexical';
import { useEffect } from 'react';

import { $createStickyNode, StickyNode } from '../nodes/StickyNode';

export const INSERT_STICKY_COMMAND: LexicalCommand<void> = createCommand();

export default function StickyPlugin(): JSX.Element | null {
  const [editor] = useLexicalComposerContext();
  useEffect(() => {
    if (!editor.hasNodes([StickyNode])) {
      throw new Error('StickyPlugin: StickyNode not registered on editor');
    }
    return editor.registerCommand(
      INSERT_STICKY_COMMAND,
      () => {
        const stickyNode = $createStickyNode();
        const paragraphNode = $createParagraphNode();
        paragraphNode.append(stickyNode);
        const selection = $getSelection();
        const nodes = selection?.getNodes();
        const root = $getRoot();
        const selectedNode = nodes ? nodes[nodes.length - 1] : root.getLastDescendant();
        const parent = selectedNode!.getParentOrThrow();
        if ($isParagraphNode(selectedNode)) {
          selectedNode.append(stickyNode);
        } else if($isParagraphNode(parent)) {
          selectedNode?.insertBefore(stickyNode);
        } else {
          parent?.insertAfter(paragraphNode);
        }

        stickyNode.select();
        return true;
      },
      COMMAND_PRIORITY_EDITOR,
    );

  }, [editor]);
  return null;
}
