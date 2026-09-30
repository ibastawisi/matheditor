import { $getNodeByKey, getParentElement, isHTMLElement, type LexicalEditor, mergeRegister, type NodeKey } from "lexical";

import { PageBreakNode } from "@/editor/extensions/page-break/nodes";
import { MAX_SLOT_HEIGHT_RATIO } from "./constants";
import {
  computeGeometry,
  computePageBreakMarginBottom,
  computePageCount,
  computeZoom,
  pageContentHeight,
  pageContentTop,
  pageIndexAtY,
  slotHeight,
} from "./geometry";
import type { PageGeometry, PageSetup, PageSlotKind, SlotHeights } from "./types";

/**
 * Supplies the content of header and footer slots. The layout only knows about
 * slot elements and page indices, what goes inside them is up to the provider.
 */
export interface PagesLayoutSlotProvider {
  fillSlot(slot: HTMLElement, kind: PageSlotKind, pageIndex: number): void;
  /** `slot` is about to be removed along with its page */
  releaseSlot(slot: HTMLElement): void;
}

export interface PagesLayoutOptions {
  gap: number;
  onPageCountChange?: (pageCount: number) => void;
}

const IS_DEV = process.env.NODE_ENV !== "production";
/** Writes per settle window before the layout stops chasing itself */
const MAX_PASSES_PER_BURST = 8;
/** Idle time after which the pass counter resets */
const BURST_WINDOW_MS = 250;
/** Ignore sub-pixel jitter when deciding whether to rewrite a margin */
const MARGIN_EPSILON = 0.5;
/**
 * A top-level text block holding a line with nothing but a line break: two
 * breaks in a row, a leading one, or a trailing one (followed by Lexical's
 * managed break, or in WebKit by its managed image)
 */
const BLANK_SOFT_LINE_BLOCK =
  ":is(p, h1, h2, h3, h4, h5, h6, blockquote):is(" +
  ":has(> br:first-child), :has(> br + br), " +
  ":has(> br + img[data-lexical-managed-linebreak]))";
/** Marks a block that the stylesheet moves whole past a band */
const KEEP_TOGETHER_ATTRIBUTE = "data-page-keep-together";
/**
 * Floated notes and images in the root's formatting context, as opposed to
 * those inside a table cell, a column, a decorator or another float, which
 * float within their own
 */
export const FLOATED_SELECTOR =
  ":is(.LexicalTheme__floatLeft, .LexicalTheme__floatRight)" +
  ":not(:is(td, th, .LexicalTheme__layoutItem, .LexicalTheme__floatLeft, .LexicalTheme__floatRight, [data-lexical-decorator]) *)";
/** Manual page breaks, as the page break node renders and exports them */
const PAGE_BREAK_SELECTOR = '[type="page-break"]';
/** Marks a floated element that the layout has placed over its stand-in */
const FLOAT_PLACED_ATTRIBUTE = "data-page-float";
/** Room between a floated element and the text flowing around it */
const FLOAT_GAP_X = 16;
const FLOAT_GAP_Y = 8;

export const PAGES_CSS = {
  break: "Pages__break",
  breakHeader: "Pages__breakHeader",
  float: "Pages__float",
  footer: "Pages__footer",
  footerLast: "Pages__footer--last",
  gap: "Pages__gap",
  header: "Pages__header",
  headerFirst: "Pages__header--first",
  host: "Pages__host",
  layer: "Pages__layer",
  parking: "Pages__parking",
  slotContent: "Pages__slotContent",
  spacer: "Pages__spacer",
} as const;

const HOST_VARS = [
  "--page-width",
  "--page-height",
  "--page-margin-top",
  "--page-margin-right",
  "--page-margin-bottom",
  "--page-margin-left",
  "--page-header-height",
  "--page-footer-height",
  "--page-gap",
  "--page-content-height",
  "--page-first-top",
  "--page-count",
  "--page-zoom",
];

/**
 * One page boundary: a zero-width spacer as tall as the content area, then
 * three full-width floats. Keeping the footer band, the gap and the header
 * band as separate floats means that no float ever crosses a printed page
 * boundary (the gap is zero in print), so the browser never has to split one.
 */
interface PageBreakElements {
  spacer: HTMLElement;
  footerBand: HTMLElement;
  gap: HTMLElement;
  headerBand: HTMLElement;
}

/** Where the stand-in of a floated element goes: its page, side and box in host coordinates */
interface FloatPlacement {
  pageIndex: number;
  side: "left" | "right";
  top: number;
  width: number;
  height: number;
}

