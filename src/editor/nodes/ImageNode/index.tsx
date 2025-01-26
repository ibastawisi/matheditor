/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import {
  $createNodeSelection,
  $createParagraphNode,
  $createTextNode,
  $getRoot,
  $setSelection,
  BaseSelection,
  DOMConversionMap,
  DOMConversionOutput,
  DOMExportOutput,
  EditorConfig,
  LexicalEditor,
  LexicalNode,
  NodeKey,
  SerializedEditor,
  SerializedLexicalNode,
  Spread,
  createEditor,
} from 'lexical';

import { DecoratorNode } from 'lexical';
import { editorConfig } from './config';
import { $generateHtmlFromNodes } from "@lexical/html";

import ImageComponent from './ImageComponent';
import htmr from 'htmr';
import { JSX } from "react";
import { floatWrapperElement, getStyleObjectFromRawCSS } from '../utils';

export interface ImagePayload {
  altText?: string;
  height: number;
  key?: NodeKey;
  src: string;
  width: number;
  style: string;
  id: string;
  showCaption?: boolean;
  caption?: LexicalEditor;
}

function convertImageElement(domNode: Node): null | DOMConversionOutput {
  const img = domNode as HTMLImageElement;
  if (img.src.startsWith('file:///')) {
    return null;
  }
  const { alt: altText, src, width, height, id, } = img;
  const style = '';
  const node = $createImageNode({ altText, height, src, width, id, style });
  return { node };
}

export type SerializedImageNode = Spread<
  {
    altText: string;
    height: number;
    src: string;
    width: number;
    style: string;
    id: string;
    showCaption: boolean;
    caption: SerializedEditor;
  },
  SerializedLexicalNode
>;

export class ImageNode extends DecoratorNode<JSX.Element> {
  __src: string;
  __altText: string;
  __width: number;
  __height: number;
  __style: string;
  __id: string;
  __showCaption: boolean;
  __caption: LexicalEditor;

  static getType(): string {
    return 'image';
  }

  static clone(node: ImageNode): ImageNode {
    return new ImageNode(
      node.__src,
      node.__altText,
      node.__width,
      node.__height,
      node.__style,
      node.__id,
      node.__showCaption,
      node.__caption,
      node.__key,
    );
  }

  static importJSON(serializedNode: SerializedImageNode): ImageNode {
    const { altText, height, width, src, style, caption, showCaption, id } =
      serializedNode;
    const node = $createImageNode({
      altText,
      height,
      src,
      width,
      style,
      id,
      showCaption,
    });
    try {
      if (caption) {
        const nestedEditor = node.__caption;
        const editorState = nestedEditor.parseEditorState(caption.editorState);
        if (!editorState.isEmpty()) {
          nestedEditor.setEditorState(editorState);
        }
      }
    } catch (error) { console.error(error); }
    return node;
  }

  exportDOM(editor: LexicalEditor): DOMExportOutput {
    const { element } = super.exportDOM(editor);
    if (!element) return { element };
    const img = document.createElement('img');
    img.setAttribute('src', this.__src);
    img.setAttribute('alt', this.__altText);
    if (this.__width) img.setAttribute('width', this.__width.toString());
    if (this.__height) img.setAttribute('height', this.__height.toString());
    if (this.__width && this.__height) img.setAttribute('style', `aspect-ratio: ${this.__width}/${this.__height};`);
    element.appendChild(img);
    if (!this.__showCaption) return { element };
    const caption = document.createElement('figcaption');
    this.__caption.getEditorState().read(() => {
      caption.innerHTML = $generateHtmlFromNodes(this.__caption);
    });
    element.appendChild(caption);
    return { element };
  }

  static importDOM(): DOMConversionMap | null {
    return {
      img: (node: Node) => ({
        conversion: convertImageElement,
        priority: 0,
      }),
    };
  }

