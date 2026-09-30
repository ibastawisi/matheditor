import { createCommand, type LexicalCommand } from "lexical";

import type { GraphPayload } from "./nodes";

export type InsertGraphPayload = Readonly<GraphPayload>;

export const INSERT_GRAPH_COMMAND: LexicalCommand<InsertGraphPayload> = createCommand();