/**
 * Renders a paged view of a flat document without touching the document.
 *
 * The editor root's parent becomes the host, a block formatting context. A
 * layer is inserted before the root holding, for every page boundary, a
 * zero-width spacer float as tall as a page's content area followed by three
 * full-width floats: the footer band, the gap and the header band of the next
 * page. The layer is not a formatting context of its own, so the floats
 * intrude into the root's line boxes: lines that would straddle a page
 * boundary flow around the break, and blocks that establish their own
 * formatting context are pushed below it whole. The only JavaScript decides
 * how many breaks exist and stretches manual page breaks to the next page.
 *
 * A float may not sit higher than any float before it, and every page break
 * comes before the document, so a floated note or image in the document would
 * land on the last page. Instead, each one is positioned absolutely over a
 * stand-in float of its size that the layer places between the breaks of its
 * page, and the text of the document flows around the stand-in.
 *
 * All DOM reads happen in observer callbacks, after layout, and all writes
 * are deferred to the next animation frame. Nothing here updates the editor.
 * Without an editor, it lays out static HTML of a document the same way.
 */
export class PagesLayout {
  readonly win: Window & typeof globalThis;
  readonly host: HTMLElement;
  readonly layer: HTMLElement;
  readonly parking: HTMLElement;
  private readonly firstHeader: HTMLElement;
  private readonly lastFooter: HTMLElement;
  private readonly breaks: PageBreakElements[] = [];
  private readonly pageBreakKeys = new Set<NodeKey>();
  private readonly keptTogether = new Set<HTMLElement>();
  /** Offsets written to the floated elements of the document */
  private readonly placedFloats = new Map<HTMLElement, { x: number; y: number }>();
  /** Stand-in floats and the pads that place them, in the layer */
  private readonly floatElements: HTMLElement[] = [];
  private floatPlacements: FloatPlacement[] = [];
  private floatSignature = "";
  private floatObserver: ResizeObserver | null = null;
  private readonly cleanup: () => void;
  private slotProvider: PagesLayoutSlotProvider | null = null;
  private geom: PageGeometry | null = null;
  private pageSetup: PageSetup | null = null;
  private slotHeights: SlotHeights = { footer: {}, header: {} };
  private pageCount = 1;
  /** The zoom last written to `--page-zoom`, not the one last measured */
  private zoom = 1;
  private pendingWrites: (() => void)[] = [];
  private writeRafId: number | null = null;
  private measureRafIds: number[] = [];
  private passes = 0;
  private lastPassAt = 0;
  private recentCounts: number[] = [];
  private pinnedCount: number | null = null;
  /** The settle guard dropped writes, so the layout may be stale */
  private dropped = false;
  private disposed = false;

  constructor(
    private readonly editor: LexicalEditor | null,
    readonly rootElement: HTMLElement,
    private readonly options: PagesLayoutOptions
  ) {
    const host = getParentElement(rootElement);
    const doc = rootElement.ownerDocument;
    const win = doc.defaultView;
    if (!isHTMLElement(host) || win === null) {
      throw new Error("PagesLayout: the editor root must have a parent element");
    }
    this.win = win as Window & typeof globalThis;
    this.host = host;
    const createDiv = (className: string) => {
      const el = doc.createElement("div");
      el.className = className;
      return el;
    };
    this.layer = createDiv(PAGES_CSS.layer);
    this.layer.setAttribute("aria-hidden", "true");
    this.firstHeader = this.createSlot("header", 0);
    this.firstHeader.classList.add(PAGES_CSS.headerFirst);
    this.lastFooter = this.createSlot("footer", 0);
    this.lastFooter.classList.add(PAGES_CSS.footerLast);
    this.parking = createDiv(PAGES_CSS.parking);
    this.layer.append(this.firstHeader, this.lastFooter, this.parking);
    host.classList.add(PAGES_CSS.host);
    host.insertBefore(this.layer, rootElement);

    const observers: ResizeObserver[] = [];
    const Observer = this.win.ResizeObserver;
    if (typeof Observer !== "undefined") {
      const rootObserver = new Observer(() => this.measure());
      rootObserver.observe(rootElement);
      observers.push(rootObserver);
      // floated elements are out of flow, so the root does not grow with them
      this.floatObserver = new Observer(() => this.scheduleMeasure());
      observers.push(this.floatObserver);
      const viewport = getParentElement(host);
      if (isHTMLElement(viewport)) {
        const viewportObserver = new Observer(() => this.measureZoom());
        viewportObserver.observe(viewport);
        observers.push(viewportObserver);
      }
    }
    this.cleanup = mergeRegister(
      () => observers.forEach((observer) => observer.disconnect()),
      editor ? this.registerEditorListeners(editor) : () => {}
    );
  }

