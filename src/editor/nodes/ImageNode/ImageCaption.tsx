"use client"
import type {LexicalEditor,NodeKey} from 'lexical';
import { useLexicalComposerContext } from '@lexical/react/LexicalComposerContext';
import { $getNodeByKey } from 'lexical';
import { lazy, memo, Suspense } from 'react';
import { $isImageNode } from '.';
import { editorConfig } from './config';
import { Typography } from '@mui/material';

const NestedEditor = lazy(() => import('@/editor/NestedEditor'));

export function ImageCaption({
  nodeKey,
  caption,
  children,
}: {
  nodeKey: NodeKey;
  caption: LexicalEditor;
  children?: React.ReactNode;
}): JSX.Element {
  const [editor] = useLexicalComposerContext();
  const onChange = () => {
    editor.update(() => {
      const node = $getNodeByKey(nodeKey);
      if ($isImageNode(node)) {
        node.setCaption(caption);
      }
    });
  }
  return (
    <figcaption>
      <Suspense fallback={children}>
        <NestedEditor initialEditor={caption} initialNodes={editorConfig.nodes} onChange={onChange}
          placeholder={<Typography color="text.secondary" className="nested-placeholder">Write a caption</Typography>}
        />
      </Suspense>
    </figcaption>
  );
}

export default memo(ImageCaption, () => true);