import "./index.css";
import {
  $addUpdateTag,
  $createParagraphNode,
  $createRangeSelection,
  $createTextNode,
  $getNearestNodeFromDOMNode,
  $getSelection,
  $insertNodes,
  $isRangeSelection,
  $isRootOrShadowRoot,
  $setSelection,
  COMMAND_PRIORITY_CRITICAL,
  COMMAND_PRIORITY_EDITOR,
  COMMAND_PRIORITY_HIGH,
  COMMAND_PRIORITY_LOW,
  defineExtension,
  DELETE_CHARACTER_COMMAND,
  DRAGOVER_COMMAND,
  DRAGSTART_COMMAND,
  DROP_COMMAND,
  ElementNode,
  HISTORY_PUSH_TAG,
  INSERT_PARAGRAPH_COMMAND,
  isHTMLElement,
  KEY_ARROW_LEFT_COMMAND,
  KEY_ARROW_RIGHT_COMMAND,
  LexicalEditor,
  SELECTION_CHANGE_COMMAND,
} from "lexical";
import { $findMatchingParent, $wrapNodeInElement, mergeRegister } from "@lexical/utils";

import { $createImageNode, $isImageNode, ImageNode } from "./nodes";
import { INSERT_IMAGE_COMMAND, type InsertImagePayload } from "./commands";
import { getSelectedNode } from "@/editor/utils/getSelectedNode";
import { getDOMRangeFromDragEvent } from "@/editor/utils/getSelectionRange";

function getNodeInSelection(): ImageNode | null {
  const selection = $getSelection();
  if ($isRangeSelection(selection)) {
    const node = getSelectedNode(selection);
    return $findMatchingParent(node, $isImageNode);
  }
  return null;
}

function getNodeFromTarget(target: EventTarget | null): ImageNode | null {
  if (!isHTMLElement(target) && !(target instanceof SVGElement)) return null;
  const node = $getNearestNodeFromDOMNode(target);
  if (!node) return null;
  return $findMatchingParent(node, $isImageNode);
}

function getMediaFromTarget(target: EventTarget | null): Element | null {
  if (!(target instanceof Element)) return null;
  return target.closest("[data-image-media]");
}

function canDropImage(event: DragEvent): boolean {
  const target = event.target;
  return !!(
    target &&
    target instanceof HTMLElement &&
    !target.closest("code, figure") &&
    target.parentElement &&
    target.parentElement.closest("div.editor-input")
  );
}

function onDragStart(event: DragEvent): boolean {
  const media = getMediaFromTarget(event.target);
  if (!media) return false;
  const figure = media.parentElement;
  if (!figure) return false;
  const node = getNodeFromTarget(media);
  if (!node) return false;
  const dataTransfer = event.dataTransfer;
  if (!dataTransfer) return false;
  dataTransfer.setData("text/plain", "_");
  dataTransfer.setDragImage(figure, 0, 0);
  node.selectEnd();
  return true;
}

function onDragover(event: DragEvent): boolean {
  const node = getNodeInSelection();
  if (!node) return false;
  if (!canDropImage(event)) {
    event.preventDefault();
  }
  return true;
}

function onDrop(event: DragEvent): boolean {
  const node = getNodeInSelection();
  if (!node) return false;
  event.preventDefault();
  if (canDropImage(event)) {
    node.remove();
    const rangeSelection = $createRangeSelection();
    const range = getDOMRangeFromDragEvent(event);
    rangeSelection.applyDOMRange(range);
    $setSelection(rangeSelection);
    rangeSelection.insertNodes([node]);
    $addUpdateTag(HISTORY_PUSH_TAG);
  }
  node.selectEnd();
  return true;
}

/** Moves a collapsed selection out of an image caption, so that images are never nested */
export function $moveSelectionOutOfImage() {
  const selection = $getSelection();
  if (!$isRangeSelection(selection)) return;
  const imageNode = $findMatchingParent(selection.anchor.getNode(), $isImageNode);
  if (!imageNode) return;
  const rangeSelection = imageNode.getRangeSelectionWithinParent();
  rangeSelection.anchor.set(rangeSelection.focus.key, rangeSelection.focus.offset, "element");
  $setSelection(rangeSelection);
}

/** Inserts an image-like node at the selection, wrapping it in a paragraph when needed */
export function $insertImageNode(node: ImageNode, altText: string) {
  $moveSelectionOutOfImage();
  node.append($createTextNode(altText));
  $insertNodes([node]);
  if ($isRootOrShadowRoot(node.getParentOrThrow())) {
    $wrapNodeInElement(node, $createParagraphNode).selectEnd();
  }
}

