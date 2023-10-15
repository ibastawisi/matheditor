/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import type {
  DOMConversionMap,
  DOMConversionOutput,
  DOMExportOutput,
  EditorConfig,
  ElementFormatType,
  LexicalEditor,
  LexicalNode,
  NodeKey,
  Spread,
} from 'lexical';

import {
  DecoratorBlockNode,
  SerializedDecoratorBlockNode,
} from '@lexical/react/LexicalDecoratorBlockNode';
import * as React from 'react';
import { IFrameComponent } from './IFrameComponent';

export interface IFramePayload {
  url: string;
  width: string;
  height: string;
};

export type SerializedIFrameNode = Spread<
  {
    url: string;
    width: string;
    height: string;
  },
  SerializedDecoratorBlockNode
>;

function convertIFrameElement(
  domNode: HTMLElement,
): null | DOMConversionOutput {
  const url = domNode.getAttribute('data-lexical-iFrame');
  if (url) {
    const width = domNode.getAttribute('width') || '560px';
    const height = domNode.getAttribute('height') || '315px';
    const node = $createIFrameNode({ url, width, height });
    return { node };
  }
  return null;
}

export class IFrameNode extends DecoratorBlockNode {
  __url: string;
  __width: string = '560';
  __height: string = '315';

  static getType(): string {
    return 'iFrame';
  }

  static clone(node: IFrameNode): IFrameNode {
    return new IFrameNode(node.__url,
      node.__width, node.__height,
      node.__format, node.__key);
  }

  static importJSON(serializedNode: SerializedIFrameNode): IFrameNode {
    const node = $createIFrameNode(serializedNode);
    node.setFormat(serializedNode.format);
    return node;
  }

  exportJSON(): SerializedIFrameNode {
    return {
      ...super.exportJSON(),
      type: 'iFrame',
      version: 1,
      url: this.__url,
      width: this.__width,
      height: this.__height,
    };
  }

  constructor(url: string, width: string, height: string, format?: ElementFormatType, key?: NodeKey) {
    super(format, key);
    this.__url = url;
    this.__width = width;
    this.__height = height;
  }

  exportDOM(): DOMExportOutput {
    const element = document.createElement('iframe');
    element.setAttribute('data-lexical-iFrame', this.__url);
    element.setAttribute('width', this.__width);
    element.setAttribute('height', this.__height);
    element.setAttribute('src', this.__url);
    element.setAttribute('frameborder', '0');
    element.setAttribute(
      'allow',
      'accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture',
    );
    element.setAttribute('allowfullscreen', 'true');
    element.setAttribute('title', 'IFrame');
    return { element };
  }

  static importDOM(): DOMConversionMap | null {
    return {
      iframe: (domNode: HTMLElement) => {
        if (!domNode.hasAttribute('data-lexical-iFrame')) {
          return null;
        }
        return {
          conversion: convertIFrameElement,
          priority: 1,
        };
      },
    };
  }

  updateDOM(): false {
    return false;
  }

  getUrl(): string {
    return this.__url;
  }

  setUrl(url: string): void {
    this.__url = url;
  }

  getWidth(): string {
    return this.__width;
  }

  setWidth(width: string): void {
    this.__width = width;
  }

  getHeight(): string {
    return this.__height;
  }

  setHeight(height: string): void {
    this.__height = height;
  }

  getTextContent(
    _includeInert?: boolean | undefined,
    _includeDirectionless?: false | undefined,
  ): string {
    return this.__url;
  }

  update(payload: Partial<IFramePayload>): void {
    const writable = this.getWritable();
    if (payload.url) writable.__url = payload.url;
    if (payload.width) writable.__width = payload.width;
    if (payload.height) writable.__height = payload.height;
  }

  decorate(_editor: LexicalEditor, config: EditorConfig): JSX.Element {
    const embedBlockTheme = config.theme.embedBlock || {};
    const className = {
      base: embedBlockTheme.base || '',
      focus: embedBlockTheme.focus || '',
    };
    return (
      <IFrameComponent
        className={className}
        format={this.__format}
        nodeKey={this.getKey()}
        url={this.__url}
        width={this.__width}
        height={this.__height}
      />
    );
  }
}

export function $createIFrameNode(payload: IFramePayload): IFrameNode {
  const { url, width, height } = payload;
  return new IFrameNode(url, width, height);
}

export function $isIFrameNode(
  node: IFrameNode | LexicalNode | null | undefined,
): node is IFrameNode {
  return node instanceof IFrameNode;
}