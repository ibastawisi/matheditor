import { IS_APPLE } from "@lexical/utils";
import {
  COMMAND_PRIORITY_NORMAL,
  defineExtension,
  FORMAT_TEXT_COMMAND,
  isModifierMatch,
  KEY_DOWN_COMMAND,
} from "lexical";
import { setOpenDialog, StoreExtension } from "@/editor/extensions/store";

const CONTROL_OR_META = { ctrlKey: !IS_APPLE, metaKey: IS_APPLE };

export const ShortcutsExtension = defineExtension({
  name: "shortcuts",
  dependencies: [StoreExtension],
  register: (editor) => {
    return editor.registerCommand(
      KEY_DOWN_COMMAND,
      (event: KeyboardEvent) => {
        const { code } = event;
        if (code === "KeyK" && isModifierMatch(event, CONTROL_OR_META)) {
          event.preventDefault();
          setOpenDialog(editor, "link");
          return true;
        }
        if (code === "KeyH" && isModifierMatch(event, { ...CONTROL_OR_META, shiftKey: true })) {
          event.preventDefault();
          return editor.dispatchCommand(FORMAT_TEXT_COMMAND, "highlight");
        }
        if (code === "KeyE" && isModifierMatch(event, CONTROL_OR_META)) {
          event.preventDefault();
          return editor.dispatchCommand(FORMAT_TEXT_COMMAND, "code");
        }
        if (code === "KeyS" && isModifierMatch(event, { ...CONTROL_OR_META, shiftKey: true })) {
          event.preventDefault();
          return editor.dispatchCommand(FORMAT_TEXT_COMMAND, "strikethrough");
        }
        return false;
      },
      COMMAND_PRIORITY_NORMAL
    );
  },
});
