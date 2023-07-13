/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import { DOMConversionMap, DOMConversionOutput, LexicalEditor, LexicalNode, NodeKey, Spread, } from 'lexical';

import { ImageNode, ImagePayload, SerializedImageNode } from '../ImageNode';
import { Suspense, lazy } from 'react';
const ImageComponent = lazy(() => import('../ImageNode/ImageComponent'));

export type GraphPayload = Spread<{
  value: string;
}, ImagePayload>

function convertGraphElement(domNode: Node): null | DOMConversionOutput {
  if (domNode instanceof HTMLImageElement) {
    const { alt: altText, src } = domNode;
    const style = domNode.style.cssText;
    const value = domNode.dataset.value as string;
    const node = $createGraphNode({ src, altText, value, style });
    return { node };
  }
  return null;
}

export type SerializedGraphNode = Spread<
  {
    value: string;
    type: 'graph';
    version: 1;
  },
  SerializedImageNode
>;

export class GraphNode extends ImageNode {
  __value: string;

  static getType(): string {
    return 'graph';
  }

  static clone(node: GraphNode): GraphNode {
    return new GraphNode(
      node.__src,
      node.__altText,
      node.__value,
      node.__width,
      node.__height,
      node.__style,
      node.__showCaption,
      node.__caption,
      node.__key,
    );
  }

  static importJSON(serializedNode: SerializedGraphNode): GraphNode {
    const { width, height, src, value, style, showCaption, caption, altText } =
      serializedNode;
    const node = $createGraphNode({
      src,
      value,
      width,
      height,
      style,
      showCaption,
      altText
    });
    if (caption) {
      const nestedEditor = node.__caption;
      const editorState = nestedEditor.parseEditorState(caption.editorState);
      if (!editorState.isEmpty()) {
        nestedEditor.setEditorState(editorState);
      }
    }
    return node;
  }

  static importDOM(): DOMConversionMap | null {
    return {
      img: (node: Node) => ({
        conversion: convertGraphElement,
        priority: 0,
      }),
    };
  }

  constructor(
    src: string,
    altText: string,
    value: string,
    width?: 'inherit' | number,
    height?: 'inherit' | number,
    style?: string,
    showCaption?: boolean,
    caption?: LexicalEditor,
    key?: NodeKey,
  ) {
    super(src, altText, width, height, style, showCaption, caption, key);
    this.__value = value;
  }

  exportJSON(): SerializedGraphNode {
    return {
      ...super.exportJSON(),
      value: this.__value,
      type: 'graph',
      version: 1,
    };
    
  }

  update(payload: Partial<GraphPayload>): void {
    super.update(payload);
    const writable = this.getWritable();
    writable.__value = payload.value ?? writable.__value;
  }

  getValue(): string {
    return this.__value;
  }

  decorate(): JSX.Element {
    return (
      <Suspense fallback={null}>
        <ImageComponent
          src={this.__src}
          altText={this.__altText}
          width={this.__width}
          height={this.__height}
          nodeKey={this.getKey()}
          resizable={true}
          showCaption={this.__showCaption}
          caption={this.__caption}
        />
      </Suspense>
    );
  }

}

export function $createGraphNode({
  src,
  value,
  key,
  width,
  height,
  style,
  showCaption,
  caption,
  altText = 'Graph',
}: GraphPayload): GraphNode {
  return new GraphNode(
    src,
    altText,
    value,
    width,
    height,
    style,
    showCaption,
    caption,
    key,
  );
}

export function $isGraphNode(
  node: LexicalNode | null | undefined,
): node is GraphNode {
  return node instanceof GraphNode;
}
