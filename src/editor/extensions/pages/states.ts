import {
  $getRoot,
  $getState,
  $setState,
  createState,
  type NodeStateVersion,
  type SerializedEditorState,
  type StateConfig,
  type StateValueOrUpdater,
} from "lexical";

import { DEFAULT_PAGE_SETUP, DEFAULT_SLOT_SETUP, PAGE_SIZES, PAGE_SLOT_VARIANTS } from "./constants";
import type {
  Orientation,
  PageSetup,
  PageSize,
  PageSlotContent,
  PageSlotKind,
  PageSlotSetup,
  PageSlotVariant,
} from "./types";

export function marginsIsEqual(a: PageSetup["margins"], b: PageSetup["margins"]) {
  return a.bottom === b.bottom && a.left === b.left && a.right === b.right && a.top === b.top;
}

export function slotSetupIsEqual(a: PageSlotSetup, b: PageSlotSetup) {
  return (
    a === b ||
    (a.enabled === b.enabled &&
      a.differentFirstPage === b.differentFirstPage &&
      a.differentEvenPages === b.differentEvenPages)
  );
}

function parseSlotSetup(v: unknown): PageSlotSetup {
  if (v && typeof v === "object" && !Array.isArray(v)) {
    const o = v as Record<string, unknown>;
    return {
      enabled: o.enabled === true,
      differentFirstPage: o.differentFirstPage === true,
      differentEvenPages: o.differentEvenPages === true,
    };
  }
  return DEFAULT_SLOT_SETUP;
}

function parsePageSize(v: unknown): PageSize {
  if (typeof v === "string" && v in PAGE_SIZES) {
    return v as PageSize;
  }
  return DEFAULT_PAGE_SETUP.pageSize;
}

function parseOrientation(v: unknown): Orientation {
  return v === "landscape" || v === "portrait" ? v : DEFAULT_PAGE_SETUP.orientation;
}

function parseMargins(v: unknown): PageSetup["margins"] {
  if (v && typeof v === "object" && !Array.isArray(v)) {
    const margins = structuredClone(DEFAULT_PAGE_SETUP.margins);
    const o = v as Record<string, unknown>;
    for (const k of ["top", "right", "bottom", "left"] as const) {
      const value = o[k];
      if (typeof value === "number" && Number.isFinite(value)) {
        margins[k] = Math.max(0, value);
      }
    }
    return margins;
  }
  return DEFAULT_PAGE_SETUP.margins;
}

/**
 * The page setup of the document, stored on the RootNode. `null` means the
 * document is pageless, which is how documents without the state load.
 */
export const pageSetupState = createState("pageSetup", {
  isEqual: (a: null | PageSetup, b: null | PageSetup) =>
    a === b ||
    (a != null &&
      b != null &&
      a.pageSize === b.pageSize &&
      a.orientation === b.orientation &&
      (a.margins === b.margins || marginsIsEqual(a.margins, b.margins)) &&
      slotSetupIsEqual(a.header, b.header) &&
      slotSetupIsEqual(a.footer, b.footer)),
  parse: (v): PageSetup | null => {
    if (v && typeof v === "object" && !Array.isArray(v)) {
      const obj: { [k in string]?: unknown } = v;
      return {
        pageSize: parsePageSize(obj.pageSize),
        orientation: parseOrientation(obj.orientation),
        margins: parseMargins(obj.margins),
        header: parseSlotSetup(obj.header),
        footer: parseSlotSetup(obj.footer),
      };
    }
    return null;
  },
});

export function $getPageSetup(version?: NodeStateVersion): PageSetup | null {
  return $getState($getRoot(), pageSetupState, version);
}

export function $setPageSetup(pageSetup: StateValueOrUpdater<typeof pageSetupState>): void {
  $setState($getRoot(), pageSetupState, pageSetup);
}

function isSerializedEditorState(v: unknown): v is SerializedEditorState {
  return typeof v === "object" && v !== null && !Array.isArray(v) && "root" in v;
}

/**
 * Accepts `{default?, first?, even?}` where each value is a serialized editor
 * state or null; anything else parses to `null`.
 */
function parseSlotContent(v: unknown): PageSlotContent | null {
  if (typeof v !== "object" || v === null || Array.isArray(v)) {
    return null;
  }
  const result: PageSlotContent = {};
  let any = false;
  for (const variant of PAGE_SLOT_VARIANTS) {
    const value = (v as Record<string, unknown>)[variant];
    if (value === null || isSerializedEditorState(value)) {
      result[variant] = value;
      any = true;
    }
  }
  return any ? result : null;
}

function slotContentIsEqual(a: PageSlotContent | null, b: PageSlotContent | null): boolean {
  return a === b || (a !== null && b !== null && JSON.stringify(a) === JSON.stringify(b));
}

export const pageHeaderState = createState("pageHeader", {
  isEqual: slotContentIsEqual,
  parse: parseSlotContent,
});

export const pageFooterState = createState("pageFooter", {
  isEqual: slotContentIsEqual,
  parse: parseSlotContent,
});

export function slotStateFor(kind: PageSlotKind): StateConfig<string, PageSlotContent | null> {
  return kind === "header" ? pageHeaderState : pageFooterState;
}

export function $getPageSlotContent(kind: PageSlotKind): PageSlotContent | null {
  return $getState($getRoot(), slotStateFor(kind));
}

/** Stores one variant of a header or footer; `null` clears that variant */
export function $setPageSlotContent(
  kind: PageSlotKind,
  variant: PageSlotVariant,
  content: SerializedEditorState | null
): void {
  $setState($getRoot(), slotStateFor(kind), (prev) => ({ ...(prev ?? {}), [variant]: content }));
}
