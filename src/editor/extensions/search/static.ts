"use client"
import { useEffect, useMemo } from "react";
import theme from "@/editor/theme";
import { createSearch, type SearchController, type SearchSource, type TextBlock } from "./core";
import "./index.css";

/** Elements that start a block of text in exported HTML */
const BLOCK_TAGS = new Set([
  "ADDRESS", "ARTICLE", "ASIDE", "BLOCKQUOTE", "DD", "DETAILS", "DIV", "DL", "DT", "FIGCAPTION", "FIGURE",
  "H1", "H2", "H3", "H4", "H5", "H6", "HR", "LI", "OL", "P", "PRE", "SECTION", "SUMMARY", "TABLE", "TBODY",
  "TD", "TH", "THEAD", "TR", "UL",
]);
/** Elements whose text is not the document's: rendered math is glyphs, not its source */
const SKIPPED = `script, style, template, svg, .${theme.math}`;

function collectBlocks(root: HTMLElement): TextBlock<Text>[] {
  const blocks: TextBlock<Text>[] = [];
  const walk = (element: Element, block: TextBlock<Text>) => {
    for (const child of Array.from(element.childNodes)) {
      if (child instanceof Text) {
        block.fragments.push({ target: child, start: block.text.length, length: child.data.length });
        block.text += child.data;
      } else if (!(child instanceof Element)) {
        continue;
      } else if (child.matches(SKIPPED) || child.nodeName === "BR") {
        block.text += "\n";
      } else if (BLOCK_TAGS.has(child.nodeName)) {
        const nested: TextBlock<Text> = { text: "", fragments: [] };
        blocks.push(nested);
        walk(child, nested);
      } else {
        walk(child, block);
      }
    }
  };
  walk(root, { text: "", fragments: [] });
  return blocks;
}

/** Searches a static copy of the document, which does not change once rendered */
function createStaticSearchSource(root: HTMLElement): SearchSource<Text> {
  return {
    getBlocks: () => collectBlocks(root),
    toDOMRange: ({ target, start, end }) => {
      if (!target.isConnected) return null;
      const range = document.createRange();
      range.setStart(target, start);
      range.setEnd(target, end);
      return range;
    },
  };
}

/** A search of the document rendered in `container`, highlighting its matches while mounted */
export function useStaticSearch(container: HTMLElement | null): SearchController | null {
  const search = useMemo(() => container && createSearch(createStaticSearchSource(container)), [container]);
  useEffect(() => search?.registerHighlights(), [search]);
  return search;
}