  private registerEditorListeners(editor: LexicalEditor): () => void {
    const rootElement = this.rootElement;
    return mergeRegister(
      editor.registerMutationListener(
        PageBreakNode,
        (mutations) => {
          for (const [key, mutation] of mutations) {
            if (mutation === "destroyed") this.pageBreakKeys.delete(key);
            else this.pageBreakKeys.add(key);
          }
          this.resetGuard();
          this.scheduleMeasure();
        },
        { skipInitialization: false }
      ),
      editor.registerUpdateListener(({ dirtyElements, dirtyLeaves }) => {
        if (dirtyElements.size === 0 && dirtyLeaves.size === 0) return;
        // an edit is a new situation for the settle guard: a page count pinned
        // for the previous content must not outlive the content that caused it
        this.resetGuard();
        // a manual page break or a floated element can move without the root
        // changing height (text edited above it), which the ResizeObserver
        // cannot see
        if (
          this.pageBreakKeys.size > 0 ||
          this.placedFloats.size > 0 ||
          rootElement.querySelector(FLOATED_SELECTOR) !== null
        ) {
          this.scheduleMeasure();
        }
      })
    );
  }

  /** The manual page breaks, and whether each ends the document */
  private getPageBreaks(): { el: HTMLElement; isLast: boolean }[] {
    const editor = this.editor;
    if (editor === null) {
      return Array.from(this.rootElement.querySelectorAll<HTMLElement>(PAGE_BREAK_SELECTOR), (el) => ({
        el,
        isLast: el.nextElementSibling === null,
      }));
    }
    const breaks: { el: HTMLElement; isLast: boolean }[] = [];
    for (const key of this.pageBreakKeys) {
      const el = editor.getElementByKey(key);
      // asked of the document, since the DOM may end in a decorator boundary
      if (el) breaks.push({ el, isLast: editor.read("latest", () => $getNodeByKey(key)?.getNextSibling() === null) });
    }
    return breaks;
  }

  getPageCount(): number {
    return this.pageCount;
  }

  /** Applies a new page setup; the geometry is rewritten on the next frame */
  setPageSetup(pageSetup: PageSetup): void {
    this.pageSetup = pageSetup;
    this.resetGuard();
    this.recomputeGeometry();
  }

  /**
   * Heights of the header and footer content per variant. Each page's bands
   * take the height of the variant that page shows, clamped so that a runaway
   * header cannot eat the page.
   */
  setSlotHeights(heights: SlotHeights): void {
    const max = this.geom !== null ? this.geom.pageHeight * MAX_SLOT_HEIGHT_RATIO : Number.POSITIVE_INFINITY;
    const clamp = (values: SlotHeights["header"]) =>
      Object.fromEntries(
        Object.entries(values).map(([variant, height]) => [variant, Math.min(max, Math.max(0, height ?? 0))])
      ) as SlotHeights["header"];
    const next: SlotHeights = { footer: clamp(heights.footer), header: clamp(heights.header) };
    if (JSON.stringify(next) === JSON.stringify(this.slotHeights)) return;
    this.slotHeights = next;
    this.resetGuard();
    this.recomputeGeometry();
  }

  /**
   * Applies pending writes now and measures synchronously until stable, for
   * moments when the next frame is too late: before the first paint of a new
   * page setup, or `beforeprint`. With `zoom`, the fit to the viewport is
   * measured too, which printing must not do.
   */
  flush({ zoom = false }: { zoom?: boolean } = {}): void {
    for (let pass = 0; pass < 4 && !this.disposed; pass++) {
      if (this.writeRafId !== null) {
        this.win.cancelAnimationFrame(this.writeRafId);
        this.writeRafId = null;
      }
      this.measureRafIds.forEach((id) => this.win.cancelAnimationFrame(id));
      this.measureRafIds = [];
      const queued = this.pendingWrites;
      this.pendingWrites = [];
      for (const write of queued) write();
      if (zoom) this.measureZoom();
      this.measure();
      if (this.pendingWrites.length === 0) break;
    }
  }

  /** Installs the object that renders slot content, then fills every slot */
  setSlotProvider(provider: PagesLayoutSlotProvider | null): void {
    this.slotProvider = provider;
    this.refreshSlots();
  }

  /** The header/footer slot element of a page, if that page exists */
  getSlot(kind: PageSlotKind, pageIndex: number): HTMLElement | null {
    let found: HTMLElement | null = null;
    this.forEachSlot((slot, slotKind, slotPageIndex) => {
      if (slotKind === kind && slotPageIndex === pageIndex) found = slot;
    });
    return found;
  }

  /** Re-fills every header/footer slot after the slot content changed */
  refreshSlots(kind?: PageSlotKind): void {
    this.forEachSlot((slot, slotKind, pageIndex) => {
      if (kind === undefined || kind === slotKind) this.fillSlot(slot, slotKind, pageIndex);
    });
    this.scheduleMeasure();
  }

