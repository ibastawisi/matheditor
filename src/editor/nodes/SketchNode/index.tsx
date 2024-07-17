/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import { DOMConversionMap, DOMConversionOutput, DOMExportOutput, LexicalEditor, LexicalNode, NodeKey, Spread, isHTMLElement, } from 'lexical';
import { NonDeleted, ExcalidrawElement } from '@excalidraw/excalidraw/types/element/types';

import { ImageNode, ImagePayload, SerializedImageNode } from '../ImageNode';
import { $generateHtmlFromNodes } from "@lexical/html";

import ImageComponent from '../ImageNode/ImageComponent';

export type SketchPayload = Spread<{
  /**
 * @deprecated The value is now embedded in the src
 */
  value?: NonDeleted<ExcalidrawElement>[]
}, ImagePayload>


function convertSketchElement(domNode: Node): null | DOMConversionOutput {
  if (domNode instanceof HTMLImageElement) {
    const { alt: altText, src, width, height } = domNode;
    const style = domNode.style.cssText;
    const value: NonDeleted<ExcalidrawElement>[] = domNode.dataset.value ? JSON.parse(domNode.dataset.value) : [];
    const node = $createSketchNode({ src, altText, value, style, width, height });
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
      node.__width,
      node.__height,
      node.__value,
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
    try {
      if (caption) {
        const nestedEditor = node.__caption;
        const editorState = nestedEditor.parseEditorState(caption.editorState);
        if (!editorState.isEmpty()) {
          nestedEditor.setEditorState(editorState);
        }
      }
    } catch (e) { console.error(e); }
    return node;
  }

  exportDOM(editor: LexicalEditor): DOMExportOutput {
    const element = super.createDOM(editor._config);
    if (element && isHTMLElement(element)) {
      const html = decodeURIComponent(this.__src.split(',')[1]);
      element.innerHTML = html.replace(/<!-- payload-start -->\s*(.+?)\s*<!-- payload-end -->/, "");
      const svg = element.firstElementChild!;
      const style = svg.querySelector('style');
      if (style) style.innerHTML = `@media screen {
        [theme=dark] [fill='#ffffff'] { fill: transparent; }
        [theme=dark] [fill='#000000'] { fill: currentColor; }
        [theme=dark] [stroke='#000000'] { stroke: currentColor; }
        [theme=dark] [stroke='#1e1e1e'] { stroke: currentColor; }
      }`;
      if (this.__width) svg.setAttribute('width', this.__width.toString());
      if (this.__height) svg.setAttribute('height', this.__height.toString());
      if (!this.__showCaption) return { element };
      const caption = document.createElement('figcaption');
      this.__caption.getEditorState().read(() => {
        caption.innerHTML = $generateHtmlFromNodes(this.__caption);
      });
      element.appendChild(caption);
    }
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
    width: number,
    height: number,
    value?: NonDeleted<ExcalidrawElement>[],
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
      <ImageComponent
        width={this.getWidth()}
        height={this.getHeight()}
        src={this.getSrc()}
        altText={this.getAltText()}
        nodeKey={this.getKey()}
        showCaption={this.getShowCaption()}
        caption={this.getCaption()}
        element='svg'
      />
    );
  }
}

export function $createSketchNode({
  src,
  altText = "Sketch",
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
    width,
    height,
    value,
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
