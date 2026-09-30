import { createState } from "lexical";

export const colorState = createState("color", {
  parse: (v) => (typeof v === "string" ? v : ""),
});
export const backgroundColorState = createState("backgroundColor", {
  parse: (v) => (typeof v === "string" && v.trim() !== "" ? v : "#bceac4"),
});
export const floatState = createState("float", {
  parse: (v): "left" | "right" => (v === "left" ? "left" : "right"),
});
