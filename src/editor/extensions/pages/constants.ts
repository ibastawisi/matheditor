import type { PageSetup, PageSize, PageSlotSetup, PageSlotVariant } from "./types";

export const PAGE_SIZES: Record<PageSize, { width: number; height: number; label: string }> = {
  A3: { height: 1587, label: 'A3 (11.69" x 16.54")', width: 1123 },
  A4: { height: 1123, label: 'A4 (8.27" x 11.69")', width: 794 },
  A5: { height: 794, label: 'A5 (5.83" x 8.27")', width: 559 },
  B4: { height: 1334, label: 'B4 (9.84" x 13.90")', width: 945 },
  B5: { height: 945, label: 'B5 (6.93" x 9.84")', width: 665 },
  Executive: { height: 1008, label: 'Executive (7.25" x 10.5")', width: 696 },
  Folio: { height: 1248, label: 'Folio (8.5" x 13")', width: 816 },
  Legal: { height: 1344, label: 'Legal (8.5" x 14")', width: 816 },
  Letter: { height: 1056, label: 'Letter (8.5" x 11")', width: 816 },
  Statement: { height: 816, label: 'Statement (5.5" x 8.5")', width: 528 },
  Tabloid: { height: 1632, label: 'Tabloid (11" x 17")', width: 1056 },
};

/** The order page sizes are offered in */
export const PAGE_SIZE_ORDER: PageSize[] = [
  "A4",
  "Letter",
  "Legal",
  "Tabloid",
  "A3",
  "A5",
  "B4",
  "B5",
  "Statement",
  "Executive",
  "Folio",
];

export const PAGE_SLOT_VARIANTS: readonly PageSlotVariant[] = ["default", "first", "even"];

export const DEFAULT_SLOT_SETUP: PageSlotSetup = {
  enabled: false,
  differentFirstPage: false,
  differentEvenPages: false,
};

export const DEFAULT_PAGE_SETUP: PageSetup = {
  pageSize: "A4",
  orientation: "portrait",
  margins: {
    top: 0.4,
    right: 0.4,
    bottom: 0.4,
    left: 0.4,
  },
  header: DEFAULT_SLOT_SETUP,
  footer: DEFAULT_SLOT_SETUP,
};

/** Pixels per CSS inch; margins are stored in inches */
export const PX_PER_INCH = 96;
/** Visual gap between two pages on screen, in CSS px */
export const PAGE_GAP = 24;
/**
 * Smallest content area a page may have, in CSS px. Guards the page count
 * against a setup whose margins (plus header and footer) exceed the page.
 */
export const MIN_CONTENT_HEIGHT = 48;
/** Narrowest content area, in CSS px, that side margins may leave */
export const MIN_CONTENT_WIDTH = 96;
/** A header or footer may take at most this fraction of the page height */
export const MAX_SLOT_HEIGHT_RATIO = 0.4;

/**
 * Tag on the document updates that write header/footer content back from the
 * nested editors, for listeners that want to tell them apart from other edits
 */
export const HEADER_FOOTER_COMMIT_TAG = "pages-header-footer-commit";
/**
 * Tag on the nested header/footer editors' own bookkeeping updates (loading
 * stored content, showing the live page number), so that they are not
 * mistaken for the user's edits and written back to the document
 */
export const SLOT_SYNC_TAG = "pages-slot-sync";
/** Debounce for writing nested header/footer edits back to the document */
export const SLOT_WRITE_BACK_DELAY_MS = 300;
