import { batch, getExtensionDependencyFromEditor, namedSignals } from "@lexical/extension";
import { $isCodeNode } from "@lexical/code-core";
import { $isLinkNode } from "@lexical/link";
import { $isListNode, ListNode } from "@lexical/list";
import { $isHeadingNode } from "@lexical/rich-text";
import { $getSelectionStyleValueForProperty, $isParentElementRTL } from "@lexical/selection";
import { $isTableNode, $isTableSelection } from "@lexical/table";
import { $getNearestNodeOfType } from "@lexical/utils";
import {
  $findMatchingParent,
  $getSelection,
  $isElementNode,
  $isNodeSelection,
  $isRangeSelection,
  CAN_REDO_COMMAND,
  CAN_UNDO_COMMAND,
  COMMAND_PRIORITY_CRITICAL,
  defineExtension,
  mergeRegister,
  SELECTION_CHANGE_COMMAND,
} from "lexical";
import type { ElementFormatType, LexicalEditor, LexicalExtensionOutput } from "lexical";

import { blockTypeToBlockName, DEFAULT_FONT_SIZE } from "./constants";
import type { BlockType, EditorDialogType, ImageType } from "./types";
import { getSelectedNode } from "@/editor/utils/getSelectedNode";
import { $isMathNode } from "@/editor/extensions/math/nodes";
import { $isImageNode } from "@/editor/extensions/image/nodes";
import { $isStickyNode } from "@/editor/extensions/sticky/nodes";
import type { ImageFilter, ImageFloat } from "@/editor/extensions/image/types";
import type { NoteFloat } from "@/editor/extensions/sticky/types";

