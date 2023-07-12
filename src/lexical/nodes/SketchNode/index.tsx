/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import { $createNodeSelection, $setSelection, DOMConversionMap, DOMConversionOutput, DOMExportOutput, EditorConfig, LexicalNode, NodeKey, SerializedLexicalNode, Spread, } from 'lexical';
import { DecoratorNode, } from 'lexical';
import { NonDeleted, ExcalidrawElement } from '@excalidraw/excalidraw/types/element/types';
import { Suspense, lazy } from 'react';
const SketchComponent = lazy(() => import('./SketchComponent'));

export interface SketchPayload {
  key?: NodeKey;
  width?: number;
  height?: number;
  src: string;
  /**
 * @deprecated The value is now embedded in the src
 */
  value?: NonDeleted<ExcalidrawElement>[]
}


function convertSketchElement(domNode: Node): null | DOMConversionOutput {
  if (domNode instanceof HTMLImageElement) {
    const { src } = domNode;
    const value: NonDeleted<ExcalidrawElement>[] = domNode.dataset.value ? JSON.parse(domNode.dataset.value) : [];
    const node = $createSketchNode({ src, value });
    return { node };
  }
  return null;
}

export type SerializedSketchNode = Spread<
  {
    width?: number;
    height?: number;
    src: string;
    value?: NonDeleted<ExcalidrawElement>[];
    type: 'sketch';
    version: 1;
  },
  SerializedLexicalNode
>;

export class SketchNode extends DecoratorNode<JSX.Element> {
  __width: 'inherit' | number;
  __height: 'inherit' | number;
  __src: string;
  __value?: NonDeleted<ExcalidrawElement>[];

  static getType(): string {
    return 'sketch';
  }

  static clone(node: SketchNode): SketchNode {
    return new SketchNode(
      node.__src,
      node.__value,
      node.__width,
      node.__height,
      node.__key,
    );
  }

  static importJSON(serializedNode: SerializedSketchNode): SketchNode {
    const { width, height, src, value } =
      serializedNode;
    const node = $createSketchNode({
      width,
      height,
      src,
      value
    });
    return node;
  }

  exportDOM(): DOMExportOutput {
    const element = document.createElement('img');
    element.setAttribute('src', this.__src);
    element.setAttribute('alt', this.__altText);
    element.setAttribute('width', this.__width.toString());
    element.setAttribute('height', this.__height.toString());
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
    value?: NonDeleted<ExcalidrawElement>[],
    width?: 'inherit' | number,
    height?: 'inherit' | number,
    key?: NodeKey,
  ) {
    super(key);
    this.__src = src;
    this.__width = width || 'inherit';
    this.__height = height || 'inherit';
    this.__value = value;
  }

  exportJSON(): SerializedSketchNode {
    return {
      width: this.__width === 'inherit' ? 0 : this.__width,
      height: this.__height === 'inherit' ? 0 : this.__height,
      src: this.getSrc(),
      value: this.getValue(),
      type: 'sketch',
      version: 1,
    };
  }

  setWidthAndHeight(
    width: 'inherit' | number,
    height: 'inherit' | number,
  ): void {
    const writable = this.getWritable();
    writable.__width = width;
    writable.__height = height;
  }

  update(src: string, value?: NonDeleted<ExcalidrawElement>[]): void {
    const writable = this.getWritable();
    writable.__src = src;
    writable.__value = value;
  }

  select() {
    const nodeSelection = $createNodeSelection();
    nodeSelection.add(this.getKey());
    $setSelection(nodeSelection);
  }

  createDOM(config: EditorConfig): HTMLElement {
    const span = document.createElement('span');
    const theme = config.theme;
    const className = theme.image;
    if (className !== undefined) {
      span.className = className;
    }
    return span;
  }

  updateDOM(): false {
    return false;
  }

  getSrc(): string {
    return this.__src;
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
        />
      </Suspense>
    );
  }
}

export function $createSketchNode({
  src,
  height,
  width,
  key,
  value
}: SketchPayload): SketchNode {
  return new SketchNode(
    src,
    value,
    width,
    height,
    key,
  );
}

export function $isSketchNode(
  node: LexicalNode | null | undefined,
): node is SketchNode {
  return node instanceof SketchNode;
}
