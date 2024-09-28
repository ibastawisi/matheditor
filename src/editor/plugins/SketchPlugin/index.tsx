"use client"
import { $createParagraphNode, $insertNodes, $isRootNode, LexicalCommand } from 'lexical';
import { $wrapNodeInElement, mergeRegister } from '@lexical/utils';
import {
  COMMAND_PRIORITY_EDITOR,
  createCommand,
} from 'lexical';

import { useLexicalComposerContext } from '@lexical/react/LexicalComposerContext';
import { useEffect } from 'react';

import { $createSketchNode, SketchNode, SketchPayload } from '@/editor/nodes/SketchNode';

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

    return mergeRegister(
      editor.registerCommand<InsertSketchPayload>(
        INSERT_SKETCH_COMMAND,
        (payload) => {
          const sketchNode = $createSketchNode(payload);
          $insertNodes([sketchNode]);
          if ($isRootNode(sketchNode.getParentOrThrow())) {
            $wrapNodeInElement(sketchNode, $createParagraphNode).selectEnd();
          }
          return true;
        },
        COMMAND_PRIORITY_EDITOR,
      ),
    );
  }, [editor]);

  return null;
}
