/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import type {
  EditorConfig,
  LexicalEditor,
  LexicalNode,
  NodeKey,
  SerializedEditorState,
  SerializedLexicalNode,
  Spread,
} from 'lexical';

import { $createNodeSelection, $setSelection, DecoratorNode } from 'lexical';
import * as React from 'react';
import { Suspense } from 'react';

const StickyComponent = React.lazy(
  // @ts-ignore
  () => import('./StickyComponent'),
);

type StickyNoteColor = 'pink' | 'yellow';

export interface StickyPayload {
  color?: StickyNoteColor;
  data?: SerializedEditorState;
}

export type SerializedStickyNode = Spread<
  {
    color: StickyNoteColor;
    data?: SerializedEditorState;
  },
  SerializedLexicalNode
>;

export class StickyNode extends DecoratorNode<JSX.Element> {
  __color: StickyNoteColor;
  __data?: SerializedEditorState;

  static getType(): string {
    return 'sticky';
  }

  static clone(node: StickyNode): StickyNode {
    return new StickyNode(
      node.__color,
      node.__data,
      node.__key,
    );
  }
  static importJSON(serializedNode: SerializedStickyNode): StickyNode {
    return new StickyNode(
      serializedNode.color,
      serializedNode.data,
    );
  }

  constructor(
    color: StickyNoteColor,
    data?: SerializedEditorState,
    key?: NodeKey,
  ) {
    super(key);
    this.__data = data;
    this.__color = color;
  }

  exportJSON(): SerializedStickyNode {
    return {
      data: this.__data,
      color: this.__color,
      type: 'sticky',
      version: 1,
    };
  }

  exportDOM(editor: LexicalEditor): any {
    const element = document.createElement('sticky');
    const key = this.getKey();
    element.setAttribute('key', key);
    return { element };
  };

  createDOM(config: EditorConfig): HTMLElement {
    const div = document.createElement('div');
    div.className = 'sticky-note-wrapper';
    return div;
  }

  updateDOM(): false {
    return false;
  }

  getData(): SerializedEditorState | undefined {
    return this.__data;
  }

  setData(data: SerializedEditorState): void {
    const writable = this.getWritable();
    writable.__data = data;
  }

  toggleColor(): void {
    const writable = this.getWritable();
    writable.__color = writable.__color === 'pink' ? 'yellow' : 'pink';
  }

  select() {
    const nodeSelection = $createNodeSelection();
    nodeSelection.add(this.getKey());
    $setSelection(nodeSelection);
  }

  decorate(editor: LexicalEditor, config: EditorConfig): JSX.Element {
    return <Suspense fallback={null}>
        <StickyComponent
          color={this.__color}
          nodeKey={this.getKey()}
          data={this.__data}
        />
      </Suspense>;
  }

  isIsolated(): true {
    return true;
  }
}

export function $isStickyNode(
  node: LexicalNode | null | undefined,
): node is StickyNode {
  return node instanceof StickyNode;
}

export function $createStickyNode(payload?: StickyPayload): StickyNode {
  const color = payload?.color || 'yellow';
  const data = payload?.data;
  return new StickyNode(color, data);
}
