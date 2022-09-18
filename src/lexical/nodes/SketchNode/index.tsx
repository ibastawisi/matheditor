/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import { $createNodeSelection, $setSelection, DOMConversionMap, DOMConversionOutput, DOMExportOutput, EditorConfig, LexicalNode, NodeKey, SerializedLexicalNode, Spread, } from 'lexical';

import { DecoratorNode, } from 'lexical';

import { useEffect, useState } from 'react';

import { NonDeleted, ExcalidrawElement } from '@excalidraw/excalidraw/types/element/types';
import { ImageComponent } from '../ImageNode';

import Virgil from "@excalidraw/excalidraw/dist/excalidraw-assets/Virgil.woff2";
import Cascadia from "@excalidraw/excalidraw/dist/excalidraw-assets/Cascadia.woff2";

const encodeFonts = Promise.all([
  fetch(Virgil).then(res => res.blob()).then(async blob => {
    new FontFace("Virgil", await blob.arrayBuffer()).load().then(font => document.fonts.add(font));
    return blobToBase64(blob)
  }),
  fetch(Cascadia).then(res => res.blob()).then(async blob => {
    new FontFace("Cascadia", await blob.arrayBuffer()).load().then(font => document.fonts.add(font));
    return blobToBase64(blob)
  })
]);

export interface SketchPayload {
  key?: NodeKey;
  width?: number;
  height?: number;
  src: string;
  value: NonDeleted<ExcalidrawElement>[]
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

const blobToBase64 = (blob: Blob) => {
  const reader = new FileReader();
  reader.readAsDataURL(blob);
  return new Promise<string>(resolve => {
    reader.onloadend = () => {
      resolve(reader.result as string);
    };
  });
};

function SketchComponent({
  nodeKey,
  width,
  height,
  src,
  value,
  resizable,
}: {
  width: 'inherit' | number;
  height: 'inherit' | number;
  src: string;
  nodeKey: NodeKey;
  resizable: boolean;
  value: NonDeleted<ExcalidrawElement>[];
}): JSX.Element {

  const [source, setSource] = useState<string | null>(null);

  useEffect(() => {
    async function embedFonts() {
      const [virgil, cascadia] = await encodeFonts;
      const fonts = `@font-face { font-family: 'Virgil'; src: url('${virgil}') format('woff2');} @font-face { font-family: 'Cascadia'; src: url('${cascadia}') format('woff2'); }`;
      const encoded = src.substring(src.indexOf(',') + 1);
      const decoded = decodeURIComponent(encoded);
      const serialized = decoded.replace(/<style>[\s\S]*<\/style>/, `<style>${fonts}</style>`);

      setSource(`data:image/svg+xml,${encodeURIComponent(serialized)}`);
    };
    embedFonts();
  }, [src]);

  return (
    <ImageComponent nodeKey={nodeKey} width={width} height={height} src={source || src} altText="" resizable={resizable} />
  );
}

export type SerializedSketchNode = Spread<
  {
    width?: number;
    height?: number;
    src: string;
    value: NonDeleted<ExcalidrawElement>[];
    type: 'sketch';
    version: 1;
  },
  SerializedLexicalNode
>;

export class SketchNode extends DecoratorNode<JSX.Element> {
  __width: 'inherit' | number;
  __height: 'inherit' | number;
  __src: string;
  __value: NonDeleted<ExcalidrawElement>[];

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
    value: NonDeleted<ExcalidrawElement>[],
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

  update(src: string, value: NonDeleted<ExcalidrawElement>[]): void {
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

  getValue(): NonDeleted<ExcalidrawElement>[] {
    return this.__value;
  }

  decorate(): JSX.Element {
    return (
      <SketchComponent
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
