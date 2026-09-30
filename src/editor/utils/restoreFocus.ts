import { LexicalEditor, $getSelection, $getPreviousSelection, $setSelection } from "lexical";

/** Restores the last editor selection and focus, e.g. after a menu or a dialog is closed */
export const restoreFocus = (editor: LexicalEditor) => {
  editor.update(
    () => {
      const selection = $getSelection() || $getPreviousSelection();
      if (!selection) return;
      $setSelection(selection.clone());
    },
    {
      discrete: true,
      onUpdate() {
        editor.focus(undefined, { defaultSelection: "rootStart" });
      },
    }
  );
};
