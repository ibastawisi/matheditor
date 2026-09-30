import { defineExtension } from "lexical";
import { MatheditorTableCellNode, MatheditorTableNode } from "./nodes";

/**
 * Reads documents saved by older versions of the editor.
 * Nested editors (image captions, sticky notes) and css style strings are
 * migrated by the nodes themselves in `updateFromJSON`.
 */
export const LegacyExtension = defineExtension({
  name: "legacy",
  nodes: () => [MatheditorTableNode, MatheditorTableCellNode],
});
