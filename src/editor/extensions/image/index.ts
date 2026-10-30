import "./index.css";
import {
  $addUpdateTag,
  $createParagraphNode,
  $createRangeSelection,
  $createTextNode,
  $getNearestNodeFromDOMNode,
  $getNodeByKey,
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
  HISTORIC_TAG,
  HISTORY_MERGE_TAG,
  HISTORY_PUSH_TAG,
  INSERT_PARAGRAPH_COMMAND,
  isHTMLElement,
  KEY_ARROW_LEFT_COMMAND,
  KEY_ARROW_RIGHT_COMMAND,
  Klass,
  LexicalEditor,
  MutationListener,
  SELECTION_CHANGE_COMMAND,
} from "lexical";
import { $findMatchingParent, $wrapNodeInElement, mergeRegister } from "@lexical/utils";

import { $createImageNode, $isImageNode, ImageNode } from "./nodes";
import { INSERT_IMAGE_COMMAND, type InsertImagePayload } from "./commands";
import { prefetchInlineSvg } from "./utils";
import { getSelectedNode } from "@/editor/utils/getSelectedNode";
import { getDOMRangeFromDragEvent } from "@/editor/utils/getSelectionRange";
import { getServicesFromEditor, ServicesExtension } from "@/editor/extensions/services";
import { ANNOUNCE_COMMAND } from "@/editor/commands";

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

export function registerStorageService(editor: LexicalEditor, Klass: Klass<ImageNode>) {
  const processingNodeKeys = new Set<string>();

  const uploadDataUrl = async (dataUrl: string, filename: string, mimeType: string) => {
    const { uploadImage, getImageSignedUrl } = getServicesFromEditor(editor);
    if (!uploadImage || !getImageSignedUrl) throw new Error("Uploading image failed");
    const blob = await fetch(dataUrl).then((response) => response.blob());
    const file = new File([blob], filename, { type: mimeType });
    const { data: uploadData, error: uploadError } = await uploadImage(file);
    if (uploadError) throw uploadError;
    if (!uploadData) throw new Error("Uploading image failed");
    const { data: signedUrlData, error: signedUrlError } = await getImageSignedUrl(uploadData.path);
    if (signedUrlError) throw signedUrlError;
    if (!signedUrlData) throw new Error("Getting image signed url failed");
    return {
      src: `/images/${uploadData.path}`,
      signedUrl: signedUrlData.signedUrl,
    };
  };

  const handleImageNode = async (key: string, node: ImageNode): Promise<void> => {
    const { uploadImage, getImageSignedUrl } = getServicesFromEditor(editor);
    try {
      const [src, signedUrl, altText] = editor.read(() => [
        node.getSrc(),
        node.getSignedUrl(),
        node.getAltText(),
      ]);

      if (src.startsWith("/images/")) {
        if (signedUrl || !getImageSignedUrl) return;

        const fileName = src.split("/").pop()!;
        const { data, error } = await getImageSignedUrl(fileName);
        if (error) throw error;

        if (data) {
          if (src.endsWith(".svg")) {
            await prefetchInlineSvg(src, data.signedUrl);
          }
          editor.update(
            () => {
              const n = $getNodeByKey(key);
              if ($isImageNode(n)) n.setSignedUrl(data.signedUrl);
            },
            { tag: HISTORY_MERGE_TAG }
          );
        }
      } else if (src.startsWith("data:image/")) {
        if (!uploadImage || !getImageSignedUrl) return;
        const header = src.split(",")[0];
        const mimeType = header.split(";")[0].split(":")[1];
        const extension = mimeType.split("/")[1].split("+")[0];
        const filename = `${altText}.${extension}`;

        const { src: newSrc, signedUrl: newSignedUrl } = await uploadDataUrl(src, filename, mimeType);

        editor.update(
          () => {
            const n = $getNodeByKey(key);
            if ($isImageNode(n)) {
              n.setSrc(newSrc);
              n.setSignedUrl(newSignedUrl);
            }
          },
          { tag: HISTORIC_TAG }
        );
      }
    } catch (error) {
      console.error(error);
      editor.dispatchCommand(ANNOUNCE_COMMAND, {
        type: "error",
        message: {
          title: "Loading image failed",
          subtitle: "Please try again later",
        },
      });
    } finally {
      processingNodeKeys.delete(key);
    }
  };

  const imageMutationListener: MutationListener = (mutations) => {
    const { uploadImage, getImageSignedUrl } = getServicesFromEditor(editor);
    editor.read(() => {
      for (const [key, mutation] of mutations) {
        if (mutation === "created" || mutation === "updated") {
          if (processingNodeKeys.has(key)) continue;
          const node = $getNodeByKey(key);
          if (!$isImageNode(node)) continue;
          const src = node.getSrc();
          if (src.startsWith("/images/")) {
            if (!getImageSignedUrl || node.getSignedUrl()) continue;
          } else if (src.startsWith("data:image/")) {
            if (!uploadImage || !getImageSignedUrl) continue;
          } else {
            continue;
          }
          processingNodeKeys.add(key);
          void handleImageNode(key, node);
        }
      }
    });
  };

  return editor.registerMutationListener(Klass, imageMutationListener);
}

export const ImageExtension = defineExtension({
  name: "image",
  dependencies: [ServicesExtension],
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
      ),
      registerStorageService(editor, ImageNode)
    );
  },
});