export function registerImageNodeHandlers(editor: LexicalEditor) {
  const $onSelectionChange = () => {
    const selection = $getSelection();
    const nativeSelection = window.getSelection();
    if (!$isRangeSelection(selection)) return false;
    const imageNode = $findMatchingParent(selection.anchor.getNode(), $isImageNode);
    if (!imageNode) return false;
    if (!nativeSelection) return false;
    const anchorNode = nativeSelection.anchorNode;
    if (!anchorNode) return false;
    const figure = editor.getElementByKey(imageNode.getKey());
    if (!figure) return false;
    const isTextAnchor = anchorNode.nodeType === Node.TEXT_NODE || anchorNode.nodeName === "FIGCAPTION";
    if (!isTextAnchor) {
      const activeElement = document.activeElement;
      if (figure.contains(activeElement)) {
        if (isHTMLElement(activeElement) && activeElement.nodeName === "FIGCAPTION") {
          const range = document.createRange();
          range.selectNodeContents(activeElement);
          nativeSelection.removeAllRanges();
          nativeSelection.addRange(range);
          return true;
        }
        return false;
      }

      const parent = imageNode.getParentOrThrow<ElementNode>();
      const parentKey = parent.getKey();
      const parentDom = editor.getElementByKey(parentKey);
      if (anchorNode !== parentDom) return false;
      const rangeSelection = $createRangeSelection();
      rangeSelection.anchor.set(parentKey, nativeSelection.anchorOffset, "element");
      rangeSelection.focus.set(parentKey, nativeSelection.focusOffset, "element");
      $setSelection(rangeSelection);
      return true;
    }

    return false;
  };

  const $onEscapeLeftRight = (event: KeyboardEvent) => {
    const selection = $getSelection();
    if (!$isRangeSelection(selection)) return false;
    const imageNode = $findMatchingParent(selection.anchor.getNode(), $isImageNode);
    if (!imageNode) return false;
    const nativeSelection = window.getSelection();
    const anchorNode = nativeSelection?.anchorNode;
    if (!anchorNode) return false;
    const isTextAnchor = anchorNode.nodeType === Node.TEXT_NODE || anchorNode.nodeName === "FIGCAPTION";
    if (isTextAnchor && !imageNode.getShowCaption()) {
      if (event.key === "ArrowLeft") {
        const prevSibling = imageNode.getPreviousSibling();
        if (prevSibling) prevSibling.selectEnd();
        else imageNode.selectPrevious();
      } else if (event.key === "ArrowRight") {
        const nextSibling = imageNode.getNextSibling();
        if (nextSibling) nextSibling.selectStart();
        else imageNode.selectNext();
      }
      return true;
    }
    return isTextAnchor;
  };

  // captions are inline content, so a new line stays inside the caption instead of splitting the paragraph
  const $onInsertParagraph = () => {
    const selection = $getSelection();
    if (!$isRangeSelection(selection)) return false;
    const imageNode = $findMatchingParent(selection.anchor.getNode(), $isImageNode);
    const focusImageNode = $findMatchingParent(selection.focus.getNode(), $isImageNode);
    if (!imageNode || !imageNode.is(focusImageNode)) return false;
    selection.insertLineBreak();
    return true;
  };

  const $handleDelete = () => {
    const selection = $getSelection();
    if (!$isRangeSelection(selection)) return false;
    const imageNode = $findMatchingParent(selection.anchor.getNode(), $isImageNode);
    if (!imageNode) return false;
    if (imageNode.getChildrenSize() === 0 || !imageNode.getShowCaption()) {
      imageNode.selectPrevious();
      imageNode.remove();
      return true;
    }
    return false;
  };

  return mergeRegister(
    editor.registerCommand(SELECTION_CHANGE_COMMAND, $onSelectionChange, COMMAND_PRIORITY_CRITICAL),
    editor.registerCommand(KEY_ARROW_LEFT_COMMAND, $onEscapeLeftRight, COMMAND_PRIORITY_LOW),
    editor.registerCommand(KEY_ARROW_RIGHT_COMMAND, $onEscapeLeftRight, COMMAND_PRIORITY_LOW),
    editor.registerCommand(DELETE_CHARACTER_COMMAND, $handleDelete, COMMAND_PRIORITY_LOW),
    editor.registerCommand(INSERT_PARAGRAPH_COMMAND, $onInsertParagraph, COMMAND_PRIORITY_LOW),
    editor.registerCommand<DragEvent>(DRAGSTART_COMMAND, onDragStart, COMMAND_PRIORITY_HIGH),
    editor.registerCommand<DragEvent>(DRAGOVER_COMMAND, onDragover, COMMAND_PRIORITY_LOW),
    editor.registerCommand<DragEvent>(DROP_COMMAND, onDrop, COMMAND_PRIORITY_HIGH)
  );
}

export const ImageExtension = defineExtension({
  name: "image",
  nodes: () => [ImageNode],
  register: (editor) => {
    return mergeRegister(
      registerImageNodeHandlers(editor),
      editor.registerCommand<InsertImagePayload>(
        INSERT_IMAGE_COMMAND,
        (payload) => {
          $insertImageNode($createImageNode(payload), payload.altText || "Image");
          return true;
        },
        COMMAND_PRIORITY_EDITOR
      )
    );
  },
});
