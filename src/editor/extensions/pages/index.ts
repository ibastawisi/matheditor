import "./index.css";
import {
  buildEditorFromExtensions,
  computed,
  effect,
  type LexicalEditorWithDispose,
  namedSignals,
  NestedEditorExtension,
  RootElementExtension,
  signal,
  watchedSignal,
} from "@lexical/extension";
import { RichTextExtension } from "@lexical/rich-text";
import {
  type AnyLexicalExtension,
  configExtension,
  defineExtension,
  type LexicalEditor,
  mergeRegister,
  RootNode,
  safeCast,
} from "lexical";

import { PageBreakExtension } from "@/editor/extensions/page-break";
import { LinkExtension } from "@/editor/extensions/link";
import { PAGE_GAP } from "./constants";
import { PagesLayout } from "./layout";
import { PageCountersExtension } from "./nodes";
import { registerPrintHandlers } from "./print";
import { PageSlots, type SlotCloneRenderer, type SlotEditorBuilder } from "./slots";
import { $getPageSetup } from "./states";
import type { ActivePageSlot } from "./types";

/**
 * The default header/footer editor: rich text, links and page counters. It
 * has no history of its own: header content lives in the document, so its
 * edits are the document's undo steps.
 */
export const PageSlotEditorExtension = defineExtension({
  name: "page-slot-editor",
  dependencies: [RichTextExtension, LinkExtension, PageCountersExtension],
});

/**
 * Builds a nested editor for one header/footer variant from `extension`. It
 * shares the document's theme, and its unhandled commands reach the document.
 */
export function buildPageSlotEditor(
  parent: LexicalEditor,
  extension: AnyLexicalExtension = PageSlotEditorExtension
): LexicalEditorWithDispose {
  return buildEditorFromExtensions(
    defineExtension({
      name: "page-slot-editor-instance",
      dependencies: [
        configExtension(NestedEditorExtension, {
          $getParentEditor: () => parent,
          inheritEditableFromParent: false,
        }),
        extension,
      ],
    })
  );
}

export interface PagesConfig {
  /** Builds the nested editor behind each header/footer variant */
  buildSlotEditor: SlotEditorBuilder;
  /** Fills in what the static copies of a header or footer lose in cloning */
  renderSlotClone?: SlotCloneRenderer;
  /** Hides the page layer without touching the document or the page setup */
  disabled: boolean;
  /** Visual gap between pages, in CSS px */
  gap: number;
}

/**
 * Paged view of the document.
 *
 * The document stays flat (`root > blocks`); the page setup lives in a
 * NodeState on the root and the pages are drawn as non-editable DOM next to
 * the editor root. Nothing here changes the document to lay out pages, so
 * typing in paged mode costs the same as pageless, and the undo history and
 * the stored document never see pages. Header and footer content is stored
 * on the root as well and edited in nested editors.
 */
export const PagesExtension = defineExtension({
  name: "pages",
  config: safeCast<PagesConfig>({
    buildSlotEditor: (parent) => buildPageSlotEditor(parent),
    disabled: false,
    gap: PAGE_GAP,
  }),
  dependencies: [PageBreakExtension, RootElementExtension],
  build: (editor, config) => {
    const getPageSetup = () => editor.read("latest", $getPageSetup);
    return {
      ...namedSignals({ disabled: config.disabled }),
      /** The header/footer slot open for editing, if any */
      activeSlot: signal<ActivePageSlot | null>(null),
      /** The nested editor of the open header/footer slot, if any */
      activeSlotEditor: signal<LexicalEditor | null>(null),
      /** Number of pages currently rendered (1 while pageless) */
      pageCount: signal(1),
      pageSetup: watchedSignal(getPageSetup, (pageSetupSignal) =>
        editor.registerMutationListener(RootNode, () => {
          pageSetupSignal.value = getPageSetup();
        })
      ),
      /** The nested header/footer editors created so far, for a React host to render */
      slotEditors: signal<readonly LexicalEditorWithDispose[]>([]),
    };
  },
  register: (editor, config, state) => {
    const output = state.getOutput();
    const rootElement = state.getDependency(RootElementExtension).output;
    const paged = computed(() => output.pageSetup.value !== null);
    return effect(() => {
      const root = rootElement.value;
      if (root === null || output.disabled.value || !paged.value) return;
      const layout = new PagesLayout(editor, root, {
        gap: config.gap,
        onPageCountChange: (pageCount) => {
          output.pageCount.value = pageCount;
        },
      });
      const slots = new PageSlots(editor, layout, {
        activeSlot: output.activeSlot,
        activeSlotEditor: output.activeSlotEditor,
        buildSlotEditor: config.buildSlotEditor,
        renderClone: config.renderSlotClone,
        slotEditors: output.slotEditors,
      });
      return mergeRegister(
        // mergeRegister tears down in reverse order
        () => layout.dispose(),
        () => slots.dispose(),
        registerPrintHandlers(layout),
        effect(() => {
          const pageSetup = output.pageSetup.value;
          if (pageSetup !== null) {
            layout.setPageSetup(pageSetup);
            slots.setPageSetup(pageSetup);
            // lay the pages out before they are painted, rather than showing
            // the document as one page for the frames the layout waits for
            layout.flush({ zoom: true });
          }
        })
      );
    });
  },
});
