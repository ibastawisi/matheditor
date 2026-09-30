import { createCommand, LexicalCommand } from "lexical";

import type { ImagePayload } from "./types";

export type InsertImagePayload = Readonly<ImagePayload>;

export const INSERT_IMAGE_COMMAND: LexicalCommand<InsertImagePayload> = createCommand();