  forEachSlot(fn: (slot: HTMLElement, kind: PageSlotKind, pageIndex: number) => void): void {
    fn(this.firstHeader, "header", 0);
    this.breaks.forEach(({ footerBand, headerBand }, i) => {
      fn(footerBand.firstElementChild as HTMLElement, "footer", i);
      fn(headerBand.firstElementChild as HTMLElement, "header", i + 1);
    });
    fn(this.lastFooter, "footer", this.pageCount - 1);
  }

  dispose(): void {
    if (this.disposed) return;
    this.disposed = true;
    if (this.writeRafId !== null) this.win.cancelAnimationFrame(this.writeRafId);
    this.measureRafIds.forEach((id) => this.win.cancelAnimationFrame(id));
    this.cleanup();
    for (const { el } of this.getPageBreaks()) {
      el.style.removeProperty("margin-bottom");
      delete el.dataset.pageBreakMargin;
    }
    for (const el of this.keptTogether) el.removeAttribute(KEEP_TOGETHER_ATTRIBUTE);
    this.keptTogether.clear();
    for (const el of [...this.placedFloats.keys()]) this.releaseFloat(el);
    this.floatElements.length = 0;
    this.layer.remove();
    this.host.classList.remove(PAGES_CSS.host);
    this.host.style.removeProperty("min-height");
    this.rootElement.style.removeProperty("min-height");
    for (const prop of HOST_VARS) this.host.style.removeProperty(prop);
    this.options.onPageCountChange?.(1);
  }

  // ---- read phase -------------------------------------------------------

  /**
   * Reads the root's extent and every manual page break's position, then
   * queues whatever writes are needed. Called from the ResizeObserver, after
   * layout, so these reads never force a synchronous layout.
   */
  measure(): void {
    const geom = this.geom;
    if (this.disposed || geom === null) return;
    const root = this.rootElement;
    const rootTop = root.offsetTop;
    const writes: (() => void)[] = [];
    const floatBottom = this.measureFloats(geom, writes);
    const countAt = writes.length;
    const breaks = this.getPageBreaks()
      .map((pageBreak) => ({ ...pageBreak, top: pageBreak.el.offsetTop }))
      .sort((a, b) => a.top - b.top);
    // a margin that changes moves every later break: measure them where they
    // will be, so that one pass places them all
    let shift = 0;
    // where the blocks after a break start now: past a margin that ends inside
    // a band, they flow below the band, as if the margin were already right
    const flowTop = (y: number) => {
      const page = pageIndexAtY(y, geom);
      if (page >= this.breaks.length || y < pageContentTop(page, geom) + pageContentHeight(geom, page)) return y;
      return pageContentTop(page + 1, geom);
    };
    for (const { el, isLast, top } of breaks) {
      const current = parseFloat(el.dataset.pageBreakMargin ?? "") || 0;
      if (getParentElement(el) !== root) {
        // only top-level page breaks are stretched
        if (current !== 0) {
          writes.push(() => {
            el.style.removeProperty("margin-bottom");
            delete el.dataset.pageBreakMargin;
          });
        }
        continue;
      }
      // a break with nothing after it starts no page: its margin would
      // collapse through the root unseen on screen, yet print a blank page
      const height = el.offsetHeight;
      const marginBottom = isLast ? 0 : computePageBreakMarginBottom(rootTop + top + shift, height, geom);
      const bottom = rootTop + top + height;
      shift = bottom + shift + marginBottom - flowTop(bottom + current);
      if (Math.abs(marginBottom - current) > MARGIN_EPSILON) {
        writes.push(() => {
          el.dataset.pageBreakMargin = String(marginBottom);
          if (marginBottom > 0) {
            // the next page top is one gap closer when the gap collapses for
            // print, so express the margin relative to the gap
            el.style.marginBottom = `calc(${marginBottom - geom.gap}px + var(--page-gap))`;
          } else {
            el.style.removeProperty("margin-bottom");
          }
        });
      }
    }
    let count = computePageCount(Math.max(rootTop + root.offsetHeight + shift, floatBottom), geom, this.breaks.length);
    if (this.pinnedCount !== null) count = this.pinnedCount;
    if (count !== this.pageCount) writes.splice(countAt, 0, () => this.applyPageCount(count));
    this.measureBlankSoftLines(geom, rootTop, writes);
    if (writes.length > 0) this.scheduleWrites(writes);
  }

