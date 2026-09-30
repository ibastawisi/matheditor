import { COMMAND_PRIORITY_EDITOR, defineExtension } from "lexical";

import { $insertImageNode, ImageExtension } from "@/editor/extensions/image";
import { INSERT_IFRAME_COMMAND, type InsertIFramePayload } from "./commands";
import { $createIFrameNode, IFrameNode } from "./nodes";

export const IFrameExtension = defineExtension({
  name: "iframe",
  dependencies: [ImageExtension],
  nodes: () => [IFrameNode],
  register: (editor) => {
    return editor.registerCommand<InsertIFramePayload>(
      INSERT_IFRAME_COMMAND,
      (payload) => {
        $insertImageNode($createIFrameNode(payload), payload.altText || "iframe");
        return true;
      },
      COMMAND_PRIORITY_EDITOR
    );
  },
});
