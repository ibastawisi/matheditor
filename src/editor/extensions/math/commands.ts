import { createCommand, LexicalCommand } from "lexical";

export type InsertMathCommandPayload = {
  value: string;
};

export const INSERT_MATH_COMMAND: LexicalCommand<InsertMathCommandPayload> = createCommand();
