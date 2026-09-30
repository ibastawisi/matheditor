import { $convertFromMarkdownString, registerMarkdownShortcuts } from "@lexical/markdown";
import { objectKlassEquals } from "@lexical/utils";
import {
  $createParagraphNode,
  $getSelection,
  $isRangeSelection,
  $setSelection,
  COMMAND_PRIORITY_LOW,
  defineExtension,
  mergeRegister,
  PASTE_COMMAND,
  type PasteCommandType,
} from "lexical";

import { TRANSFORMERS } from "./transformers";

export { TRANSFORMERS };

export const MarkdownExtension = defineExtension({
  name: "markdown",
  register: (editor) =>
    mergeRegister(
      registerMarkdownShortcuts(editor, TRANSFORMERS),
      editor.registerCommand(
        PASTE_COMMAND,
        (event: PasteCommandType) => {
          if (!objectKlassEquals(event, ClipboardEvent) || !event.clipboardData) return false;
          const html = event.clipboardData.getData("text/html");
          if (html) return false;
          const text = event.clipboardData.getData("text/plain");
          const selection = $getSelection();
          if (!$isRangeSelection(selection)) return false;
          const parent = $createParagraphNode();
          $setSelection(null);
          $convertFromMarkdownString(text, TRANSFORMERS, parent);
          const children = parent.getChildren();
          selection.insertNodes(children);
          return true;
        },
        COMMAND_PRIORITY_LOW
      )
    ),
});
