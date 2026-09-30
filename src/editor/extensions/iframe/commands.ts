import { createCommand, type LexicalCommand } from "lexical";

import type { IFramePayload } from "./nodes";

export type InsertIFramePayload = Readonly<IFramePayload>;

export const INSERT_IFRAME_COMMAND: LexicalCommand<InsertIFramePayload> = createCommand();