  /**
   * A line holding nothing but a line break has no width, and every engine
   * fits a zero-width line beside a full-width float: a blank soft line that
   * reaches a band would be drawn inside it, past the right margin, with the
   * caret. The block holding it is marked to move whole past the band, if it
   * fits on a page. Only the block straddling each band is inspected, found by
   * a binary search of the root's children.
   */
  private measureBlankSoftLines(geom: PageGeometry, rootTop: number, writes: (() => void)[]): void {
    const root = this.rootElement;
    const fitsOnPage = (el: HTMLElement) =>
      el.offsetHeight <= pageContentHeight(geom, pageIndexAtY(rootTop + el.offsetTop, geom));
    for (const el of this.keptTogether) {
      if (!el.isConnected || getParentElement(el) !== root || !el.matches(BLANK_SOFT_LINE_BLOCK) || !fitsOnPage(el)) {
        writes.push(() => {
          el.removeAttribute(KEEP_TOGETHER_ATTRIBUTE);
          this.keptTogether.delete(el);
        });
      }
    }
    const children = root.children;
    for (let k = 0; k < this.breaks.length; k++) {
      const bandTop = pageContentTop(k, geom) + pageContentHeight(geom, k);
      const bandBottom = pageContentTop(k + 1, geom);
      let lo = 0;
      let hi = children.length - 1;
      let block: HTMLElement | null = null;
      while (lo <= hi) {
        const mid = (lo + hi) >> 1;
        const child = children[mid];
        if (!isHTMLElement(child)) break;
        const top = rootTop + child.offsetTop;
        if (top + child.offsetHeight <= bandTop) lo = mid + 1;
        else if (top >= bandBottom) hi = mid - 1;
        else {
          block = child;
          break;
        }
      }
      if (
        block === null ||
        this.keptTogether.has(block) ||
        !block.matches(BLANK_SOFT_LINE_BLOCK) ||
        block.offsetHeight > pageContentHeight(geom, k + 1)
      ) {
        continue;
      }
      const right = block.getBoundingClientRect().right;
      const beside = Array.from(block.querySelectorAll(":scope > br")).some(
        (br) => br.getBoundingClientRect().left > right + 0.5
      );
      if (beside) {
        const el = block;
        writes.push(() => {
          el.setAttribute(KEEP_TOGETHER_ATTRIBUTE, "true");
          this.keptTogether.add(el);
        });
      }
    }
  }

  /**
   * Reads where each floated element of the document would sit in the flow
   * (its static position, since it is positioned absolutely), places its
   * stand-in there, or on the next page if it does not fit, below any earlier
   * float on the same side, and queues the writes that move the element over
   * its stand-in. Returns the bottom of the lowest stand-in.
   */
  private measureFloats(geom: PageGeometry, writes: (() => void)[]): number {
    const hostRect = this.host.getBoundingClientRect();
    const zoom = this.zoom || 1;
    const anchors: { el: HTMLElement; side: "left" | "right"; top: number; left: number; width: number; height: number }[] = [];
    for (const el of this.rootElement.querySelectorAll<HTMLElement>(FLOATED_SELECTOR)) {
      const rect = el.getBoundingClientRect();
      // an element that Lexical created again has lost its offset
      const offset = el.hasAttribute(FLOAT_PLACED_ATTRIBUTE) ? this.placedFloats.get(el) : undefined;
      anchors.push({
        el,
        side: el.classList.contains("LexicalTheme__floatLeft") ? "left" : "right",
        top: (rect.top - hostRect.top) / zoom - (offset?.y ?? 0),
        left: (rect.left - hostRect.left) / zoom - (offset?.x ?? 0),
        width: rect.width / zoom,
        height: rect.height / zoom,
      });
    }
    const anchored = new Set(anchors.map(({ el }) => el));
    for (const el of this.placedFloats.keys()) {
      if (!anchored.has(el)) writes.push(() => this.releaseFloat(el));
    }
    anchors.sort((a, b) => a.top - b.top);
    const sideBottoms = new Map<string, number>();
    const placements: FloatPlacement[] = [];
    let bottom = 0;
    for (const anchor of anchors) {
      if (!this.placedFloats.has(anchor.el)) this.floatObserver?.observe(anchor.el);
      const width = Math.ceil(Math.min(anchor.width + FLOAT_GAP_X, geom.pageWidth - geom.marginLeft - geom.marginRight));
      let pageIndex = pageIndexAtY(anchor.top, geom);
      let top = anchor.top;
      let height = anchor.height + FLOAT_GAP_Y;
      for (let pages = 0; pages < 100; pages++) {
        const pageTop = pageContentTop(pageIndex, geom);
        const contentHeight = pageContentHeight(geom, pageIndex);
        // whatever is taller than a page overflows the band, as it would in print
        height = Math.min(height, contentHeight);
        top = Math.round(Math.max(top, pageTop, sideBottoms.get(`${pageIndex}:${anchor.side}`) ?? pageTop));
        if (top + height <= pageTop + contentHeight) break;
        pageIndex++;
        top = pageContentTop(pageIndex, geom);
      }
      height = Math.ceil(height);
      sideBottoms.set(`${pageIndex}:${anchor.side}`, top + height);
      placements.push({ pageIndex, side: anchor.side, top, width, height });
      bottom = Math.max(bottom, top + height);
      const left = anchor.side === "left" ? geom.marginLeft : geom.pageWidth - geom.marginRight - anchor.width;
      const offset = { x: left - anchor.left, y: top - anchor.top };
      const current = this.placedFloats.get(anchor.el);
      if (
        current === undefined ||
        !anchor.el.hasAttribute(FLOAT_PLACED_ATTRIBUTE) ||
        Math.abs(current.x - offset.x) > MARGIN_EPSILON ||
        Math.abs(current.y - offset.y) > MARGIN_EPSILON
      ) {
        writes.push(() => this.placeFloat(anchor.el, offset));
      }
    }
    const signature = placements.map((p) => `${p.pageIndex}:${p.side}:${p.top}:${p.width}:${p.height}`).join("|");
    if (signature !== this.floatSignature) {
      writes.push(() => {
        this.floatPlacements = placements;
        this.floatSignature = signature;
        this.renderFloats();
      });
    }
    return bottom;
  }

