import { $createParagraphNode, $getRoot, $isParagraphNode, LexicalCommand } from 'lexical';

import { useLexicalComposerContext } from '@lexical/react/LexicalComposerContext';
import { $getSelection, COMMAND_PRIORITY_EDITOR, createCommand, } from 'lexical';
import { useEffect } from 'react';

import { $createSketchNode, SketchNode, SketchPayload } from '../../nodes/SketchNode';

export type InsertSketchPayload = Readonly<SketchPayload>;

export const INSERT_SKETCH_COMMAND: LexicalCommand<InsertSketchPayload> = createCommand();

export default function SketchPlugin(): JSX.Element | null {
  const [editor] = useLexicalComposerContext();
  useEffect(() => {
    if (!editor.hasNodes([SketchNode])) {
      throw new Error(
        'SketchPlugin: SketchNode not registered on editor',
      );
    }

    return editor.registerCommand<InsertSketchPayload>(
      INSERT_SKETCH_COMMAND,
      (payload) => {
        const selection = $getSelection();
        const nodes = selection?.getNodes();

        const sketchNode = $createSketchNode(payload);
        const paragraphNode = $createParagraphNode();
        paragraphNode.append(sketchNode);

        const root = $getRoot();
        const selectedNode = nodes ? nodes[nodes.length - 1] : root.getLastDescendant();
        if ($isParagraphNode(selectedNode)) {
          selectedNode.append(sketchNode);
        } else {
          selectedNode!.getTopLevelElementOrThrow().insertAfter(paragraphNode);
        }

        sketchNode.select();

        return true;
      },
      COMMAND_PRIORITY_EDITOR,
    );
  }, [editor]);

  return null;
}
