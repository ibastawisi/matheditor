import type { LexicalEditor, SerializedEditorState } from "lexical";
import { $generateHtmlFromNodes } from "@lexical/html";
import { createHeadlessEditor } from "./createHeadlessEditor";
import { PageCountersExtension } from "@/editor/extensions/pages/nodes";
import { $getPageSetup, $getPageSlotContent } from "@/editor/extensions/pages/states";
import { generatePagesHtml, type PageSlotHtml } from "@/editor/extensions/pages/html";
import { PAGE_SLOT_VARIANTS } from "@/editor/extensions/pages/constants";
import type { PageSetup, PageSlotContent, PageSlotKind } from "@/editor/extensions/pages/types";

/** Runs an export, e.g. with a DOM installed on the server */
export type HtmlExportRunner = <T>(fn: () => T) => T;

/** The HTML of a document, apart from the templates that describe its pages */
export interface DocumentHtml {
  html: string;
  pageSetup: PageSetup | null;
  slots: PageSlotHtml[];
}

let editor: ReturnType<typeof createHeadlessEditor> | null = null;
let slotEditor: ReturnType<typeof createHeadlessEditor> | null = null;

const runInPlace: HtmlExportRunner = (fn) => fn();

const generateEditorHtml = (editor: LexicalEditor, data: SerializedEditorState, run: HtmlExportRunner) => {
  editor.setEditorState(editor.parseEditorState(data));
  return run(() => editor.read(() => $generateHtmlFromNodes(editor)));
};

/** The HTML of the header and footer variants that the pages of a document show */
const generateSlotsHtml = (
  pageSetup: PageSetup,
  content: Record<PageSlotKind, PageSlotContent | null>,
  run: HtmlExportRunner
) => {
  const slots: PageSlotHtml[] = [];
  for (const kind of ["header", "footer"] as const) {
    const setup = pageSetup[kind];
    if (!setup.enabled) continue;
    for (const variant of PAGE_SLOT_VARIANTS) {
      if (variant === "first" && !setup.differentFirstPage) continue;
      if (variant === "even" && !setup.differentEvenPages) continue;
      const data = content[kind]?.[variant];
      if (!data) continue;
      // headers and footers can hold page counters, which the document cannot
      slotEditor ??= createHeadlessEditor(undefined, [PageCountersExtension]);
      slots.push({ kind, variant, html: generateEditorHtml(slotEditor, data, run) });
    }
  }
  return slots;
};

export const generateDocumentHtml = (data: SerializedEditorState, run: HtmlExportRunner = runInPlace): DocumentHtml => {
  editor ??= createHeadlessEditor();
  const html = generateEditorHtml(editor, data, run);
  const [pageSetup, header, footer] = editor.read(() => [
    $getPageSetup(),
    $getPageSlotContent("header"),
    $getPageSlotContent("footer"),
  ] as const);
  if (!pageSetup) return { html, pageSetup: null, slots: [] };
  return { html, pageSetup, slots: generateSlotsHtml(pageSetup, { header, footer }, run) };
};

/** The HTML of a document, led by the templates that describe its pages if it is paged */
export const serializeDocumentHtml = ({ html, pageSetup, slots }: DocumentHtml) =>
  pageSetup ? generatePagesHtml(pageSetup, slots) + html : html;
