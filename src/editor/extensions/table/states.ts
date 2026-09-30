import type { TableCellNode, TableNode } from "@lexical/table";
import { $getState, $setState, createState, StateValueOrUpdater } from "lexical";

export const floatState = createState("float", {
  parse: (v): "left" | "right" | "none" => (v === "left" || v === "right" ? v : "none"),
});
export const colorState = createState("color", {
  parse: (v) => (typeof v === "string" ? v : ""),
});
export const writingModeState = createState("writingMode", {
  parse: (v): "" | "vertical-rl" | "vertical-lr" =>
    v === "vertical-rl" || v === "vertical-lr" ? v : "",
});

export const $getTableFloat = (node: TableNode) => {
  return $getState(node, floatState);
};

export const $setTableFloat = (node: TableNode, value: StateValueOrUpdater<typeof floatState>) => {
  return $setState(node, floatState, value);
};

export const $getTableCellColor = (node: TableCellNode) => {
  return $getState(node, colorState);
};

export const $setTableCellColor = (node: TableCellNode, value: StateValueOrUpdater<typeof colorState>) => {
  return $setState(node, colorState, value);
};

export const $getTableCellWritingMode = (node: TableCellNode) => {
  return $getState(node, writingModeState);
};

export const $setTableCellWritingMode = (
  node: TableCellNode,
  value: StateValueOrUpdater<typeof writingModeState>
) => {
  return $setState(node, writingModeState, value);
};
