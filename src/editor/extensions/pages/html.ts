import { pageSetupState } from "./states";
import type { PageSetup, PageSlotKind, PageSlotVariant } from "./types";

/**
 * The HTML of a paged document leads with inert templates that describe its
 * pages: one with the page setup, and one per header or footer variant with
 * its HTML. Readers that know nothing of pages ignore them, and the static
 * page view lays the document out from them.
 */
export const PAGE_SETUP_ATTRIBUTE = "data-page-setup";
export const PAGE_SLOT_ATTRIBUTE = "data-page-slot";
export const PAGE_VARIANT_ATTRIBUTE = "data-page-variant";

export interface PageSlotHtml {
  kind: PageSlotKind;
  variant: PageSlotVariant;
  html: string;
}

function escapeAttribute(value: string): string {
  return value.replace(/&/g, "&amp;").replace(/"/g, "&quot;").replace(/</g, "&lt;");
}

function unescapeAttribute(value: string): string {
  return value.replace(/&quot;/g, '"').replace(/&lt;/g, "<").replace(/&gt;/g, ">").replace(/&amp;/g, "&");
}

/** The templates that lead the HTML of a paged document */
export function generatePagesHtml(pageSetup: PageSetup, slots: PageSlotHtml[]): string {
  const setup = `<template ${PAGE_SETUP_ATTRIBUTE}="${escapeAttribute(JSON.stringify(pageSetup))}"></template>`;
  return setup + slots
    .map(({ kind, variant, html }) =>
      `<template ${PAGE_SLOT_ATTRIBUTE}="${kind}" ${PAGE_VARIANT_ATTRIBUTE}="${variant}">${html}</template>`)
    .join("");
}

const PAGE_SETUP_PATTERN = new RegExp(`^\\s*<template ${PAGE_SETUP_ATTRIBUTE}="([^"]*)"`);

/**
 * The page setup of a document's HTML, or null if it is pageless. A string
 * match, so that the server renders the same page frame as the browser.
 */
export function parsePageSetupFromHtml(html: string): PageSetup | null {
  const match = PAGE_SETUP_PATTERN.exec(html);
  if (!match) return null;
  try {
    return pageSetupState.parse(JSON.parse(unescapeAttribute(match[1])));
  } catch {
    return null;
  }
}
