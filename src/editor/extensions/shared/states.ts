import { $getState, $setState, createState, LexicalNode, StateValueOrUpdater } from "lexical";

export const idState = createState("id", {
  parse: (v) => (typeof v === "string" ? v : ""),
});

export const $getId = (node: LexicalNode) => {
  return $getState(node, idState);
};

export const $setId = (node: LexicalNode, value: StateValueOrUpdater<typeof idState>) => {
  return $setState(node, idState, value);
};

export const floatState = createState("float", {
  parse: (v): "left" | "right" | "none" => (v === "left" || v === "right" ? v : "none"),
});