  constructor(
    src: string,
    altText: string,
    width: number,
    height: number,
    style: string,
    id: string,
    showCaption?: boolean,
    caption?: LexicalEditor,
    key?: NodeKey,
  ) {
    super(key);
    this.__src = src;
    this.__altText = altText;
    this.__width = width;
    this.__height = height;
    this.__style = style;
    this.__id = id;
    this.__showCaption = !!showCaption;
    if (caption) this.__caption = caption
    else {
      const editor = createEditor(editorConfig);
      editor.update(() => {
        const root = $getRoot();
        const paragraph = $createParagraphNode().setFormat('center');
        paragraph.append($createTextNode(altText));
        root.append(paragraph);
      });
      this.__caption = editor;
    }
  }

  exportJSON(): SerializedImageNode {
    return {
      altText: this.getAltText(),
      height: this.__height,
      src: this.getSrc(),
      style: this.__style,
      id: this.__id,
      type: 'image',
      version: 1,
      width: this.__width,
      showCaption: this.__showCaption,
      caption: this.__caption.toJSON(),
    };
  }

  getId(): string {
    return this.__id;
  }

  setId(id: string): void {
    const writable = this.getWritable();
    writable.__id = id;
  }

  getWidth(): number {
    return this.__width;
  }

  getHeight(): number {
    return this.__height;
  }

  setWidthAndHeight(
    width: number,
    height: number,
  ): void {
    const writable = this.getWritable();
    writable.__width = width;
    writable.__height = height;
  }

  setSrc(
    src: string,
  ): void {
    const writable = this.getWritable();
    writable.__src = src;
  }

  getStyle(): string {
    return this.__style;
  }

  setStyle(style: string): this {
    const self = this.getWritable();
    self.__style = style;
    return self;
  }

  getShowCaption(): boolean {
    return this.__showCaption;
  }

  setShowCaption(showCaption: boolean): void {
    const writable = this.getWritable();
    writable.__showCaption = showCaption;
  }

  update(payload: Partial<ImagePayload>): void {
    const writable = this.getWritable();
    writable.__src = payload.src ?? writable.__src;
    writable.__altText = payload.altText ?? writable.__altText;
    writable.__width = payload.width ?? writable.__width;
    writable.__height = payload.height ?? writable.__height;
    writable.__style = payload.style ?? writable.__style;
    writable.__id = payload.id ?? writable.__id;
    writable.__showCaption = payload.showCaption ?? writable.__showCaption;
    writable.__caption = payload.caption ?? writable.__caption;
  }


  select() {
    const nodeSelection = $createNodeSelection();
    nodeSelection.add(this.getKey());
    $setSelection(nodeSelection);
  }

  createDOM(config: EditorConfig, editor: LexicalEditor): HTMLElement {
    const element = document.createElement('figure');
    const theme = config.theme;
    const className = theme.image;
    if (className) element.className = className;
    const style = getStyleObjectFromRawCSS(this.__style);
    const float = style.float;
    floatWrapperElement(element, config, float);
    if (this.__id) element.id = this.__id;
    this.__caption._parentEditor = editor;
    return element;
  }

  updateDOM(prevNode: ImageNode, dom: HTMLElement, config: EditorConfig): boolean {
    if (this.__style !== prevNode.__style) {
      const style = getStyleObjectFromRawCSS(this.__style);
      const float = style.float;
      floatWrapperElement(dom, config, float);
    }
    if (prevNode.__id !== this.__id) {
      dom.id = this.__id;
    }
    return false;
  }

  getSrc(): string {
    return this.__src;
  }

  getAltText() {
    return this.__altText;
  }

  isSelected(selection?: null | BaseSelection): boolean {
    try {
      return super.isSelected(selection);
    } catch (e) {
      return false;
    }
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
      >
        {children}
      </ImageComponent>
    );
  }
}

export function $createImageNode({
  altText = 'Image',
  height,
  src,
  width,
  style,
  id,
  showCaption,
  caption,
  key,
}: ImagePayload): ImageNode {
  return new ImageNode(
    src,
    altText,
    width,
    height,
    style,
    id,
    showCaption,
    caption,
    key,
  );
}

export function $isImageNode(
  node: LexicalNode | null | undefined,
): node is ImageNode {
  return node instanceof ImageNode;
}
