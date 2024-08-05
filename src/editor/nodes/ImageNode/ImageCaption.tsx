"use client"
import type { LexicalEditor, NodeKey } from 'lexical';
import { $getSelection, $setSelection, COMMAND_PRIORITY_LOW, SELECTION_CHANGE_COMMAND } from 'lexical';
import { lazy, memo, Suspense, useEffect } from 'react';
import { editorConfig } from './config';
import { Typography } from '@mui/material';
import { mergeRegister } from '@/editor';

const NestedEditor = lazy(() => import('@/editor/NestedEditor'));

export function ImageCaption({
  nodeKey,
  editor,
  children,
}: {
  nodeKey: NodeKey;
  editor: LexicalEditor;
  children?: React.ReactNode;
}): JSX.Element {
  const parentEditor = editor._parentEditor;
  useEffect(() => {
    const unregister = mergeRegister(
      editor.registerCommand(
        SELECTION_CHANGE_COMMAND,
        () => {
          if (!parentEditor) return false;
          const parentSelection = parentEditor.getEditorState().read($getSelection);
          if (!parentSelection) return false;
          parentEditor.update(() => {
            $setSelection(null);
          })
          return false;
        },
        COMMAND_PRIORITY_LOW,
      ),
    );

    return () => {
      unregister();
    };
  }, [
    editor,
    nodeKey,
  ]);


  return (
    <figcaption>
      <Suspense fallback={children}>
        <NestedEditor initialEditor={editor} initialNodes={editorConfig.nodes}
          placeholder={<Typography color="text.secondary" className="nested-placeholder">Write a caption</Typography>}
        />
      </Suspense>
    </figcaption>
  );
}

export default memo(ImageCaption, () => true);