"use client"
import { useCallback, useMemo } from "react";
import theme from "@/editor/theme";
import { formatId } from ".";
import { TableOfContentsPanel, type TableOfContentsItem } from "./panel";

/** A heading's text as the editor has it, where math is its source between `$` */
function getHeadingText(heading: Element): string {
  let text = "";
  const walk = (node: Node) => {
    for (const child of Array.from(node.childNodes)) {
      if (child instanceof Text) text += child.data;
      else if (child instanceof HTMLElement && child.classList.contains(theme.math)) text += `$${child.dataset.value ?? ""}$`;
      else if (child.nodeName === "BR") text += "\n";
      else walk(child);
    }
  };
  walk(heading);
  return text;
}

/** The headings of a static copy of the document, in order */
export function getStaticHeadings(root: HTMLElement): (TableOfContentsItem & { element: HTMLElement })[] {
  return Array.from(root.querySelectorAll<HTMLElement>("h1, h2, h3, h4, h5, h6")).flatMap((element, index) => {
    const text = getHeadingText(element);
    if (!text.trim()) return [];
    return [{ key: String(index), text, level: Number(element.tagName.slice(1)), id: formatId(text), element }];
  });
}

/** The headings of the document rendered in `container`, which does not change once rendered */
export function StaticTableOfContentsPanel({ container, onNavigate }: { container: HTMLElement; onNavigate?: () => void }) {
  const headings = useMemo(() => getStaticHeadings(container), [container]);
  const getElement = useCallback((key: string) => headings.find((heading) => heading.key === key)?.element ?? null, [headings]);
  return <TableOfContentsPanel items={headings} getElement={getElement} onNavigate={onNavigate} />;
}

export default StaticTableOfContentsPanel;
