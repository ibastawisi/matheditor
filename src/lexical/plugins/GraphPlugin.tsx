import { $createNodeSelection, $createParagraphNode, $getRoot, $isParagraphNode, $setSelection, LexicalCommand } from 'lexical';

import { useLexicalComposerContext } from '@lexical/react/LexicalComposerContext';
import {
  $getSelection,
  COMMAND_PRIORITY_EDITOR,
  createCommand,
} from 'lexical';
import { useEffect } from 'react';

import { $createGraphNode, GraphNode, GraphPayload } from '../nodes/GraphNode';

export type InsertGraphPayload = Readonly<GraphPayload>;

export const INSERT_GRAPH_COMMAND: LexicalCommand<InsertGraphPayload> = createCommand();
export default function GraphPlugin(): JSX.Element | null {
  const [editor] = useLexicalComposerContext();
  useEffect(() => {
    if (!editor.hasNodes([GraphNode])) {
      throw new Error(
        'GraphPlugin: GraphNode not registered on editor',
      );
    }

    return editor.registerCommand<InsertGraphPayload>(
      INSERT_GRAPH_COMMAND,
      (payload) => {
        const selection = $getSelection();
        const nodes = selection?.getNodes();

        const graphNode = $createGraphNode(payload);
        const paragraphNode = $createParagraphNode();
        paragraphNode.append(graphNode);

        const root = $getRoot();
        const selectedNode = nodes ? nodes[nodes.length - 1] : root.getLastDescendant();
        if ($isParagraphNode(selectedNode)) {
          selectedNode.append(graphNode);
        } else {
          selectedNode!.getTopLevelElementOrThrow().insertAfter(paragraphNode);
        }

        const nodeSelection = $createNodeSelection();
        nodeSelection.add(graphNode.getKey());
        $setSelection(nodeSelection);
        setTimeout(() => {
          editor.getRootElement()!.focus();
          window.getSelection()!.collapse(null);
        }, 0);

        return true;
      },
      COMMAND_PRIORITY_EDITOR,
    );
  }, [editor]);

  return null;
}
