"use client"
import { BlockWithAlignableContents } from '@lexical/react/LexicalBlockWithAlignableContents';
import { ElementFormatType, NodeKey } from 'lexical';

export type IFrameComponentProps = Readonly<{
  className: Readonly<{
    base: string;
    focus: string;
  }>;
  format: ElementFormatType | null;
  nodeKey: NodeKey;
  url: string;
  width: string;
  height: string;
}>;


export function IFrameComponent({
  className, format, nodeKey, url, width, height,
}: IFrameComponentProps) {
  return (
    <BlockWithAlignableContents
      className={className}
      format={format}
      nodeKey={nodeKey}>
      <iframe
        width={width}
        height={height}
        src={url}
        frameBorder="0"
        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
        allowFullScreen={true}
        title="IFrame" />
    </BlockWithAlignableContents>
  );
}
