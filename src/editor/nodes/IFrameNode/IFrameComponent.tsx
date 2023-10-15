"use client"
import { Typography } from '@mui/material';
import { $getNodeByKey, ElementFormatType, LexicalEditor, NodeKey } from 'lexical';
import { Suspense } from 'react';
import { editorConfig } from '../ImageNode/config';
import dynamic from 'next/dynamic';
import { useLexicalComposerContext } from '@lexical/react/LexicalComposerContext';
import { $isImageNode } from '../ImageNode';
const NestedEditor = dynamic(() => import('@/editor/NestedEditor'), { ssr: false });

export type IFrameComponentProps = Readonly<{
  className: Readonly<{
    base: string;
    focus: string;
  }>;
  format: ElementFormatType | null;
  nodeKey: NodeKey;
  src: string;
  width: string;
  height: string;
}>;


export function IFrameComponent({
  src,
  altText,
  nodeKey,
  width,
  height,
  showCaption,
  caption,
}: {
  altText: string;
  height: number;
  nodeKey: NodeKey;
  src: string;
  width: number;
  showCaption: boolean;
  caption: LexicalEditor;
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
    <>
      <iframe
        width={width}
        height={height}
        src={src}
        frameBorder="0"
        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
        allowFullScreen={true}
        title={altText}
      />
      {showCaption && (
        <figcaption>
          <Suspense fallback={null}>
            <NestedEditor initialEditor={caption} initialNodes={editorConfig.nodes} onChange={onChange}
              placeholder={<Typography color="text.secondary" className="nested-placeholder">Write a caption</Typography>}
            />
          </Suspense>
        </figcaption>
      )}
    </>
  );
}
