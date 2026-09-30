import "./index.css";
import {
  $addUpdateTag,
  $createParagraphNode,
  $createRangeSelection,
  $getNearestNodeFromDOMNode,
  $getNodeByKey,
  $getSelection,
  $insertNodes,
  $isRangeSelection,
  $isRootOrShadowRoot,
  $setSelection,
  COMMAND_PRIORITY_EDITOR,
  COMMAND_PRIORITY_HIGH,
  COMMAND_PRIORITY_LOW,
  defineExtension,
  DELETE_CHARACTER_COMMAND,
  DRAGOVER_COMMAND,
  DRAGSTART_COMMAND,
  DROP_COMMAND,
  ElementNode,
  HISTORY_MERGE_TAG,
  HISTORY_PUSH_TAG,
  isHTMLElement,
  KEY_ARROW_DOWN_COMMAND,
  KEY_ARROW_LEFT_COMMAND,
  KEY_ARROW_RIGHT_COMMAND,
  KEY_ARROW_UP_COMMAND,
  LexicalEditor,
} from "lexical";
import { $findMatchingParent, mergeRegister } from "@lexical/utils";

import { INSERT_STICKY_COMMAND } from "./commands";
import { $createStickyNode, $isStickyNode, StickyNode } from "./nodes";
import { getSelectedNode } from "@/editor/utils/getSelectedNode";
import { getDOMRangeFromDragEvent } from "@/editor/utils/getSelectionRange";

function getNodeInSelection(): StickyNode | null {
  const selection = $getSelection();
  if ($isRangeSelection(selection)) {
    const node = getSelectedNode(selection);
    return $findMatchingParent(node, $isStickyNode);
  }
  return null;
}

function getNodeFromTarget(target: EventTarget | null): StickyNode | null {
  if (!isHTMLElement(target)) return null;
  const node = $getNearestNodeFromDOMNode(target);
  if (!node) return null;
  return $findMatchingParent(node, $isStickyNode);
}

function canDropSticky(event: DragEvent): boolean {
  const target = event.target;
  return !!(
    target &&
    target instanceof HTMLElement &&
    !target.closest("code, figure, div.sticky-note") &&
    target.parentElement &&
    target.parentElement.closest("div.editor-input")
  );
}

function onDragStart(event: DragEvent): boolean {
  const target = event.target;
  if (!isHTMLElement(target) || !target.classList.contains("drag-btn")) return false;
  const note = target.closest<HTMLElement>(".sticky-note");
  if (!note) return false;
  const node = getNodeFromTarget(note);
  if (!node) return false;
  const dataTransfer = event.dataTransfer;
  if (!dataTransfer) return false;
  dataTransfer.setData("text/plain", "_");
  dataTransfer.setDragImage(note, 0, 0);
  node.selectEnd();
  return true;
}

function onDragover(event: DragEvent): boolean {
  const node = getNodeInSelection();
  if (!node) return false;
  if (!canDropSticky(event)) {
    event.preventDefault();
  }
  return true;
}

function onDrop(event: DragEvent): boolean {
  const node = getNodeInSelection();
  if (!node) return false;
  event.preventDefault();
  if (canDropSticky(event)) {
    const rangeSelection = $createRangeSelection();
    const range = getDOMRangeFromDragEvent(event);
    rangeSelection.applyDOMRange(range);
    $setSelection(rangeSelection);
    const anchorNode = rangeSelection.anchor.getNode();
    const topLevelElement = anchorNode.getTopLevelElementOrThrow();
    topLevelElement.insertBefore(node);
    $addUpdateTag(HISTORY_PUSH_TAG);
  }
  node.selectEnd();
  return true;
}

const $onEscapeUp = () => {
  const selection = $getSelection();
  if ($isRangeSelection(selection) && selection.isCollapsed() && selection.anchor.offset === 0) {
    const stickyNode = $findMatchingParent(selection.anchor.getNode(), $isStickyNode);
    if ($isStickyNode(stickyNode)) {
      const parent = stickyNode.getParent<ElementNode>();
      if (
        parent !== null &&
        parent.getFirstChild() === stickyNode &&
        selection.anchor.key === stickyNode.getFirstDescendant()?.getKey()
      ) {
        stickyNode.insertBefore($createParagraphNode());
      }
    }
  }
  return false;
};

const $onEscapeDown = () => {
  const selection = $getSelection();
  if ($isRangeSelection(selection) && selection.isCollapsed()) {
    const stickyNode = $findMatchingParent(selection.anchor.getNode(), $isStickyNode);
    if ($isStickyNode(stickyNode)) {
      const parent = stickyNode.getParent<ElementNode>();
      if (parent !== null && parent.getLastChild() === stickyNode) {
        const firstChild = stickyNode.getFirstDescendant();
        const lastChild = stickyNode.getLastDescendant();
        if (
          (lastChild !== null &&
            selection.anchor.key === lastChild.getKey() &&
            selection.anchor.offset === lastChild.getTextContentSize()) ||
          (firstChild !== null &&
            selection.anchor.key === firstChild.getKey() &&
            selection.anchor.offset === firstChild.getTextContentSize())
        ) {
          stickyNode.insertAfter($createParagraphNode());
        }
      }
    }
  }
  return false;
};

