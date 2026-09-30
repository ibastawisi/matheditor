"use client"
import "./index.css";
import { type CSSProperties, useLayoutEffect, useMemo, useRef } from "react";

import { PAGE_GAP } from "./constants";
import { computeGeometry, resolveSlotVariant } from "./geometry";
import { PAGE_SLOT_ATTRIBUTE, PAGE_VARIANT_ATTRIBUTE, parsePageSetupFromHtml } from "./html";
import { PAGES_CSS, PagesLayout, type PagesLayoutSlotProvider } from "./layout";
import { writeCountersIntoDOM } from "./nodes";
import type { PageSetup, PageSlotKind, SlotHeights } from "./types";
import { CodeGutters } from "@/editor/extensions/code/gutter";
import theme from "@/editor/theme";

type SlotKey = `${PageSlotKind}:${string}`;

/**
 * Fills the header and footer slots of static pages with the HTML that the
 * server exported for each variant. Each variant is rendered once, parked in
 * the layer where its height is measured, and copied onto every page.
 */
class StaticPageSlots implements PagesLayoutSlotProvider {
  private readonly parked = new Map<SlotKey, HTMLElement>();
  private readonly observer: ResizeObserver | null;

  constructor(
    private readonly layout: PagesLayout,
    private readonly pageSetup: PageSetup,
    templates: HTMLTemplateElement[]
  ) {
    const doc = layout.layer.ownerDocument;
    for (const template of templates) {
      const kind = template.getAttribute(PAGE_SLOT_ATTRIBUTE) as PageSlotKind;
      const key: SlotKey = `${kind}:${template.getAttribute(PAGE_VARIANT_ATTRIBUTE)}`;
      const content = doc.createElement("div");
      content.className = PAGES_CSS.slotContent;
      content.dataset.pageSlotEditor = key;
      content.append(template.content.cloneNode(true));
      layout.parking.append(content);
      this.parked.set(key, content);
    }
    // images and fonts in a header change its height as they load
    this.observer = typeof ResizeObserver !== "undefined" ? new ResizeObserver(() => this.measureHeights()) : null;
    for (const content of this.parked.values()) this.observer?.observe(content);
    // a static document cannot be edited, so no slot offers to be
    layout.layer.dataset.pageEditable = "false";
    layout.setSlotProvider(this);
    this.measureHeights();
  }

  fillSlot(slot: HTMLElement, kind: PageSlotKind, pageIndex: number): void {
    const setup = this.pageSetup[kind];
    const variant = setup.enabled ? resolveSlotVariant(setup, pageIndex) : null;
    const parked = variant ? this.parked.get(`${kind}:${variant}`) : undefined;
    slot.dataset.pageSlotEnabled = String(setup.enabled);
    const content = parked ? (parked.cloneNode(true) as HTMLElement) : slot.ownerDocument.createElement("div");
    content.className = PAGES_CSS.slotContent;
    delete content.dataset.pageSlotEditor;
    writeCountersIntoDOM(content, pageIndex + 1, this.layout.getPageCount());
    slot.replaceChildren(content);
  }

  releaseSlot(): void {}

  private measureHeights(): void {
    const heights: SlotHeights = { header: {}, footer: {} };
    const zoom = parseFloat(this.layout.host.style.getPropertyValue("--page-zoom")) || 1;
    for (const [key, content] of this.parked) {
      const [kind, variant] = key.split(":") as [PageSlotKind, keyof SlotHeights["header"]];
      if (!this.pageSetup[kind].enabled) continue;
      heights[kind][variant] = content.getBoundingClientRect().height / zoom;
    }
    this.layout.setSlotHeights(heights);
  }

  dispose(): void {
    this.observer?.disconnect();
  }
}

/**
 * Exported HTML of a document, laid out on pages when the document is paged,
 * like the editor shows it. The server renders the page frame (its width and
 * margins); the page breaks, headers and footers are added before the first
 * paint in the browser.
 */
export function StaticPages({ html }: { html: string }) {
  const rootRef = useRef<HTMLDivElement>(null);
  const pageSetup = useMemo(() => parsePageSetupFromHtml(html), [html]);
  const frame = useMemo(() => {
    if (!pageSetup) return undefined;
    const geom = computeGeometry(pageSetup);
    const px = (n: number) => `${n}px`;
    return {
      "--page-width": px(geom.pageWidth),
      "--page-height": px(geom.pageHeight),
      "--page-margin-top": px(geom.marginTop),
      "--page-margin-right": px(geom.marginRight),
      "--page-margin-bottom": px(geom.marginBottom),
      "--page-margin-left": px(geom.marginLeft),
      "--page-content-height": px(geom.contentHeight),
      "--page-gap": px(geom.gap),
    } as CSSProperties;
  }, [pageSetup]);

  useLayoutEffect(() => {
    const root = rootRef.current;
    if (!root || !pageSetup) return;
    const templates = Array.from(root.querySelectorAll<HTMLTemplateElement>(":scope > template"));
    const slotTemplates = templates.filter((template) => template.hasAttribute(PAGE_SLOT_ATTRIBUTE));
    // the templates describe the pages, they are not blocks of the document
    for (const template of templates) template.remove();
    const layout = new PagesLayout(null, root, { gap: PAGE_GAP });
    const slots = new StaticPageSlots(layout, pageSetup, slotTemplates);
    layout.setPageSetup(pageSetup);
    layout.flush({ zoom: true });
    return () => {
      slots.dispose();
      layout.dispose();
    };
  }, [html, pageSetup]);

  // line numbers follow the rows that long lines of code wrap onto
  useLayoutEffect(() => {
    const root = rootRef.current;
    if (!root) return;
    const gutters = new CodeGutters();
    for (const code of root.querySelectorAll<HTMLElement>(`.${theme.code}`)) gutters.observe(code);
    return () => gutters.dispose();
  }, [html]);

  if (!pageSetup) return <div ref={rootRef} className="document-container" dangerouslySetInnerHTML={{ __html: html }} />;
  return (
    <div className={`document-pages ${PAGES_CSS.host}`} style={frame}>
      <div ref={rootRef} className="document-container" dangerouslySetInnerHTML={{ __html: html }} />
    </div>
  );
}

export default StaticPages;
