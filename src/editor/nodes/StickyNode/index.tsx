/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import type {
  BaseSelection,
  DOMExportOutput,
  EditorConfig,
  LexicalEditor,
  LexicalNode,
  NodeKey,
  SerializedEditor,
  SerializedLexicalNode,
  Spread,
} from 'lexical';

import { $createNodeSelection, $getRoot, $getSelection, $setSelection, DecoratorNode, createEditor, isHTMLElement } from 'lexical';
import * as React from 'react';
import { editorConfig } from './config';
import { $generateHtmlFromNodes } from "@lexical/html";
import StickyComponent from './StickyComponent';
import htmr from 'htmr';

export interface StickyPayload {
  editor?: SerializedEditor;
  style?: string;
}

export type SerializedStickyNode = Spread<
  {
    editor: SerializedEditor,
    style: string,
  },
  SerializedLexicalNode
>;

export class StickyNode extends DecoratorNode<JSX.Element> {
  __editor: LexicalEditor;
  __style: string;

  static getType(): string {
    return 'sticky';
  }

  static clone(node: StickyNode): StickyNode {
    return new StickyNode(
      node.__style,
      node.__editor,
      node.__key,
    );
  }
  static importJSON(serializedNode: SerializedStickyNode): StickyNode {
    const { editor, style } = serializedNode;
    const node = $createStickyNode({ style });
    const nestedEditor = node.__editor;
    try {
      const editorState = nestedEditor.parseEditorState(editor?.editorState);
      if (!editorState.isEmpty()) {
        nestedEditor.setEditorState(editorState);
      }
    } catch (e) { console.error(e) }
    return node;
  }

  constructor(
    style: string,
    editor?: LexicalEditor,
    key?: NodeKey,
  ) {
    super(key);
    this.__style = style;
    this.__editor = editor ?? createEditor(editorConfig);
  }

  exportJSON(): SerializedStickyNode {
    return {
      editor: this.__editor.toJSON(),
      style: this.__style,
      type: 'sticky',
      version: 1,
    };
  }

  exportDOM(editor: LexicalEditor): DOMExportOutput {
    const { element } = super.exportDOM(editor);
    if (element && isHTMLElement(element)) {
      this.__editor.getEditorState().read(() => {
        const html = $generateHtmlFromNodes(this.__editor);
        element.innerHTML = html;
      });
    }
    return { element };
  };

  createDOM(config: EditorConfig, editor: LexicalEditor): HTMLElement {
    this.__editor._parentEditor = editor;
    const div = document.createElement('div');
    div.className = 'sticky-note';
    div.style.cssText = this.__style;
    div.setAttribute('theme', 'light');
    return div;
  }

  updateDOM(prevNode: StickyNode, dom: HTMLElement): boolean {
    dom.style.cssText = this.getStyle();
    return false;
  }

  getStyle(): string {
    const self = this.getLatest();
    return self.__style;
  }

  setStyle(style: string): this {
    const self = this.getWritable();
    self.__style = style;
    return self;
  }

  select() {
    const nodeSelection = $createNodeSelection();
    nodeSelection.add(this.getKey());
    $setSelection(nodeSelection);
  }

  focus() {
    const editor = this.__editor;
    editor.update(() => {
      const selection = $getSelection();
      if (selection) return editor.focus();
      const root = $getRoot();
      root.selectStart();
    });
  }

  isSelected(selection?: null | BaseSelection): boolean {
    try {
      return super.isSelected(selection);
    } catch (e) {
      return false;
    }
  }


  decorate(): JSX.Element {
    const html = this.__editor.getEditorState().read(() => $generateHtmlFromNodes(this.__editor));
    const children = htmr(html);

    return (
      <StickyComponent
        nodeKey={this.getKey()}
        stickyEditor={this.__editor}
      >
        {children}
      </StickyComponent>
    );
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
  const style = payload?.style ?? 'float: right; background-color: #bceac4;';
  const node = new StickyNode(style);
  if (payload?.editor) {
    const nestedEditor = node.__editor;
    const editorState = nestedEditor.parseEditorState(payload.editor.editorState);
    if (!editorState.isEmpty()) {
      nestedEditor.setEditorState(editorState);
    }
  }
  return node;
}
