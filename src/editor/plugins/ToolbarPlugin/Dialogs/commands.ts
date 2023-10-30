"use client";
import { LexicalCommand, createCommand } from 'lexical';

export interface EditorDialogs {
  image: {
    open: boolean;
  };
  graph: {
    open: boolean;
  };
  sketch: {
    open: boolean;
  };
  table: {
    open: boolean;
  };
  iframe: {
    open: boolean;
  },
  link: {
    open: boolean;
  }
};

export type SetDialogsPayload = Readonly<Partial<EditorDialogs>>;

export const SET_DIALOGS_COMMAND: LexicalCommand<SetDialogsPayload> = createCommand();
