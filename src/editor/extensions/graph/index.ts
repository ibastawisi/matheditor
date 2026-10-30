import { COMMAND_PRIORITY_EDITOR, defineExtension } from "lexical";
import { mergeRegister } from "@lexical/utils";

import { $insertImageNode, ImageExtension, registerStorageService } from "@/editor/extensions/image";
import { ServicesExtension } from "@/editor/extensions/services";
import { INSERT_GRAPH_COMMAND, type InsertGraphPayload } from "./commands";
import { $createGraphNode, GraphNode } from "./nodes";

export const GraphExtension = defineExtension({
  name: "graph",
  dependencies: [ImageExtension, ServicesExtension],
  nodes: () => [GraphNode],
  register: (editor) => {
    return mergeRegister(
      editor.registerCommand<InsertGraphPayload>(
        INSERT_GRAPH_COMMAND,
        (payload) => {
          $insertImageNode($createGraphNode(payload), payload.altText || "Graph");
          return true;
        },
        COMMAND_PRIORITY_EDITOR
      ),
      registerStorageService(editor, GraphNode)
    );
  },
});
