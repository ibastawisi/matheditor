import type { LexicalEditor, SerializedEditorState } from "lexical";
import { $generateHtmlFromNodes } from "@lexical/html";
import { createHeadlessEditor } from "./createHeadlessEditor";
import { withServerDOM } from "./withServerDOM";
import { PageCountersExtension } from "@/editor/extensions/pages/nodes";
import { $getPageSetup, $getPageSlotContent } from "@/editor/extensions/pages/states";
import { generatePagesHtml, type PageSlotHtml } from "@/editor/extensions/pages/html";
import { PAGE_SLOT_VARIANTS } from "@/editor/extensions/pages/constants";
import type { PageSetup, PageSlotContent, PageSlotKind } from "@/editor/extensions/pages/types";

let editor: ReturnType<typeof createHeadlessEditor> | null = null;
let slotEditor: ReturnType<typeof createHeadlessEditor> | null = null;

const generateEditorHtml = (editor: LexicalEditor, data: SerializedEditorState) => {
  editor.setEditorState(editor.parseEditorState(data));
  return withServerDOM(() => editor.read(() => $generateHtmlFromNodes(editor)));
};

/** The HTML of the header and footer variants that the pages of a document show */
const generateSlotsHtml = (pageSetup: PageSetup, content: Record<PageSlotKind, PageSlotContent | null>) => {
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
      slots.push({ kind, variant, html: generateEditorHtml(slotEditor, data) });
    }
  }
  return slots;
};

export const generateServerHtml = (data: SerializedEditorState) => new Promise<string>((resolve, reject) => {
  try {
    editor ??= createHeadlessEditor();
    const html = generateEditorHtml(editor, data);
    const [pageSetup, header, footer] = editor.read(() => [
      $getPageSetup(),
      $getPageSlotContent("header"),
      $getPageSlotContent("footer"),
    ] as const);
    if (!pageSetup) return resolve(html);
    resolve(generatePagesHtml(pageSetup, generateSlotsHtml(pageSetup, { header, footer })) + html);
  } catch (error) {
    reject(error);
  }
});
