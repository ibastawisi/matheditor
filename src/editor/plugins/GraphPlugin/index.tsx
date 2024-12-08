"use client"
import { $createParagraphNode, $insertNodes, $isRootNode, LexicalCommand } from 'lexical';
import { $wrapNodeInElement, mergeRegister } from '@lexical/utils';
import {
  COMMAND_PRIORITY_EDITOR,
  createCommand,
} from 'lexical';

import { useLexicalComposerContext } from '@lexical/react/LexicalComposerContext';
import { useEffect } from 'react';

import { $createGraphNode, GraphNode, GraphPayload } from '@/editor/nodes/GraphNode';

export type InsertGraphPayload = Readonly<GraphPayload>;

export const INSERT_GRAPH_COMMAND: LexicalCommand<InsertGraphPayload> = createCommand();

export default function GraphPlugin() {
  const [editor] = useLexicalComposerContext();
  useEffect(() => {
    if (!editor.hasNodes([GraphNode])) {
      throw new Error(
        'GraphPlugin: GraphNode not registered on editor',
      );
    }

    return mergeRegister(
      editor.registerCommand<InsertGraphPayload>(
        INSERT_GRAPH_COMMAND,
        (payload) => {
          const graphNode = $createGraphNode(payload);
          $insertNodes([graphNode]);
          if ($isRootNode(graphNode.getParentOrThrow())) {
            $wrapNodeInElement(graphNode, $createParagraphNode).selectEnd();
          }
          return true;
        },
        COMMAND_PRIORITY_EDITOR,
      ),
    );
  }, [editor]);

  return null;
}