const $handleDelete = (isBackward: boolean) => {
  const selection = $getSelection();
  if (!$isRangeSelection(selection) || !selection.isCollapsed()) {
    return false;
  }
  const node = selection.anchor.getNode();
  const stickyNode = $findMatchingParent(node, $isStickyNode);
  if (!$isStickyNode(stickyNode)) {
    return false;
  }
  const children = stickyNode.getChildren();
  const isEmpty = children.length === 1 && children[0].getTextContentSize() === 0;
  if (
    (isBackward && selection.anchor.offset === 0) ||
    (!isBackward && selection.anchor.offset === node.getTextContentSize())
  ) {
    if (isEmpty) {
      const newParagraph = $createParagraphNode();
      stickyNode.insertBefore(newParagraph);
      stickyNode.remove();
      newParagraph.selectEnd();
      return true;
    }
    const isAtBoundary = isBackward
      ? selection.anchor.key === stickyNode.getFirstDescendant()?.getKey()
      : selection.anchor.key === stickyNode.getLastDescendant()?.getKey();
    if (isAtBoundary) {
      return true;
    }
  }
  return false;
};

/**
 * Sticky notes used to be inline decorators, so documents created before
 * they became block elements have them nested inside paragraphs.
 * This lifts them before their top level block.
 */
export function $liftStickyNode(node: StickyNode) {
  const parent = node.getParent();
  if (!parent || $isRootOrShadowRoot(parent)) return;
  let block: ElementNode = parent;
  while (block.getParent() && !$isRootOrShadowRoot(block.getParentOrThrow())) {
    block = block.getParentOrThrow();
  }
  block.insertBefore(node);
  if (parent.isAttached() && parent.getChildrenSize() === 0 && parent.getTextContentSize() === 0) {
    parent.remove();
  }
}

function registerLegacyStickyLift(editor: LexicalEditor) {
  return editor.registerMutationListener(StickyNode, (mutations) => {
    const keys = [...mutations].filter(([, mutation]) => mutation === "created").map(([key]) => key);
    if (keys.length === 0) return;
    const needsLift = editor.read(() =>
      keys.some((key) => {
        const node = $getNodeByKey(key);
        const parent = node?.getParent();
        return parent ? !$isRootOrShadowRoot(parent) : false;
      })
    );
    if (!needsLift) return;
    editor.update(
      () => {
        for (const key of keys) {
          const node = $getNodeByKey(key);
          if ($isStickyNode(node)) $liftStickyNode(node);
        }
      },
      { tag: HISTORY_MERGE_TAG }
    );
  });
}

export const StickyExtension = defineExtension({
  name: "sticky",
  nodes: () => [StickyNode],
  register: (editor) => {
    return mergeRegister(
      registerLegacyStickyLift(editor),
      editor.registerCommand(KEY_ARROW_DOWN_COMMAND, $onEscapeDown, COMMAND_PRIORITY_LOW),
      editor.registerCommand(KEY_ARROW_RIGHT_COMMAND, $onEscapeDown, COMMAND_PRIORITY_LOW),
      editor.registerCommand(KEY_ARROW_UP_COMMAND, $onEscapeUp, COMMAND_PRIORITY_LOW),
      editor.registerCommand(KEY_ARROW_LEFT_COMMAND, $onEscapeUp, COMMAND_PRIORITY_LOW),
      editor.registerCommand(DELETE_CHARACTER_COMMAND, $handleDelete, COMMAND_PRIORITY_LOW),
      editor.registerCommand(
        INSERT_STICKY_COMMAND,
        () => {
          const stickyNode = $createStickyNode();
          const paragraph = $createParagraphNode();
          stickyNode.append(paragraph);
          const selection = $getSelection();
          if ($isRangeSelection(selection)) {
            const anchorNode = selection.anchor.getNode();
            const topLevelElement = anchorNode.getTopLevelElementOrThrow();
            topLevelElement.insertBefore(stickyNode);
          } else {
            $insertNodes([stickyNode]);
          }
          paragraph.selectEnd();
          return true;
        },
        COMMAND_PRIORITY_EDITOR
      ),
      editor.registerCommand<DragEvent>(DRAGSTART_COMMAND, onDragStart, COMMAND_PRIORITY_HIGH),
      editor.registerCommand<DragEvent>(DRAGOVER_COMMAND, onDragover, COMMAND_PRIORITY_LOW),
      editor.registerCommand<DragEvent>(DROP_COMMAND, onDrop, COMMAND_PRIORITY_HIGH)
    );
  },
});
