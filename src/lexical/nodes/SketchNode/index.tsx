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
  style?: string;
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
    style?: string;
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
  __style?: string;
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
      node.__style,
      node.__key,
    );
  }

  static importJSON(serializedNode: SerializedSketchNode): SketchNode {
    const { width, height, src, value, style } =
      serializedNode;
    const node = $createSketchNode({
      width,
      height,
      style,
      src,
      value
    });
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
    value?: NonDeleted<ExcalidrawElement>[],
    width?: 'inherit' | number,
    height?: 'inherit' | number,
    style?: string,
    key?: NodeKey,
  ) {
    super(key);
    this.__src = src;
    this.__width = width || 'inherit';
    this.__height = height || 'inherit';
    this.__style = style;
    this.__value = value;
  }

  exportJSON(): SerializedSketchNode {
    return {
      width: this.__width === 'inherit' ? 0 : this.__width,
      height: this.__height === 'inherit' ? 0 : this.__height,
      style: this.__style,
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
    if (this.__style) {
      span.style.cssText = this.__style;
    }
    return span;
  }

  updateDOM(prevNode: SketchNode): boolean {
    return prevNode.__style !== this.__style;
  }

  getStyle(): string | undefined {
    const self = this.getLatest();
    return self.__style;
  }

  setStyle(style: string): this {
    const self = this.getWritable();
    self.__style = style;
    return self;
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
  style,
  key,
  value
}: SketchPayload): SketchNode {
  return new SketchNode(
    src,
    value,
    width,
    height,
    style,
    key,
  );
}

export function $isSketchNode(
  node: LexicalNode | null | undefined,
): node is SketchNode {
  return node instanceof SketchNode;
}
