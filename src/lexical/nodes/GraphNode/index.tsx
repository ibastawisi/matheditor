/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import { $createNodeSelection, $setSelection, DOMConversionMap, DOMConversionOutput, DOMExportOutput, EditorConfig, LexicalNode, NodeKey, SerializedLexicalNode, Spread, } from 'lexical';

import { DecoratorNode, } from 'lexical';

import { Suspense, lazy } from 'react';
const ImageComponent = lazy(() => import('../ImageNode/ImageComponent'));

export interface GraphPayload {
  key?: NodeKey;
  width?: number;
  height?: number;
  src: string;
  value: string;
}

function convertGraphElement(domNode: Node): null | DOMConversionOutput {
  if (domNode instanceof HTMLImageElement) {
    const { src } = domNode;
    const value = domNode.dataset.value as string;
    const node = $createGraphNode({ src, value });
    return { node };
  }
  return null;
}

function GraphComponent({
  nodeKey,
  src,
  value,
  width,
  height,
  resizable,
}: {
  nodeKey: NodeKey;
  src: string;
  value: string;
  width: 'inherit' | number;
  height: 'inherit' | number;
  resizable: boolean;
}): JSX.Element {
  return (
    <Suspense fallback={null}>
      <ImageComponent nodeKey={nodeKey} width={width} height={height} src={src} altText="" resizable={resizable} />
    </Suspense>
  );
}

export type SerializedGraphNode = Spread<
  {
    src: string;
    value: string;
    width?: number;
    height?: number;
    type: 'graph';
    version: 1;
  },
  SerializedLexicalNode
>;

export class GraphNode extends DecoratorNode<JSX.Element> {
  __src: string;
  __value: string;
  __width: 'inherit' | number;
  __height: 'inherit' | number;

  static getType(): string {
    return 'graph';
  }

  static clone(node: GraphNode): GraphNode {
    return new GraphNode(
      node.__src,
      node.__value,
      node.__width,
      node.__height,
      node.__key,
    );
  }

  static importJSON(serializedNode: SerializedGraphNode): GraphNode {
    const { width, height, src, value } =
      serializedNode;
    const node = $createGraphNode({
      src,
      value,
      width,
      height,
    });
    return node;
  }

  exportDOM(): DOMExportOutput {
    const element = document.createElement('img');
    element.setAttribute('src', this.__src);
    element.dataset.value = this.__value;
    element.setAttribute('width', this.__width.toString());
    element.setAttribute('height', this.__height.toString());
    return { element };
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
    value: string,
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

  exportJSON(): SerializedGraphNode {
    return {
      src: this.getSrc(),
      value: this.getValue(),
      width: this.__width === 'inherit' ? 0 : this.__width,
      height: this.__height === 'inherit' ? 0 : this.__height,
      type: 'graph',
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

  update(src: string, value: string): void {
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

  getValue(): string {
    return this.__value;
  }

  decorate(): JSX.Element {
    return (
      <GraphComponent
        width={this.__width}
        height={this.__height}
        src={this.getSrc()}
        nodeKey={this.getKey()}
        value={this.getValue()}
        resizable={true}
      />
    );
  }
}

export function $createGraphNode({
  src,
  value,
  key,
  width,
  height,
}: GraphPayload): GraphNode {
  return new GraphNode(
    src,
    value,
    width,
    height,
    key,
  );
}

export function $isGraphNode(
  node: LexicalNode | null | undefined,
): node is GraphNode {
  return node instanceof GraphNode;
}