/** Reads the font of the focused DOM node, used when the selection has no explicit style */
function getComputedFont(editor: LexicalEditor) {
  const domSelection = typeof window !== "undefined" ? window.getSelection() : null;
  const focusNode = domSelection?.focusNode;
  const rootElement = editor.getRootElement();
  if (!focusNode || !rootElement || !rootElement.contains(focusNode)) return null;
  const domElement = focusNode.nodeType === Node.TEXT_NODE ? focusNode.parentElement : (focusNode as HTMLElement);
  if (!domElement) return null;
  const computedStyle = window.getComputedStyle(domElement);
  return {
    fontSize: computedStyle.getPropertyValue("font-size"),
    fontFamily: computedStyle.getPropertyValue("font-family").split(",")[0].trim().replace(/['"]+/g, ""),
  };
}

export const StoreExtension = defineExtension({
  name: "store",
  build: () => {
    return namedSignals({
      openDialog: null as EditorDialogType,
      canUndo: false,
      canRedo: false,
      blockType: "paragraph" as BlockType,
      elementFormat: "left" as ElementFormatType,
      indentationLevel: 0,
      isRTL: false,
      isBold: false,
      isItalic: false,
      isUnderline: false,
      isStrikethrough: false,
      isSubscript: false,
      isSuperscript: false,
      isHighlight: false,
      isCode: false,
      isLink: false,
      selectedLinkNodeKey: "",
      fontColor: "",
      bgColor: "",
      fontSize: `${DEFAULT_FONT_SIZE}px`,
      fontFamily: "Roboto",
      selectedNodeKey: "",
      isMath: false,
      isImage: false,
      imageType: "image" as ImageType,
      imageFloat: "none" as ImageFloat,
      imageFilter: "none" as ImageFilter,
      imageShowCaption: false,
      isCodeBlock: false,
      codeLanguage: "",
      tableNodeKey: "",
      noteNodeKey: "",
      noteFloat: "right" as NoteFloat,
      noteColor: "",
      noteBackgroundColor: "",
      isSelectionNullOrCollapsed: true,
    });
  },
  register(editor, _config, state) {
    const store = state.getOutput();

    const $updateToolbar = () =>
      batch(() => {
        const selection = $getSelection();
        store.selectedNodeKey.value = "";
        store.selectedLinkNodeKey.value = "";
        store.isLink.value = false;
        store.isMath.value = false;
        store.isImage.value = false;
        store.isCodeBlock.value = false;
        store.tableNodeKey.value = "";
        store.noteNodeKey.value = "";

        if (selection === null) {
          store.blockType.value = "paragraph";
          store.isSelectionNullOrCollapsed.value = true;
          return;
        }

        const blockElement = $findMatchingParent(
          $isRangeSelection(selection) ? getSelectedNode(selection) : selection.getNodes()[0],
          $isElementNode
        );
        store.elementFormat.value = blockElement?.getFormatType() || "left";
        store.indentationLevel.value = blockElement?.getIndent() || 0;

        const computedFont = getComputedFont(editor);

        if ($isNodeSelection(selection)) {
          const node = selection.getNodes()[0];
          store.blockType.value = "paragraph";
          if (!node) return;
          if ($isMathNode(node)) {
            store.selectedNodeKey.value = node.getKey();
            store.isMath.value = true;
          }
          const stickyNode = $findMatchingParent(node, $isStickyNode);
          if (stickyNode) {
            store.noteNodeKey.value = stickyNode.getKey();
            store.noteFloat.value = stickyNode.getFloat();
            store.noteColor.value = stickyNode.getColor();
            store.noteBackgroundColor.value = stickyNode.getBackgroundColor();
          }
          const tableNode = $findMatchingParent(node, $isTableNode);
          if (tableNode) store.tableNodeKey.value = tableNode.getKey();
          if (computedFont) {
            store.fontSize.value = computedFont.fontSize;
            store.fontFamily.value = computedFont.fontFamily;
          }
          return;
        }

        if ($isTableSelection(selection)) {
          const tableNode = $findMatchingParent(selection.anchor.getNode(), $isTableNode);
          if (tableNode) store.tableNodeKey.value = tableNode.getKey();
          return;
        }

        if (!$isRangeSelection(selection)) return;

        const node = getSelectedNode(selection);
        store.isBold.value = selection.hasFormat("bold");
        store.isItalic.value = selection.hasFormat("italic");
        store.isUnderline.value = selection.hasFormat("underline");
        store.isStrikethrough.value = selection.hasFormat("strikethrough");
        store.isSubscript.value = selection.hasFormat("subscript");
        store.isSuperscript.value = selection.hasFormat("superscript");
        store.isHighlight.value = selection.hasFormat("highlight");
        store.isCode.value = selection.hasFormat("code");
        store.fontColor.value = $getSelectionStyleValueForProperty(selection, "color");
        store.bgColor.value = $getSelectionStyleValueForProperty(selection, "background-color");
        store.fontSize.value =
          $getSelectionStyleValueForProperty(selection, "font-size") || computedFont?.fontSize || `${DEFAULT_FONT_SIZE}px`;
        store.fontFamily.value =
          $getSelectionStyleValueForProperty(selection, "font-family") || computedFont?.fontFamily || "Roboto";
        store.isSelectionNullOrCollapsed.value = selection.isCollapsed();
        store.isRTL.value = $isParentElementRTL(selection);

        const linkNode = $findMatchingParent(node, $isLinkNode);
        store.selectedLinkNodeKey.value = linkNode ? linkNode.getKey() : "";
        store.isLink.value = !!linkNode;

        const anchorNode = selection.anchor.getNode();
        const element = anchorNode.getKey() === "root" ? anchorNode : anchorNode.getTopLevelElementOrThrow();

        if ($isListNode(element)) {
          const parentList = $getNearestNodeOfType<ListNode>(anchorNode, ListNode);
          store.blockType.value = parentList ? parentList.getListType() : element.getListType();
        } else {
          const type = $isHeadingNode(element) ? element.getTag() : element.getType();
          if (type in blockTypeToBlockName) {
            store.blockType.value = type as BlockType;
          }
          if ($isCodeNode(element)) {
            store.selectedNodeKey.value = element.getKey();
            store.isCodeBlock.value = true;
            store.codeLanguage.value = element.getLanguage() ?? "";
          }
        }

        const stickyNode = $findMatchingParent(node, $isStickyNode);
        if (stickyNode) {
          store.noteNodeKey.value = stickyNode.getKey();
          store.noteFloat.value = stickyNode.getFloat();
          store.noteColor.value = stickyNode.getColor();
          store.noteBackgroundColor.value = stickyNode.getBackgroundColor();
        }

        const tableNode = $findMatchingParent(node, $isTableNode);
        if (tableNode) store.tableNodeKey.value = tableNode.getKey();

        const imageNode = $findMatchingParent(node, $isImageNode);
        if (imageNode) {
          store.selectedNodeKey.value = imageNode.getKey();
          store.isImage.value = true;
          store.imageType.value = imageNode.getType() as ImageType;
          store.imageFloat.value = imageNode.getFloat();
          store.imageFilter.value = imageNode.getFilter();
          store.imageShowCaption.value = imageNode.getShowCaption();
        }
      });

    return mergeRegister(
      editor.registerUpdateListener(({ editorState }) => {
        editorState.read($updateToolbar, { editor });
      }),
      editor.registerCommand(
        SELECTION_CHANGE_COMMAND,
        () => {
          $updateToolbar();
          return false;
        },
        COMMAND_PRIORITY_CRITICAL
      ),
      editor.registerCommand<boolean>(
        CAN_UNDO_COMMAND,
        (payload) => {
          store.canUndo.value = payload;
          return false;
        },
        COMMAND_PRIORITY_CRITICAL
      ),
      editor.registerCommand<boolean>(
        CAN_REDO_COMMAND,
        (payload) => {
          store.canRedo.value = payload;
          return false;
        },
        COMMAND_PRIORITY_CRITICAL
      )
    );
  },
});

export type StoreExtensionOutput = LexicalExtensionOutput<typeof StoreExtension>;

type StoreValue<K extends keyof StoreExtensionOutput> = StoreExtensionOutput[K]["value"];

export const getStoreOutputFromEditor = <K extends keyof StoreExtensionOutput>(
  editor: LexicalEditor,
  key: K
): StoreValue<K> => {
  return getExtensionDependencyFromEditor(editor, StoreExtension).output[key].value;
};

export const setStoreOutputFromEditor = <K extends keyof StoreExtensionOutput>(
  editor: LexicalEditor,
  key: K,
  value: StoreValue<K>
) => {
  const signal = getExtensionDependencyFromEditor(editor, StoreExtension).output[key] as { value: StoreValue<K> };
  signal.value = value;
};

/** Opens (or closes, with `null`) one of the editor dialogs */
export const setOpenDialog = (editor: LexicalEditor, dialog: EditorDialogType) => {
  setStoreOutputFromEditor(editor, "openDialog", dialog);
};