  private measureZoom(): void {
    if (this.disposed || this.geom === null) return;
    const viewport = getParentElement(this.host);
    if (!isHTMLElement(viewport)) return;
    const style = this.win.getComputedStyle(viewport);
    const padding = parseFloat(style.paddingLeft) + parseFloat(style.paddingRight) || 0;
    const zoom = computeZoom(viewport.clientWidth - padding - 2, this.geom.pageWidth);
    if (zoom !== this.zoom) {
      // a resize is outside input, like an edit
      this.resetGuard();
      this.scheduleWrites([
        () => {
          // record the zoom only once it is written, so that a write that
          // never lands leaves the next measurement free to try again
          this.zoom = zoom;
          this.host.style.setProperty("--page-zoom", String(zoom));
        },
      ]);
    }
  }

  // ---- write phase ------------------------------------------------------

  private recomputeGeometry(): void {
    if (this.pageSetup === null) return;
    this.geom = computeGeometry(this.pageSetup, this.options.gap, this.slotHeights);
    this.scheduleWrites([() => this.writeGeometry()]);
  }

  private writeGeometry(): void {
    const geom = this.geom;
    if (geom === null) return;
    const style = this.host.style;
    const px = (n: number) => `${n}px`;
    style.setProperty("--page-width", px(geom.pageWidth));
    style.setProperty("--page-height", px(geom.pageHeight));
    style.setProperty("--page-margin-top", px(geom.marginTop));
    style.setProperty("--page-margin-right", px(geom.marginRight));
    style.setProperty("--page-margin-bottom", px(geom.marginBottom));
    style.setProperty("--page-margin-left", px(geom.marginLeft));
    style.setProperty("--page-header-height", px(geom.headerHeight));
    style.setProperty("--page-footer-height", px(geom.footerHeight));
    style.setProperty("--page-gap", px(geom.gap));
    style.setProperty("--page-content-height", px(geom.contentHeight));
    style.setProperty("--page-first-top", px(geom.firstTop));
    style.setProperty("--page-count", String(this.pageCount));
    style.setProperty("--page-zoom", String(this.zoom));
    this.applyPageSizes();
    // width and zoom changed, so re-derive the fit on the next frame
    this.measureRafIds.push(this.win.requestAnimationFrame(() => this.measureZoom()));
  }

