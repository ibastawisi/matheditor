import { defineExtension } from "lexical";

/** Highlights non-text elements (math, images) that are covered by the native selection */
export const SelectionHighlightExtension = defineExtension({
  name: "selection-highlight",
  register: (editor) => {
    return editor.registerRootListener((rootElement) => {
      if (!rootElement) return;
      const handleSelectionChange = () => {
        const domSelection = document.getSelection();
        if (!domSelection) return;
        const elements = rootElement.querySelectorAll("math-field, figure");
        elements.forEach((element) => {
          const isSelected = domSelection.containsNode(element);
          element.classList.toggle("selection-highlight", isSelected);
        });
      };
      document.addEventListener("selectionchange", handleSelectionChange);
      return () => {
        document.removeEventListener("selectionchange", handleSelectionChange);
      };
    });
  },
});
