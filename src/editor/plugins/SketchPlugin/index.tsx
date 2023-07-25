"use client"
import { $createParagraphNode, $insertNodes, $isRootNode, LexicalCommand, LexicalEditor } from 'lexical';
import { $wrapNodeInElement, mergeRegister } from '@lexical/utils';
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

import { useLexicalComposerContext } from '@lexical/react/LexicalComposerContext';
import { useEffect } from 'react';

import { $createSketchNode, $isSketchNode, SketchNode, SketchPayload } from '../../nodes/SketchNode';

export type InsertSketchPayload = Readonly<SketchPayload>;

export const INSERT_SKETCH_COMMAND: LexicalCommand<InsertSketchPayload> = createCommand();

export default function SketchPlugin(): JSX.Element | null {
  const [editor] = useLexicalComposerContext();
  useEffect(() => {
    if (!editor.hasNodes([SketchNode])) {
      throw new Error(
        'SketchPlugin: SketchNode not registered on editor',
      );
    }

    return mergeRegister(
      editor.registerCommand<InsertSketchPayload>(
        INSERT_SKETCH_COMMAND,
        (payload) => {
          const sketchNode = $createSketchNode(payload);
          $insertNodes([sketchNode]);
          if ($isRootNode(sketchNode.getParentOrThrow())) {
            $wrapNodeInElement(sketchNode, $createParagraphNode).selectEnd();
          }
          return true;
        },
        COMMAND_PRIORITY_EDITOR,
      ),
      editor.registerCommand<DragEvent>(
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

function onDragStart(event: DragEvent): boolean {
  const TRANSPARENT_IMAGE =
    'data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7';
  const img = document.createElement('img');
  img.src = TRANSPARENT_IMAGE;

  const node = getSketchNodeInSelection();
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
        key: node.getKey(),
        src: node.__src,
        width: node.__width,
        height: node.__height,
        value: node.__value,
      },
      type: 'sketch',
    }),
  );

  return true;
}

function onDragover(event: DragEvent): boolean {
  const node = getSketchNodeInSelection();
  if (!node) {
    return false;
  }
  if (!canDropSketch(event)) {
    event.preventDefault();
  }
  return true;
}

function onDrop(event: DragEvent, editor: LexicalEditor): boolean {
  const node = getSketchNodeInSelection();
  if (!node) {
    return false;
  }
  const data = getDragSketchData(event);
  if (!data) {
    return false;
  }
  event.preventDefault();
  if (canDropSketch(event)) {
    const range = getDragSelection(event);
    node.remove();
    const rangeSelection = $createRangeSelection();
    if (range !== null && range !== undefined) {
      rangeSelection.applyDOMRange(range);
    }
    $setSelection(rangeSelection);
    editor.dispatchCommand(INSERT_SKETCH_COMMAND, data);
  }
  return true;
}

function getSketchNodeInSelection(): SketchNode | null {
  const selection = $getSelection();
  if (!$isNodeSelection(selection)) {
    return null;
  }
  const nodes = selection.getNodes();
  const node = nodes[0];
  return $isSketchNode(node) ? node : null;
}

function getDragSketchData(event: DragEvent): null | InsertSketchPayload {
  const dragData = event.dataTransfer?.getData('application/x-lexical-drag');
  if (!dragData) {
    return null;
  }
  const { type, data } = JSON.parse(dragData);
  if (type !== 'sketch') {
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

function canDropSketch(event: DragEvent): boolean {
  const target = event.target;
  return !!(
    target &&
    target instanceof HTMLElement &&
    !target.closest('code, figure.LexicalTheme__image, div.sticky-note') &&
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
