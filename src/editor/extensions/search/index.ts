import "./index.css";
import { defineExtension, mergeRegister } from "lexical";
import { createSearch } from "./core";
import { createEditorSearchSource } from "./utils";

/** How long the document must be still before the matches are found again */
const RECOMPUTE_DELAY_MS = 300;

/** Finds text in the document and highlights the matches */
export const SearchExtension = defineExtension({
  name: "search",
  build: (editor) => createSearch(createEditorSearchSource(editor)),
  register(editor, _config, state) {
    const { query, recompute, registerHighlights } = state.getOutput();
    let timeout: ReturnType<typeof setTimeout> | undefined;
    return mergeRegister(
      // the matches move with the text, so they are found again once typing stops
      editor.registerUpdateListener(({ dirtyElements, dirtyLeaves }) => {
        if (!query.peek()) return;
        if (dirtyElements.size === 0 && dirtyLeaves.size === 0) return;
        clearTimeout(timeout);
        timeout = setTimeout(recompute, RECOMPUTE_DELAY_MS);
      }),
      () => clearTimeout(timeout),
      registerHighlights(),
    );
  },
});
