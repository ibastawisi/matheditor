"use client"
import { useCallback, useEffect, useMemo, useState } from "react";
import { getExtensionDependencyFromEditor } from "@lexical/extension";
import type { LexicalEditor } from "lexical";
import { List, ListItemButton, ListItemText, Typography } from "@mui/material";
import { useSignalValue } from "@/editor/extensions/shared/hooks";
import { scrollToElement } from "@/editor/extensions/hash-navigation";
import { TableOfContentsExtension } from ".";

export interface TableOfContentsItem {
  key: string;
  text: string;
  /** 1 for `h1` to 6 for `h6` */
  level: number;
  /** The fragment that links to the heading */
  id: string;
}

/**
 * The headings of a document, linking to them. `onNavigate` is called before
 * scrolling to a heading, to get the drawer out of the way.
 */
export function TableOfContentsPanel({ items, getElement, onNavigate }: {
  items: TableOfContentsItem[];
  getElement: (key: string) => HTMLElement | null;
  onNavigate?: () => void;
}) {
  const [activeKey, setActiveKey] = useState<string | null>(null);
  const minLevel = Math.min(...items.map((item) => item.level));

  // the section being read: the last heading above the top third of the screen
  useEffect(() => {
    let current = items[0]?.key ?? null;
    for (const item of items) {
      const element = getElement(item.key);
      if (!element) continue;
      if (element.getBoundingClientRect().top > window.innerHeight / 3) break;
      current = item.key;
    }
    setActiveKey(current);
  }, [items, getElement]);

  // the heading is scrolled to by its key, as headings can share a text
  const navigate = (item: TableOfContentsItem) => {
    const hash = `#${encodeURIComponent(item.id)}`;
    if (window.location.hash !== hash) window.history.pushState(null, "", hash);
    setActiveKey(item.key);
    onNavigate?.();
    requestAnimationFrame(() => {
      const element = getElement(item.key);
      if (element) scrollToElement(element);
    });
  };

  if (items.length === 0) {
    return <Typography variant="body2" sx={{ color: "text.secondary" }}>The headings of the document will be listed here.</Typography>;
  }

  return (
    <List component="nav" aria-label="Table of contents" dense disablePadding>
      {items.map((item) => (
        <ListItemButton
          key={item.key}
          component="a"
          href={`#${encodeURIComponent(item.id)}`}
          selected={item.key === activeKey}
          aria-current={item.key === activeKey ? "location" : undefined}
          onClick={(event: React.MouseEvent) => {
            event.preventDefault();
            navigate(item);
          }}
          sx={{ pl: 1 + (item.level - minLevel) * 2, borderRadius: 1 }}
        >
          <ListItemText primary={item.text} slotProps={{ primary: { noWrap: true, title: item.text } }} />
        </ListItemButton>
      ))}
    </List>
  );
}

/** The headings of the document in the editor, kept up to date as it is edited */
export function EditorTableOfContentsPanel({ editor, onNavigate }: { editor: LexicalEditor; onNavigate?: () => void }) {
  const output = useMemo(() => getExtensionDependencyFromEditor(editor, TableOfContentsExtension).output, [editor]);
  const entries = useSignalValue(output.tableOfContents);
  const items = useMemo(() => entries.map((entry) => ({ ...entry, level: Number(entry.tag.slice(1)) })), [entries]);
  const getElement = useCallback((key: string) => editor.getElementByKey(key), [editor]);
  return <TableOfContentsPanel items={items} getElement={getElement} onNavigate={onNavigate} />;
}

export default TableOfContentsPanel;
