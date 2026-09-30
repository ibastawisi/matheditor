import { MIN_CONTENT_HEIGHT, MIN_CONTENT_WIDTH, PAGE_GAP, PAGE_SIZES, PX_PER_INCH } from "./constants";
import type { PageGeometry, PageSetup, PageSlotKind, PageSlotSetup, PageSlotVariant, SlotHeights } from "./types";

/**
 * Tolerance, in CSS px, when deciding whether content that ends exactly on a
 * page boundary still fits on that page, so that sub-pixel rounding does not
 * open a new empty page
 */
const BOUNDARY_EPSILON = 0.5;
/** Guards the page walks against a runaway content height */
const MAX_PAGES = 10_000;

/** Which variant the page at `pageIndex` (0-based) shows for this setup */
export function resolveSlotVariant(setup: PageSlotSetup, pageIndex: number): PageSlotVariant {
  if (setup.differentFirstPage && pageIndex === 0) return "first";
  // page numbers are 1-based, so odd indices are even pages
  if (setup.differentEvenPages && pageIndex % 2 === 1) return "even";
  return "default";
}

export function pageSizeInPixels(pageSetup: PageSetup): { width: number; height: number } {
  const size = PAGE_SIZES[pageSetup.pageSize];
  return pageSetup.orientation === "portrait"
    ? { height: size.height, width: size.width }
    : { height: size.width, width: size.height };
}

export function inchesToPixels(inches: number): number {
  return Math.round(inches * PX_PER_INCH * 10) / 10;
}

/**
 * Derives the page geometry for a page setup and the measured header/footer
 * heights.
 *
 * Vertical values are whole pixels, so that top margin + header + content +
 * footer + bottom margin is exactly the page height. The same geometry is
 * printed with the gap collapsed to zero, and a band that overshoots a printed
 * page boundary by a fraction of a pixel would be pushed to the next page.
 */
export function computeGeometry(pageSetup: PageSetup, gap: number = PAGE_GAP, slotHeights?: SlotHeights): PageGeometry {
  const { width: pageWidth, height: pageHeight } = pageSizeInPixels(pageSetup);
  let marginTop = Math.round(inchesToPixels(pageSetup.margins.top));
  let marginRight = inchesToPixels(pageSetup.margins.right);
  let marginBottom = Math.round(inchesToPixels(pageSetup.margins.bottom));
  let marginLeft = inchesToPixels(pageSetup.margins.left);
  const snapped = (values: Partial<Record<PageSlotVariant, number>>) => {
    const out: Partial<Record<PageSlotVariant, number>> = {};
    for (const [variant, height] of Object.entries(values)) {
      if (typeof height === "number") out[variant as PageSlotVariant] = Math.ceil(Math.max(0, height));
    }
    return out;
  };
  const heights: SlotHeights = {
    header: snapped(slotHeights?.header ?? {}),
    footer: snapped(slotHeights?.footer ?? {}),
  };
  const headerHeight = heights.header.default ?? 0;
  const footerHeight = heights.footer.default ?? 0;
  // margins the page cannot hold (inches know nothing of the header and footer
  // heights) shrink proportionally, so that every page still sums to the page
  // height with room for some content, and print matches the screen
  const tallest = (values: Partial<Record<PageSlotVariant, number>>) =>
    Math.max(0, ...Object.values(values).map((value) => value ?? 0));
  const verticalRoom = Math.max(0, pageHeight - MIN_CONTENT_HEIGHT - tallest(heights.header) - tallest(heights.footer));
  if (marginTop + marginBottom > verticalRoom) {
    const scale = verticalRoom / (marginTop + marginBottom);
    marginTop = Math.floor(marginTop * scale);
    marginBottom = Math.floor(marginBottom * scale);
  }
  const horizontalRoom = Math.max(0, pageWidth - MIN_CONTENT_WIDTH);
  if (marginLeft + marginRight > horizontalRoom) {
    const scale = horizontalRoom / (marginLeft + marginRight);
    marginLeft = Math.floor(marginLeft * scale * 10) / 10;
    marginRight = Math.floor(marginRight * scale * 10) / 10;
  }
  const contentHeight = Math.max(MIN_CONTENT_HEIGHT, pageHeight - marginTop - marginBottom - headerHeight - footerHeight);
  const geom: PageGeometry = {
    pageWidth,
    pageHeight,
    marginTop,
    marginRight,
    marginBottom,
    marginLeft,
    headerHeight,
    footerHeight,
    slotHeights: heights,
    headerSetup: pageSetup.header,
    footerSetup: pageSetup.footer,
    gap,
    contentHeight,
    firstTop: 0,
  };
  geom.firstTop = marginTop + slotHeight(geom, "header", 0);
  return geom;
}

