import { COMMAND_PRIORITY_EDITOR, defineExtension } from "lexical";

import { $insertImageNode, ImageExtension } from "@/editor/extensions/image";
import { INSERT_GRAPH_COMMAND, type InsertGraphPayload } from "./commands";
import { $createGraphNode, GraphNode } from "./nodes";

export const GraphExtension = defineExtension({
  name: "graph",
  dependencies: [ImageExtension],
  nodes: () => [GraphNode],
  register: (editor) => {
    return editor.registerCommand<InsertGraphPayload>(
      INSERT_GRAPH_COMMAND,
      (payload) => {
        $insertImageNode($createGraphNode(payload), payload.altText || "Graph");
        return true;
      },
      COMMAND_PRIORITY_EDITOR
    );
  },
});
