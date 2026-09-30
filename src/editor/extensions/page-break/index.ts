import "./index.css";
import { $insertNodeToNearestRoot } from "@lexical/utils";
import { $getSelection, $isRangeSelection, COMMAND_PRIORITY_EDITOR, defineExtension } from "lexical";

import { $createPageBreakNode, PageBreakNode } from "./nodes";
import { INSERT_PAGE_BREAK_COMMAND } from "./commands";

export const PageBreakExtension = defineExtension({
  name: "page-break",
  nodes: () => [PageBreakNode],
  register: (editor) =>
    editor.registerCommand(
      INSERT_PAGE_BREAK_COMMAND,
      () => {
        const selection = $getSelection();
        if (!$isRangeSelection(selection)) return false;
        const focusNode = selection.focus.getNode();
        if (focusNode !== null) {
          $insertNodeToNearestRoot($createPageBreakNode());
        }
        return true;
      },
      COMMAND_PRIORITY_EDITOR
    ),
});
