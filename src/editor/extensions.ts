import { defineExtension } from "lexical";
import { RichTextExtension } from "@lexical/rich-text";
import { HistoryExtension } from "@lexical/history";
import theme from "@/editor/theme";
import { StoreExtension } from "@/editor/extensions/store";
import { ListExtension } from "@/editor/extensions/list";
import { LinkExtension } from "@/editor/extensions/link";
import { TableExtension } from "@/editor/extensions/table";
import { TabIndentationExtension } from "@/editor/extensions/tab-indentation";
import { TabFocusExtension } from "@/editor/extensions/tab-focus";
import { HorizontalRuleExtension } from "@/editor/extensions/horizontal-rule";
import { CodeExtension } from "@/editor/extensions/code";
import { DetailsExtension } from "@/editor/extensions/details";
import { IFrameExtension } from "@/editor/extensions/iframe";
import { LayoutExtension } from "@/editor/extensions/layout";
import { MathExtension } from "@/editor/extensions/math";
import { SelectionHighlightExtension } from "@/editor/extensions/selection-highlight";
import { StickyExtension } from "@/editor/extensions/sticky";
import { GraphExtension } from "@/editor/extensions/graph";
import { SketchExtension } from "@/editor/extensions/sketch";
import { ImageExtension } from "@/editor/extensions/image";
import { MarkdownExtension } from "@/editor/extensions/markdown";
import { ShortcutsExtension } from "@/editor/extensions/shortcuts";
import { PageBreakExtension } from "@/editor/extensions/page-break";
import { DragDropPasteExtension } from "@/editor/extensions/drag-drop-paste";
import { LegacyExtension } from "@/editor/extensions/legacy";
import { HtmlExtension } from "@/editor/extensions/html";

/**
 * The nodes and behaviors of the editor, without any React UI,
 * so that it can be used to read and export documents on the server
 */
export const CoreEditorExtensions = defineExtension({
  name: "@matheditor/core",
  namespace: "matheditor",
  theme: theme,
  onError(error: Error) {
    throw error;
  },
  dependencies: [
    RichTextExtension,
    ListExtension,
    LinkExtension,
    TableExtension,
    HorizontalRuleExtension,
    CodeExtension,
    DetailsExtension,
    IFrameExtension,
    LayoutExtension,
    MathExtension,
    StickyExtension,
    GraphExtension,
    SketchExtension,
    ImageExtension,
    PageBreakExtension,
    LegacyExtension,
    HtmlExtension,
  ],
});

/** Everything needed to edit a document, except the React UI which is added by the EditorComposer */
export const FullEditorExtensions = defineExtension({
  name: "@matheditor/full",
  dependencies: [
    CoreEditorExtensions,
    StoreExtension,
    HistoryExtension,
    TabIndentationExtension,
    TabFocusExtension,
    SelectionHighlightExtension,
    MarkdownExtension,
    ShortcutsExtension,
    DragDropPasteExtension,
  ],
});
