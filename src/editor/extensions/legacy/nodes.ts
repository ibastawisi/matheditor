import {
  $createTableCellNode,
  $createTableNode,
  SerializedTableCellNode,
  SerializedTableNode,
  TableCellNode,
  TableNode,
} from "@lexical/table";
import { $setId, idState } from "@/editor/extensions/shared/states";
import {
  $setTableCellColor,
  $setTableCellWritingMode,
  $setTableFloat,
  colorState,
  floatState,
  writingModeState,
} from "@/editor/extensions/table/states";
import { getLegacyStyle } from "./utils";

/**
 * Tables used to be custom node replacements storing their options as a css string.
 * These classes are only registered to read those documents, they import as stock table nodes.
 */
export class MatheditorTableNode extends TableNode {
  $config() {
    return this.config("matheditor-table", { extends: TableNode });
  }

  static importJSON(serializedNode: SerializedTableNode & { style?: string; id?: string }): TableNode {
    const node = $createTableNode().updateFromJSON(serializedNode);
    const style = getLegacyStyle(serializedNode);
    if (style) $setTableFloat(node, floatState.parse(style.float));
    $setId(node, idState.parse(serializedNode.id));
    return node;
  }
}

export class MatheditorTableCellNode extends TableCellNode {
  $config() {
    return this.config("matheditor-tablecell", { extends: TableCellNode });
  }

  static importJSON(serializedNode: SerializedTableCellNode & { style?: string }): TableCellNode {
    const node = $createTableCellNode().updateFromJSON(serializedNode);
    const style = getLegacyStyle(serializedNode);
    if (style) {
      $setTableCellColor(node, colorState.parse(style.color));
      $setTableCellWritingMode(node, writingModeState.parse(style["writing-mode"]));
      const backgroundColor = style["background-color"];
      if (backgroundColor) node.setBackgroundColor(backgroundColor);
    }
    return node;
  }
}
