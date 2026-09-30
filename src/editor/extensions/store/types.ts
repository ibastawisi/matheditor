import { blockTypeToBlockName, DIALOG_TYPES } from "./constants";

export type EditorDialogType = keyof typeof DIALOG_TYPES | null;
export type BlockType = keyof typeof blockTypeToBlockName;
export type ImageType = "image" | "graph" | "sketch" | "iframe";
