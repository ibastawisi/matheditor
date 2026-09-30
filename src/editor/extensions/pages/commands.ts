import { createCommand, LexicalCommand } from "lexical";
import type { PageSlotKind, PageSlotVariant } from "./types";

export const INSERT_PAGE_NUMBER_COMMAND: LexicalCommand<undefined> = createCommand("INSERT_PAGE_NUMBER_COMMAND");

export const INSERT_PAGE_COUNT_COMMAND: LexicalCommand<undefined> = createCommand("INSERT_PAGE_COUNT_COMMAND");

/**
 * Opens a header or footer for editing: either the one on `pageIndex`, or the
 * first page that shows `variant`. Defaults to the first page.
 */
export const EDIT_PAGE_SLOT_COMMAND: LexicalCommand<{
  kind: PageSlotKind;
  pageIndex?: number;
  variant?: PageSlotVariant;
}> = createCommand("EDIT_PAGE_SLOT_COMMAND");

/** Commits and closes the header or footer editor if one is open */
export const CLOSE_PAGE_SLOT_COMMAND: LexicalCommand<undefined> = createCommand("CLOSE_PAGE_SLOT_COMMAND");
