"use client"
import { createElement } from "react";
import { ReactExtension } from "@lexical/react/ReactExtension";
import { ReactProviderExtension } from "@lexical/react/ReactProviderExtension";
import { LexicalExtensionEditorComposer } from "@lexical/react/LexicalExtensionEditorComposer";
import { useExtensionSignalValue } from "@lexical/react/useExtensionSignalValue";
import { configExtension, defineExtension } from "lexical";
import { convertLatexToMarkup, type MathfieldElement } from "mathlive";

import { buildPageSlotEditor, PagesExtension, PageSlotEditorExtension } from ".";
import { StoreExtension } from "@/editor/extensions/store";
import { useStore } from "@/editor/extensions/store/hooks";
import { MathExtension } from "@/editor/extensions/math";
import { FloatingToolbarExtension } from "@/editor/extensions/floating-toolbar";
import { ComponentPickerExtension } from "@/editor/extensions/component-picker";
import LinkDialog from "@/editor/extensions/link/dialog";
import OCRDialog from "@/editor/extensions/ocr/dialog";

/** The dialogs a header or footer can open, which the document toolbar renders for the document */
function PageSlotDialogs() {
  const [openDialog] = useStore("openDialog");
  const [selectedLinkNodeKey] = useStore("selectedLinkNodeKey");
  return (
    <>
      {openDialog === "link" && <LinkDialog nodeKey={selectedLinkNodeKey} />}
      {openDialog === "ocr" && <OCRDialog />}
    </>
  );
}

/**
 * A header or footer editor with math, the floating toolbar and the component
 * picker, which offers the page number and page count
 */
const ReactPageSlotEditorExtension = defineExtension({
  name: "page-slot-editor-react",
  dependencies: [
    PageSlotEditorExtension,
    MathExtension,
    StoreExtension,
    FloatingToolbarExtension,
    ComponentPickerExtension,
    ReactProviderExtension,
    configExtension(ReactExtension, {
      contentEditable: null,
      decorators: [createElement(PageSlotDialogs)],
    }),
  ],
});

/**
 * Replaces the math fields of a header or footer copy with static markup,
 * since a copied math field loses the shadow root that renders it
 */
function renderSlotClone(clone: HTMLElement, source: HTMLElement) {
  const sources = source.querySelectorAll<MathfieldElement>("math-field");
  clone.querySelectorAll("math-field").forEach((mathfield, i) => {
    const math = document.createElement("span");
    math.innerHTML = convertLatexToMarkup(sources[i]?.value ?? "", { registers: { arraystretch: 1.5 } });
    mathfield.replaceWith(math);
  });
}

/**
 * Renders a composer for every header and footer editor. The editors are
 * built outside React and set their own root element, so the composer only
 * mounts their decorators and plugins. Rendered as a decorator of the document
 * editor, it sits inside the application's providers.
 */
function PageSlotEditorsHost() {
  const slotEditors = useExtensionSignalValue(PagesExtension, "slotEditors");
  return (
    <>
      {slotEditors.map((editor) => (
        <LexicalExtensionEditorComposer key={editor.getKey()} initialEditor={editor} />
      ))}
    </>
  );
}

export const PageSlotEditorsExtension = defineExtension({
  name: "page-slot-editors",
  dependencies: [
    configExtension(ReactExtension, {
      decorators: [createElement(PageSlotEditorsHost)],
    }),
    configExtension(PagesExtension, {
      buildSlotEditor: (parent) => buildPageSlotEditor(parent, ReactPageSlotEditorExtension),
      renderSlotClone,
    }),
  ],
});
