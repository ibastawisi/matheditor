/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import { DOMConversionMap, DOMConversionOutput, DOMExportOutput, EditorConfig, isHTMLElement, LexicalEditor, LexicalNode, NodeKey, Spread, } from 'lexical';

import { ImageNode, ImagePayload, SerializedImageNode } from '../ImageNode';

import { $generateHtmlFromNodes } from "@lexical/html";

import ImageComponent from '../ImageNode/ImageComponent';
import htmr from 'htmr';
import { JSX } from "react";

export type GraphPayload = Spread<{
  value: string;
}, ImagePayload>

function convertGraphElement(domNode: Node): null | DOMConversionOutput {
  if (domNode instanceof HTMLImageElement) {
    const { alt: altText, src, width, height, id } = domNode;
    const style = domNode.style.cssText;
    const value = domNode.dataset.value as string;
    const node = $createGraphNode({ src, altText, value, style, id, width, height });
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
      node.__id,
      node.__showCaption,
      node.__caption,
      node.__key,
    );
  }

  static importJSON(serializedNode: SerializedGraphNode): GraphNode {
    const { width, height, src, value, style, id, showCaption, caption, altText } =
      serializedNode;
    const node = $createGraphNode({
      src,
      value,
      width,
      height,
      style,
      id,
      showCaption,
      altText
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
    const isSVG = this.__src.startsWith('data:image/svg+xml');
    if (!isSVG) return super.exportDOM(editor);
    const element = this.createDOM(editor._config, editor);
    if (element && isHTMLElement(element)) {
      const html = decodeURIComponent(this.__src.split(',')[1]);
      element.innerHTML = html.replace(/<!-- payload-start -->\s*(.+?)\s*<!-- payload-end -->/, "");
      const svg = element.firstElementChild!;
      const styles = svg.querySelectorAll('style');
      styles.forEach(style => { style.remove(); });
      const viewBox = svg.getAttribute('viewBox');
      const svgWidth = svg.getAttribute('width') || this.__width.toString();
      const svgHeight = svg.getAttribute('height') || this.__height.toString();
      if (!viewBox) svg.setAttribute('viewBox', `0 0 ${svgWidth} ${svgHeight}`);
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
        conversion: convertGraphElement,
        priority: 0,
      }),
    };
  }

  constructor(
    src: string,
    altText: string,
    value: string,
    width: number,
    height: number,
    style: string,
    id: string,
    showCaption?: boolean,
    caption?: LexicalEditor,
    key?: NodeKey,
  ) {
    super(src, altText, width, height, style, id, showCaption, caption, key);
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
    const self = this.getLatest();
    const html = self.__caption.getEditorState().read(() => $generateHtmlFromNodes(self.__caption));
    const children = htmr(html);

    return (
      <ImageComponent
        src={self.__src}
        altText={self.__altText}
        width={self.__width}
        height={self.__height}
        nodeKey={self.__key}
        showCaption={self.__showCaption}
        caption={self.__caption}
        element={self.__src.startsWith('data:image/svg+xml') ? 'svg' : 'img'}
      >
        {children}
      </ImageComponent>
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
  id,
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
    id,
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
