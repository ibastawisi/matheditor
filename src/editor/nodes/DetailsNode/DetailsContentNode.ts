/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import {
  DOMConversionMap,
  DOMConversionOutput,
  DOMExportOutput,
  EditorConfig,
  ElementNode,
  LexicalEditor,
  LexicalNode,
  SerializedElementNode,
} from 'lexical';
import { IS_CHROME } from '@lexical/utils';
import invariant from '@/shared/invariant';

import { $isDetailsContainerNode } from './DetailsContainerNode';
import { domOnBeforeMatch, setDomHiddenUntilFound } from './utils';

type SerializedDetailsContentNode = SerializedElementNode;

export function $convertDetailsContentElement(
  domNode: HTMLElement,
): DOMConversionOutput | null {
  const node = $createDetailsContentNode();
  return {
    node,
  };
}

export class DetailsContentNode extends ElementNode {
  static getType(): string {
    return 'details-content';
  }

  static clone(node: DetailsContentNode): DetailsContentNode {
    return new DetailsContentNode(node.__key);
  }

  createDOM(config: EditorConfig, editor: LexicalEditor): HTMLElement {
    const dom = document.createElement('div');
    dom.classList.add('details__content');
    if (IS_CHROME) {
      editor.getEditorState().read(() => {
        const containerNode = this.getParentOrThrow();
        invariant(
          $isDetailsContainerNode(containerNode),
          'Expected parent node to be a DetailsContainerNode',
        );
        if (!containerNode.__open) {
          setDomHiddenUntilFound(dom);
        }
      });
      domOnBeforeMatch(dom, () => {
        editor.update(() => {
          const containerNode = this.getParentOrThrow().getLatest();
          invariant(
            $isDetailsContainerNode(containerNode),
            'Expected parent node to be a DetailsContainerNode',
          );
          if (!containerNode.__open) {
            containerNode.toggleOpen();
          }
        });
      });
    }
    return dom;
  }

  updateDOM(prevNode: DetailsContentNode, dom: HTMLElement): boolean {
    return false;
  }

  static importDOM(): DOMConversionMap | null {
    return {
      div: (domNode: HTMLElement) => {
        if (!domNode.hasAttribute('data-lexical-Details-content')) {
          return null;
        }
        return {
          conversion: $convertDetailsContentElement,
          priority: 2,
        };
      },
    };
  }

  exportDOM(): DOMExportOutput {
    const element = document.createElement('div');
    element.classList.add('details__content');
    element.setAttribute('data-lexical-Details-content', 'true');
    return { element };
  }

  static importJSON(
    serializedNode: SerializedDetailsContentNode,
  ): DetailsContentNode {
    return $createDetailsContentNode();
  }

  isShadowRoot(): boolean {
    return true;
  }

  exportJSON(): SerializedDetailsContentNode {
    return {
      ...super.exportJSON(),
      type: 'details-content',
      version: 1,
    };
  }
}

export function $createDetailsContentNode(): DetailsContentNode {
  return new DetailsContentNode();
}

export function $isDetailsContentNode(
  node: LexicalNode | null | undefined,
): node is DetailsContentNode {
  return node instanceof DetailsContentNode;
}