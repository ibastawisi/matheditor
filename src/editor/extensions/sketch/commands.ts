import { createCommand, type LexicalCommand } from "lexical";

import type { SketchPayload } from "./nodes";

export type InsertSketchPayload = Readonly<SketchPayload>;

export const INSERT_SKETCH_COMMAND: LexicalCommand<InsertSketchPayload> = createCommand();
