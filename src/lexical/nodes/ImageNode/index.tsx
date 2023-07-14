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
import { Suspense, lazy } from 'react';
import { editorConfig } from './config';
import { $generateHtmlFromNodes } from '@lexical/html';

const ImageComponent = lazy(() => import('./ImageComponent'));

export interface ImagePayload {
  altText?: string;
  height?: number;
  key?: NodeKey;
  src: string;
  width?: number;
  style?: string;
  showCaption?: boolean;
  caption?: LexicalEditor;
}

function convertImageElement(domNode: Node): null | DOMConversionOutput {
  if (domNode instanceof HTMLImageElement) {
    const { alt: altText, src } = domNode;
    const node = $createImageNode({ altText, src });
    return { node };
  }
  return null;
}

export type SerializedImageNode = Spread<
  {
    altText: string;
    height: number;
    src: string;
    width: number;
    style?: string;
    showCaption: boolean;
    caption: SerializedEditor;
  },
  SerializedLexicalNode
>;

export class ImageNode extends DecoratorNode<JSX.Element> {
  __src: string;
  __altText: string;
  __width: 'inherit' | number;
  __height: 'inherit' | number;
  __style?: string;
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
      node.__showCaption,
      node.__caption,
      node.__key,
    );
  }

  static importJSON(serializedNode: SerializedImageNode): ImageNode {
    const { altText, height, width, src, style, caption, showCaption } =
      serializedNode;
    const node = $createImageNode({
      altText,
      height,
      src,
      width,
      style,
      showCaption
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

  exportDOM(editor: LexicalEditor): DOMExportOutput {
    const { element } = super.exportDOM(editor);
    if (!element) return { element };
    const img = document.createElement('img');
    img.setAttribute('src', this.__src);
    img.setAttribute('alt', this.__altText || '');
    img.setAttribute('width', this.__width.toString());
    img.setAttribute('height', this.__height.toString());
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
    width?: 'inherit' | number,
    height?: 'inherit' | number,
    style?: string,
    showCaption?: boolean,
    caption?: LexicalEditor,
    key?: NodeKey,
  ) {
    super(key);
    this.__src = src;
    this.__altText = altText;
    this.__width = width || 'inherit';
    this.__height = height || 'inherit';
    this.__style = style;
    this.__showCaption = showCaption || false;
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
      height: this.__height === 'inherit' ? 0 : this.__height,
      src: this.getSrc(),
      style: this.__style,
      type: 'image',
      version: 1,
      width: this.__width === 'inherit' ? 0 : this.__width,
      showCaption: this.__showCaption,
      caption: this.__caption.toJSON(),
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

  setSrc(
    src: string,
  ): void {
    const writable = this.getWritable();
    writable.__src = src;
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

  getShowCaption(): boolean {
    return this.__showCaption;
  }

  setShowCaption(showCaption: boolean): void {
    const writable = this.getWritable();
    writable.__showCaption = showCaption;
  }

  getCaption(): LexicalEditor {
    return this.__caption;
  }

  setCaption(caption: LexicalEditor): void {
    const writable = this.getWritable();
    writable.__caption = caption;
  }

  update(payload: Partial<ImagePayload>): void {
    const writable = this.getWritable();
    writable.__src = payload.src || writable.__src;
    writable.__altText = payload.altText || writable.__altText;
    writable.__width = payload.width || writable.__width;
    writable.__height = payload.height || writable.__height;
    writable.__style = payload.style || writable.__style;
    writable.__showCaption = payload.showCaption || writable.__showCaption;
    writable.__caption = payload.caption || writable.__caption;
  }


  select() {
    const nodeSelection = $createNodeSelection();
    nodeSelection.add(this.getKey());
    $setSelection(nodeSelection);
  }

  createDOM(config: EditorConfig): HTMLElement {
    const figure = document.createElement('figure');
    const theme = config.theme;
    const className = theme.image;
    if (className !== undefined) {
      figure.className = className;
    }
    if (this.__style) {
      figure.style.cssText = this.__style;
    }
    return figure;
  }

  updateDOM(prevNode: ImageNode): boolean {
    return prevNode.__src !== this.__src || prevNode.__style !== this.__style;
  }

  getSrc(): string {
    return this.__src;
  }

  getAltText() {
    return this.__altText;
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

export function $createImageNode({
  altText = 'Image',
  height,
  src,
  width,
  style,
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