  private applyPageCount(count: number): void {
    this.recentCounts.push(count);
    if (this.recentCounts.length > 4) this.recentCounts.shift();
    const [a, b, c, d] = this.recentCounts;
    if (this.recentCounts.length === 4 && a !== b && a === c && b === d && this.pinnedCount === null) {
      // adding a break pushes content past the next boundary and removing it
      // pulls it back: settle on the larger count
      this.pinnedCount = Math.max(a, b);
      count = this.pinnedCount;
      if (IS_DEV) console.warn(`PagesLayout: page count oscillated between ${a} and ${b}; pinned to ${count}`);
    }
    const doc = this.rootElement.ownerDocument;
    while (this.breaks.length < count - 1) {
      const pageIndex = this.breaks.length + 1;
      const spacer = doc.createElement("div");
      spacer.className = PAGES_CSS.spacer;
      const footerBand = doc.createElement("div");
      footerBand.className = PAGES_CSS.break;
      footerBand.dataset.pageIndex = String(pageIndex);
      footerBand.appendChild(this.createSlot("footer", pageIndex - 1));
      const gap = doc.createElement("div");
      gap.className = PAGES_CSS.gap;
      const headerBand = doc.createElement("div");
      headerBand.className = PAGES_CSS.breakHeader;
      headerBand.appendChild(this.createSlot("header", pageIndex));
      for (const el of [spacer, footerBand, gap, headerBand]) this.layer.insertBefore(el, this.lastFooter);
      this.breaks.push({ footerBand, gap, headerBand, spacer });
    }
    const removed: PageBreakElements[] = [];
    while (this.breaks.length > Math.max(0, count - 1)) removed.push(this.breaks.pop()!);
    this.pageCount = count;
    this.host.style.setProperty("--page-count", String(count));
    this.lastFooter.dataset.pageIndex = String(count - 1);
    // released once the new page structure is in place, so that the provider
    // can move what lives in these slots to the pages that remain
    for (const { footerBand, headerBand } of removed) {
      for (const band of [footerBand, headerBand]) {
        const slot = band.firstElementChild;
        if (isHTMLElement(slot)) this.slotProvider?.releaseSlot(slot);
      }
    }
    for (const { footerBand, gap, headerBand, spacer } of removed) {
      for (const el of [spacer, footerBand, gap, headerBand]) el.remove();
    }
    this.applyPageSizes();
    this.renderFloats();
    // every slot may show the page count, so refill them all
    this.forEachSlot((slot, kind, pageIndex) => this.fillSlot(slot, kind, pageIndex));
    this.options.onPageCountChange?.(count);
  }

  /**
   * Sizes every spacer and band for the page it belongs to. Pages showing
   * different header/footer variants have different band heights, so these
   * are inline per element. Anything that spans gaps is written relative to
   * `--page-gap`, so that print can collapse the gaps without JavaScript.
   */
  private applyPageSizes(): void {
    const geom = this.geom;
    if (geom === null) return;
    const px = (n: number) => `${n}px`;
    const withGaps = (value: number, gaps: number) =>
      gaps > 0 ? `calc(${value - gaps * geom.gap}px + ${gaps} * var(--page-gap))` : px(value);
    this.firstHeader.style.height = px(geom.marginTop + slotHeight(geom, "header", 0));
    this.breaks.forEach(({ spacer, footerBand, headerBand }, i) => {
      spacer.style.height = px(pageContentHeight(geom, i));
      footerBand.style.height = px(slotHeight(geom, "footer", i) + geom.marginBottom);
      headerBand.style.height = px(geom.marginTop + slotHeight(geom, "header", i + 1));
    });
    const last = this.pageCount - 1;
    const lastContentTop = pageContentTop(last, geom);
    const lastContentBottom = lastContentTop + pageContentHeight(geom, last);
    this.lastFooter.style.top = withGaps(lastContentBottom, last);
    this.lastFooter.style.height = px(slotHeight(geom, "footer", last) + geom.marginBottom);
    this.host.style.minHeight = withGaps(lastContentBottom + slotHeight(geom, "footer", last) + geom.marginBottom, last);
    this.rootElement.style.minHeight = px(pageContentHeight(geom, 0));
  }

  /** Moves a floated element of the document by `offset` from its static position */
  private placeFloat(el: HTMLElement, offset: { x: number; y: number }): void {
    if (!el.isConnected) return;
    el.style.setProperty("--page-float-x", `${offset.x}px`);
    el.style.setProperty("--page-float-y", `${offset.y}px`);
    el.setAttribute(FLOAT_PLACED_ATTRIBUTE, "true");
    this.placedFloats.set(el, offset);
  }

  private releaseFloat(el: HTMLElement): void {
    el.style.removeProperty("--page-float-x");
    el.style.removeProperty("--page-float-y");
    el.removeAttribute(FLOAT_PLACED_ATTRIBUTE);
    this.placedFloats.delete(el);
    this.floatObserver?.unobserve(el);
  }

