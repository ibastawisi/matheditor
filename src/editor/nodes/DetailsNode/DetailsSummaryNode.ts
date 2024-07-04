/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import {
  $createParagraphNode,
  $isElementNode,
  DOMConversionMap,
  DOMConversionOutput,
  EditorConfig,
  ElementNode,
  LexicalEditor,
  LexicalNode,
  RangeSelection,
  SerializedElementNode,
} from 'lexical';
import { IS_CHROME } from '@lexical/utils';
import invariant from '@/shared/invariant';

import { $isDetailsContainerNode } from './DetailsContainerNode';
import { $isDetailsContentNode } from './DetailsContentNode';

type SerializedDetailsSummaryNode = SerializedElementNode & {
  editable: boolean;
};

export function $convertSummaryElement(
  domNode: HTMLElement,
): DOMConversionOutput | null {
  const node = $createDetailsSummaryNode();
  return {
    node,
  };
}

export class DetailsSummaryNode extends ElementNode {
  __editable: boolean;
  static getType(): string {
    return 'details-summary';
  }

  static clone(node: DetailsSummaryNode): DetailsSummaryNode {
    const summaryNode = new DetailsSummaryNode(node.__key);
    summaryNode.__editable = node.__editable;
    return summaryNode;
  }

  constructor(key?: string) {
    super(key);
    this.__editable = true;
  }

  createDOM(config: EditorConfig, editor: LexicalEditor): HTMLElement {
    const dom = document.createElement('summary');
    dom.classList.add('details__summary');
    if (IS_CHROME) {
      dom.addEventListener('click', () => {
        editor.update(() => {
          const Details = this.getLatest().getParentOrThrow();
          invariant(
            $isDetailsContainerNode(Details),
            'Expected parent node to be a DetailsContainerNode',
          );
          Details.toggleOpen();
        });
      });
    }
    if (this.__editable === false) dom.setAttribute('contenteditable', 'false');
    return dom;
  }

  updateDOM(prevNode: DetailsSummaryNode, dom: HTMLElement): boolean {
    if (prevNode.__editable !== this.__editable) {
      if (this.__editable) {
        dom.removeAttribute('contenteditable');
      } else {
        dom.setAttribute('contenteditable', 'false');
      }
    }
    return false;
  }

  static importDOM(): DOMConversionMap | null {
    return {
      summary: (domNode: HTMLElement) => {
        return {
          conversion: $convertSummaryElement,
          priority: 1,
        };
      },
    };
  }

  static importJSON(
    serializedNode: SerializedDetailsSummaryNode,
  ): DetailsSummaryNode {
    const summaryNode = $createDetailsSummaryNode();
    summaryNode.__editable = serializedNode.editable;
    return summaryNode;
  }

  exportJSON(): SerializedDetailsSummaryNode {
    return {
      ...super.exportJSON(),
      editable: this.__editable,
      type: 'details-summary',
      version: 1,
    };
  }

  collapseAtStart(_selection: RangeSelection): boolean {
    this.getParentOrThrow().insertBefore(this);
    return true;
  }

  insertNewAfter(_: RangeSelection, restoreSelection = true): ElementNode {
    const containerNode = this.getParentOrThrow();

    if (!$isDetailsContainerNode(containerNode)) {
      throw new Error(
        'DetailsSummaryNode expects to be child of DetailsContainerNode',
      );
    }

    if (containerNode.getOpen()) {
      const contentNode = this.getNextSibling();
      if (!$isDetailsContentNode(contentNode)) {
        throw new Error(
          'DetailsSummaryNode expects to have DetailsContentNode sibling',
        );
      }

      const firstChild = contentNode.getFirstChild();
      if ($isElementNode(firstChild)) {
        return firstChild;
      } else {
        const paragraph = $createParagraphNode();
        contentNode.append(paragraph);
        return paragraph;
      }
    } else {
      const paragraph = $createParagraphNode();
      containerNode.insertAfter(paragraph, restoreSelection);
      return paragraph;
    }
  }

  setEditable(editable: boolean): void {
    const writable = this.getWritable();
    writable.__editable = editable;
  }

  getEditable(): boolean {
    return this.getLatest().__editable;
  }

}

export function $createDetailsSummaryNode(): DetailsSummaryNode {
  return new DetailsSummaryNode();
}

export function $isDetailsSummaryNode(
  node: LexicalNode | null | undefined,
): node is DetailsSummaryNode {
  return node instanceof DetailsSummaryNode;
}