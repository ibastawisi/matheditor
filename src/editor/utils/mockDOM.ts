import type { SerializedEditorState } from "lexical";
import { createHeadlessEditor } from "@lexical/headless";
import { editorConfig } from "../config";
import { $generateHtmlFromNodes } from "./html";
import { parseHTML } from "linkedom";
import { generateHtml } from "./generateHtml";

export const mockDOM = () => {
  if (typeof window === "undefined") {
    const dom = parseHTML("<!DOCTYPE html><html><head></head><body></body></html>");
    global = dom;
    global.document = dom.document;
    global.DocumentFragment = dom.DocumentFragment;
    global.Element = dom.Element;
  }
}