  /**
   * Places the stand-in floats of each page between its breaks, in place of
   * the page's spacer. Each side is a chain of floats that clear the side:
   * zero-width pads as tall as the room above the next stand-in, then the
   * stand-in, and on every page but the last a pad that ends the chain at the
   * page's content bottom, so the footer band below still lands in place. A
   * float may not sit higher than the floats before it, so both chains are
   * written in the order of their tops.
   */
  private renderFloats(): void {
    const geom = this.geom;
    for (const el of this.floatElements) el.remove();
    this.floatElements.length = 0;
    for (const { spacer } of this.breaks) spacer.style.removeProperty("display");
    if (geom === null) return;
    const byPage = new Map<number, FloatPlacement[]>();
    for (const placement of this.floatPlacements) {
      if (placement.pageIndex >= this.pageCount) continue;
      const placements = byPage.get(placement.pageIndex) ?? [];
      placements.push(placement);
      byPage.set(placement.pageIndex, placements);
    }
    const doc = this.rootElement.ownerDocument;
    type Item = { side: "left" | "right"; clear: string; top: number; width: number; height: number };
    for (const [pageIndex, placements] of byPage) {
      const isLast = pageIndex >= this.breaks.length;
      const before = isLast ? this.lastFooter : this.breaks[pageIndex].spacer;
      if (!isLast) this.breaks[pageIndex].spacer.style.display = "none";
      const pageTop = pageContentTop(pageIndex, geom);
      const pageBottom = pageTop + pageContentHeight(geom, pageIndex);
      // both chains start at the page's content top, below the header band
      const items: Item[] = [
        { side: "left", clear: "both", top: pageTop, width: 0, height: 0 },
        { side: "right", clear: "both", top: pageTop, width: 0, height: 0 },
      ];
      const reached = { left: pageTop, right: pageTop };
      for (const { side, top, width, height } of placements) {
        items.push({ side, clear: side, top: reached[side], width: 0, height: top - reached[side] });
        items.push({ side, clear: side, top, width, height });
        reached[side] = top + height;
      }
      if (!isLast) {
        for (const side of ["left", "right"] as const) {
          items.push({ side, clear: side, top: reached[side], width: 0, height: pageBottom - reached[side] });
        }
      }
      items.sort((a, b) => a.top - b.top);
      for (const item of items) {
        const el = doc.createElement("div");
        el.className = PAGES_CSS.float;
        el.style.float = item.side;
        el.style.clear = item.clear;
        el.style.width = `${item.width}px`;
        el.style.height = `${Math.max(0, item.height)}px`;
        // the layer spans the whole page, the text only the space between the margins
        if (item.width > 0) el.style.setProperty(`margin-${item.side}`, `var(--page-margin-${item.side})`);
        this.layer.insertBefore(el, before);
        this.floatElements.push(el);
      }
    }
  }

  private scheduleWrites(writes: (() => void)[]): void {
    this.pendingWrites.push(...writes);
    if (this.writeRafId !== null) return;
    this.writeRafId = this.win.requestAnimationFrame(() => {
      this.writeRafId = null;
      const queued = this.pendingWrites;
      this.pendingWrites = [];
      if (this.disposed) return;
      const now = this.win.performance.now();
      if (now - this.lastPassAt > BURST_WINDOW_MS) this.passes = 0;
      this.lastPassAt = now;
      if (++this.passes > MAX_PASSES_PER_BURST) {
        if (IS_DEV) console.warn("PagesLayout: layout did not settle; waiting for the next edit");
        this.dropped = true;
        return;
      }
      for (const write of queued) write();
      // writes that do not change the root's height leave the observer
      // silent, so always follow a write with a measurement
      this.scheduleMeasure();
    });
  }

  /**
   * Measures on a later frame: two frames, so that the browser has laid out
   * the pending DOM changes for paint and the reads do not force a layout
   */
  private scheduleMeasure(): void {
    if (this.disposed || this.measureRafIds.length > 0) return;
    const outer = this.win.requestAnimationFrame(() => {
      const inner = this.win.requestAnimationFrame(() => {
        this.measureRafIds = [];
        this.measure();
      });
      this.measureRafIds = [inner];
    });
    this.measureRafIds = [outer];
  }

  private resetGuard(): void {
    this.passes = 0;
    this.pinnedCount = null;
    this.recentCounts = [];
    if (this.dropped) {
      // the last burst gave up with writes pending; this new input is the
      // next chance to finish the layout
      this.dropped = false;
      this.scheduleMeasure();
    }
  }

  // ---- slots ------------------------------------------------------------

  private createSlot(kind: PageSlotKind, pageIndex: number): HTMLElement {
    const doc = this.rootElement.ownerDocument;
    const slot = doc.createElement("div");
    slot.className = kind === "header" ? PAGES_CSS.header : PAGES_CSS.footer;
    slot.dataset.pageSlot = kind;
    slot.dataset.pageIndex = String(pageIndex);
    const content = doc.createElement("div");
    content.className = PAGES_CSS.slotContent;
    slot.appendChild(content);
    this.fillSlot(slot, kind, pageIndex);
    return slot;
  }

  private fillSlot(slot: HTMLElement, kind: PageSlotKind, pageIndex: number): void {
    slot.dataset.pageIndex = String(pageIndex);
    this.slotProvider?.fillSlot(slot, kind, pageIndex);
  }
}
