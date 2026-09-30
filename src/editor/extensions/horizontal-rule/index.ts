import { $insertNodeToNearestRoot } from "@lexical/utils";
import { $getSelection, $isRangeSelection, COMMAND_PRIORITY_EDITOR, defineExtension } from "lexical";
import { INSERT_HORIZONTAL_RULE_COMMAND } from "./commands";
import { $createHorizontalRuleNode, HorizontalRuleNode } from "./nodes";

export const HorizontalRuleExtension = defineExtension({
  name: "horizontal-rule",
  nodes: () => [HorizontalRuleNode],
  register: (editor) => {
    return editor.registerCommand(
      INSERT_HORIZONTAL_RULE_COMMAND,
      () => {
        const selection = $getSelection();
        if (!$isRangeSelection(selection)) {
          return false;
        }
        const focusNode = selection.focus.getNode();
        if (focusNode !== null) {
          $insertNodeToNearestRoot($createHorizontalRuleNode());
        }
        return true;
      },
      COMMAND_PRIORITY_EDITOR
    );
  },
});
