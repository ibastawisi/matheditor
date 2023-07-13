/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import { DOMConversionMap, DOMConversionOutput, DOMExportOutput, LexicalEditor, LexicalNode, NodeKey, Spread, } from 'lexical';
import { NonDeleted, ExcalidrawElement } from '@excalidraw/excalidraw/types/element/types';

import { ImageNode, ImagePayload, SerializedImageNode } from '../ImageNode';
import { Suspense, lazy } from 'react';
const SketchComponent = lazy(() => import('./SketchComponent'));

export type SketchPayload = Spread<{
  /**
 * @deprecated The value is now embedded in the src
 */
  value?: NonDeleted<ExcalidrawElement>[]
}, ImagePayload>


function convertSketchElement(domNode: Node): null | DOMConversionOutput {
  if (domNode instanceof HTMLImageElement) {
    const { alt: altText, src } = domNode;
    const style = domNode.style.cssText;
    const value: NonDeleted<ExcalidrawElement>[] = domNode.dataset.value ? JSON.parse(domNode.dataset.value) : [];
    const node = $createSketchNode({ src, altText, value, style });
    return { node };
  }
  return null;
}

export type SerializedSketchNode = Spread<
  {
    value?: NonDeleted<ExcalidrawElement>[];
    type: 'sketch';
    version: 1;
  },
  SerializedImageNode
>;

export class SketchNode extends ImageNode {
  __value?: NonDeleted<ExcalidrawElement>[];

  static getType(): string {
    return 'sketch';
  }

  static clone(node: SketchNode): SketchNode {
    return new SketchNode(
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

  static importJSON(serializedNode: SerializedSketchNode): SketchNode {
    const { width, height, src, value, style, showCaption, caption, altText } =
      serializedNode;
    const node = $createSketchNode({
      src,
      value,
      width,
      height,
      style,
      showCaption,
      altText,
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

  exportDOM(): DOMExportOutput {
    const container = document.createElement('span');
    container.innerHTML = decodeURIComponent(this.__src.split(',')[1]);
    const element = container.firstElementChild as HTMLElement;
    element.setAttribute('width', this.__width.toString());
    element.setAttribute('height', this.__height.toString());
    element.style.cssText = this.__style || '';
    return { element };
  }

  static importDOM(): DOMConversionMap | null {
    return {
      img: (node: Node) => ({
        conversion: convertSketchElement,
        priority: 0,
      }),
    };
  }

  constructor(
    src: string,
    altText: string,
    value?: NonDeleted<ExcalidrawElement>[],
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

  exportJSON(): SerializedSketchNode {
    return {
      ...super.exportJSON(),
      value: this.__value,
      type: 'sketch',
      version: 1,
    };

  }

  update(payload: Partial<SketchPayload>): void {
    const writable = this.getWritable();
    super.update(payload);
    writable.__value = payload.value ?? writable.__value;
  }


  getValue(): NonDeleted<ExcalidrawElement>[] | undefined {
    return this.__value;
  }

  decorate(): JSX.Element {
    return (
      <Suspense fallback={null}>
        <SketchComponent
          width={this.__width}
          height={this.__height}
          src={this.getSrc()}
          nodeKey={this.getKey()}
          value={this.getValue()}
          resizable={true}
          showCaption={this.__showCaption}
          caption={this.__caption}
        />
      </Suspense>
    );
  }
}

export function $createSketchNode({
  src,
  altText = "Graph",
  value,
  key,
  width,
  height,
  style,
  showCaption,
  caption,
}: SketchPayload): SketchNode {
  return new SketchNode(
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

export function $isSketchNode(
  node: LexicalNode | null | undefined,
): node is SketchNode {
  return node instanceof SketchNode;
}
