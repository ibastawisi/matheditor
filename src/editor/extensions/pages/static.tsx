"use client"
import "./index.css";
import { type CSSProperties, useId, useLayoutEffect, useMemo, useRef, useSyncExternalStore } from "react";

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
 * Runs inline from the server HTML, before the page's JavaScript: until the
 * layout runs, each manual page break is stretched to the end of its page, so
 * that the page before it is drawn at its full height from the first paint.
 * The stretch is written to a stylesheet of its own, since the document HTML
 * must stay as the server sent it for hydration.
 *
 * Serialized with `toString`, so it must not refer to anything outside itself.
 */
function stretchStaticPageBreaks(styleId: string) {
  const host = document.currentScript?.previousElementSibling;
  const root = host?.lastElementChild;
  if (!(host instanceof HTMLElement) || !(root instanceof HTMLElement)) return;
  const style = document.createElement("style");
  style.id = styleId;
  document.head.append(style);
  const selector = `[data-static-pages="${CSS.escape(styleId)}"]>.document-container>`;
  let fills: number[] = [];
  const update = () => {
    // the layout has taken over, see the `:not(:has(> .Pages__layer))` rules
    if (!host.isConnected || host.querySelector(":scope > .Pages__layer")) return stop();
    // a streamed boundary stays hidden until React reveals it
    if (host.closest("[hidden]") || host.getClientRects().length === 0) return;
    const vars = getComputedStyle(host);
    const read = (name: string) => parseFloat(vars.getPropertyValue(name)) || 0;
    const stride = read("--page-height") + read("--page-gap");
    const contentBottom = read("--page-height") - read("--page-margin-bottom");
    const hostTop = host.getBoundingClientRect().top;
    const next: number[] = [];
    let rules = "";
    // the fills in place moved every later break down: take them out, and
    // put the new ones in
    let oldShift = 0;
    let shift = 0;
    for (let i = 0; i < root.children.length; i++) {
      const el = root.children[i];
      if (el.getAttribute("type") !== "page-break" || el.nextElementSibling === null) continue;
      const top = el.getBoundingClientRect().top - hostTop - oldShift + shift;
      let page = Math.floor(top / stride);
      // a break below the end of a page's content lands on the next page
      if (top > page * stride + contentBottom) page++;
      const fill = Math.max(0, page * stride + contentBottom - top);
      oldShift += fills[next.length] ?? 0;
      shift += fill;
      next.push(fill);
      rules += `${selector}:nth-child(${i + 1}){--page-break-fill:${fill}px}`;
    }
    fills = next;
    if (style.textContent !== rules) style.textContent = rules;
  };
  // React reveals a streamed boundary in an animation frame, and mutation
  // callbacks run right after it, before that frame is painted
  const observer = new MutationObserver(update);
  observer.observe(document, { childList: true, subtree: true });
  let frame = 0;
  const loop = () => {
    update();
    // fonts and images loading change where the breaks fall
    if (frame !== -1) frame = requestAnimationFrame(loop);
  };
  const stop = () => {
    style.remove();
    observer.disconnect();
    cancelAnimationFrame(frame);
    frame = -1;
  };
  loop();
}

const subscribeToNothing = () => () => {};

/**
 * Exported HTML of a document, laid out on pages when the document is paged,
 * like the editor shows it. The server renders the page frame (its width and
 * margins); the page breaks, headers and footers are added before the first
 * paint in the browser.
 */
export function StaticPages({ html }: { html: string }) {
  const rootRef = useRef<HTMLDivElement>(null);
  const styleId = `static-pages-${useId()}`;
  // the script only runs from the server HTML: rendered on the client it would
  // never run, so it is kept only while hydrating
  const hydrating = useSyncExternalStore(subscribeToNothing, () => false, () => true);
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
    <>
      {/* while the server HTML loads, the browser restores the scroll position
          and then keeps what is on screen in place as the page breaks and
          their styles come in; once loaded, it restores the position again
          and the page jumps. Without scroll anchoring, the first restore
          holds */}
      <div className={`document-pages ${PAGES_CSS.host}`} style={hydrating ? { ...frame, overflowAnchor: "none" } : frame} data-static-pages={styleId}>
        <div ref={rootRef} className="document-container" dangerouslySetInnerHTML={{ __html: html }} />
      </div>
      {hydrating && (
        <script
          dangerouslySetInnerHTML={{ __html: `(${stretchStaticPageBreaks})(${JSON.stringify(styleId)})` }}
        />
      )}
    </>
  );
}

export default StaticPages;