/** Band height of `kind` on the page at `pageIndex` (its variant's height) */
export function slotHeight(geom: PageGeometry, kind: PageSlotKind, pageIndex: number): number {
  const setup = kind === "header" ? geom.headerSetup : geom.footerSetup;
  const heights = geom.slotHeights[kind];
  if (!setup.enabled) return heights.default ?? 0;
  const variant = resolveSlotVariant(setup, pageIndex);
  return heights[variant] ?? heights.default ?? 0;
}

/** Height of the editable area of the page at `pageIndex` */
export function pageContentHeight(geom: PageGeometry, pageIndex: number): number {
  return Math.max(
    MIN_CONTENT_HEIGHT,
    geom.pageHeight -
      geom.marginTop -
      geom.marginBottom -
      slotHeight(geom, "header", pageIndex) -
      slotHeight(geom, "footer", pageIndex)
  );
}

/**
 * Height of the band between the page at `pageIndex` and the next one: that
 * page's footer, bottom margin, gap, top margin and the next page's header
 */
export function pageBreakHeight(geom: PageGeometry, pageIndex: number): number {
  return (
    slotHeight(geom, "footer", pageIndex) +
    geom.marginBottom +
    geom.gap +
    geom.marginTop +
    slotHeight(geom, "header", pageIndex + 1)
  );
}

/** Host-relative top of the content area of the page at `pageIndex` */
export function pageContentTop(pageIndex: number, geom: PageGeometry): number {
  let top = geom.firstTop;
  for (let i = 0; i < pageIndex; i++) {
    top += pageContentHeight(geom, i) + pageBreakHeight(geom, i);
  }
  return top;
}

/**
 * Number of pages needed so that the content area of the last page reaches
 * `contentBottom` (the host-relative bottom of the editor root), when
 * `renderedBreaks` page boundaries were in place as it was measured.
 *
 * Content below the last rendered boundary has no bands in it yet, so it is
 * counted by content height alone, which makes the result exact in one pass
 * for text, however tall the bands are.
 */
export function computePageCount(
  contentBottom: number,
  geom: PageGeometry,
  renderedBreaks: number = Number.POSITIVE_INFINITY
): number {
  let top = geom.firstTop;
  for (let index = 0; index < MAX_PAGES; index++) {
    const bottom = top + pageContentHeight(geom, index);
    if (bottom + BOUNDARY_EPSILON >= contentBottom) return index + 1;
    top = index < renderedBreaks ? bottom + pageBreakHeight(geom, index) : bottom;
  }
  return MAX_PAGES;
}

/** Index of the page whose stride (content area plus the band below it) contains `y` */
export function pageIndexAtY(y: number, geom: PageGeometry): number {
  let top = geom.firstTop;
  for (let index = 0; index < MAX_PAGES; index++) {
    const nextTop = top + pageContentHeight(geom, index) + pageBreakHeight(geom, index);
    if (y < nextTop) return index;
    top = nextTop;
  }
  return MAX_PAGES;
}

/**
 * Bottom margin that pushes whatever follows a manual page break to the
 * content top of the next page. It depends only on the break's own position,
 * so re-applying it is idempotent.
 */
export function computePageBreakMarginBottom(top: number, height: number, geom: PageGeometry): number {
  const nextPage = pageIndexAtY(top, geom) + 1;
  return Math.max(0, pageContentTop(nextPage, geom) - (top + height));
}

/** Scale that fits a page of `pageWidth` into `availableWidth`, capped at 1 */
export function computeZoom(availableWidth: number, pageWidth: number): number {
  if (!(pageWidth > 0) || !(availableWidth > 0)) return 1;
  return Math.min(1, Math.round((availableWidth / pageWidth) * 1e6) / 1e6);
}
