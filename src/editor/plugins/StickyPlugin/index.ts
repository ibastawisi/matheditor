/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import { useLexicalComposerContext } from '@lexical/react/LexicalComposerContext';
import { LexicalCommand, $createParagraphNode, LexicalEditor, $insertNodes, $isRootNode } from 'lexical';
import { useEffect } from 'react';
import { mergeRegister, $wrapNodeInElement } from '@lexical/utils';
import {
  $createRangeSelection,
  $getSelection,
  $isNodeSelection,
  $setSelection,
  COMMAND_PRIORITY_EDITOR,
  COMMAND_PRIORITY_HIGH,
  COMMAND_PRIORITY_LOW,
  createCommand,
  DRAGOVER_COMMAND,
  DRAGSTART_COMMAND,
  DROP_COMMAND,
} from 'lexical';

import { $createStickyNode, $isStickyNode, StickyNode, StickyPayload } from '../../nodes/StickyNode';
export type InsertStickyPayload = Readonly<StickyPayload>;

export const INSERT_STICKY_COMMAND: LexicalCommand<InsertStickyPayload | undefined> = createCommand();

export default function StickyPlugin(): JSX.Element | null {
  const [editor] = useLexicalComposerContext();
  useEffect(() => {
    if (!editor.hasNodes([StickyNode])) {
      throw new Error('StickyPlugin: StickyNode not registered on editor');
    }
    return mergeRegister(
      editor.registerCommand(
        INSERT_STICKY_COMMAND,
        (payload) => {
          const stickyNode = $createStickyNode(payload);
          $insertNodes([stickyNode]);
          if ($isRootNode(stickyNode.getParentOrThrow())) {
            $wrapNodeInElement(stickyNode, $createParagraphNode)
          }
          stickyNode.select();
          return true;
        },
        COMMAND_PRIORITY_EDITOR,
      ), editor.registerCommand<DragEvent>(
        DRAGSTART_COMMAND,
        (event) => {
          return onDragStart(event);
        },
        COMMAND_PRIORITY_HIGH,
      ),
      editor.registerCommand<DragEvent>(
        DRAGOVER_COMMAND,
        (event) => {
          return onDragover(event);
        },
        COMMAND_PRIORITY_LOW,
      ),
      editor.registerCommand<DragEvent>(
        DROP_COMMAND,
        (event) => {
          return onDrop(event, editor);
        },
        COMMAND_PRIORITY_HIGH,
      ),
    );
  }, [editor]);

  return null;
}

const TRANSPARENT_STICKY =
  'data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7';
const img = document.createElement('img');
img.src = TRANSPARENT_STICKY;

function onDragStart(event: DragEvent): boolean {
  const node = getStickyNodeInSelection();
  if (!node) {
    return false;
  }
  const dataTransfer = event.dataTransfer;
  if (!dataTransfer) {
    return false;
  }
  dataTransfer.setData('text/plain', '_');
  dataTransfer.setDragImage(img, 0, 0);
  dataTransfer.setData(
    'application/x-lexical-drag',
    JSON.stringify({
      data: {
        color: node.__color,
        editor: node.__editor,
        key: node.getKey(),
      },
      type: 'sticky',
    }),
  );

  return true;
}

function onDragover(event: DragEvent): boolean {
  const node = getStickyNodeInSelection();
  if (!node) {
    return false;
  }
  if (!canDropSticky(event)) {
    event.preventDefault();
  }
  return true;
}

function onDrop(event: DragEvent, editor: LexicalEditor): boolean {
  const node = getStickyNodeInSelection();
  if (!node) {
    return false;
  }
  const data = getDragStickyData(event);
  if (!data) {
    return false;
  }
  event.preventDefault();
  if (canDropSticky(event)) {
    const range = getDragSelection(event);
    node.remove();
    const rangeSelection = $createRangeSelection();
    if (range !== null && range !== undefined) {
      rangeSelection.applyDOMRange(range);
    }
    $setSelection(rangeSelection);
    editor.dispatchCommand(INSERT_STICKY_COMMAND, data);
  }
  return true;
}

function getStickyNodeInSelection(): StickyNode | null {
  const selection = $getSelection();
  if (!$isNodeSelection(selection)) {
    return null;
  }
  const nodes = selection.getNodes();
  const node = nodes[0];
  return $isStickyNode(node) ? node : null;
}

function getDragStickyData(event: DragEvent): null {
  const dragData = event.dataTransfer?.getData('application/x-lexical-drag');
  if (!dragData) {
    return null;
  }
  const { type, data } = JSON.parse(dragData);
  if (type !== 'sticky') {
    return null;
  }

  return data;
}

declare global {
  interface DragEvent {
    rangeOffset?: number;
    rangeParent?: Node;
  }
}

function canDropSticky(event: DragEvent): boolean {
  const target = event.target;
  return !!(
    target &&
    target instanceof HTMLElement &&
    !target.closest('code, figure.LexicalTheme__image, div.sticky-note-container') &&
    target.parentElement &&
    target.parentElement.closest('div.editor-input')
  );
}

function getDragSelection(event: DragEvent): Range | null | undefined {
  let range;
  const domSelection = getSelection();
  if (document.caretRangeFromPoint) {
    range = document.caretRangeFromPoint(event.clientX, event.clientY);
  } else if (event.rangeParent && domSelection !== null) {
    domSelection.collapse(event.rangeParent, event.rangeOffset || 0);
    range = domSelection.getRangeAt(0);
  } else {
    throw Error(`Cannot get the selection when dragging`);
  }

  return range;
}
