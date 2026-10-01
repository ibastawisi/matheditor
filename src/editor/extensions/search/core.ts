import { effect, namedSignals, type ReadonlySignal } from "@lexical/extension";

/** Part of a match in one text fragment, in the fragment's offsets */
export interface SearchRange<T = unknown> {
  target: T;
  start: number;
  end: number;
}

export interface SearchMatch<T = unknown> {
  /** A match can span text fragments with different formats */
  ranges: SearchRange<T>[];
  /** The match and the text around it in its block, to show in the results */
  before: string;
  match: string;
  after: string;
  truncatedLeft: boolean;
  truncatedRight: boolean;
}

export interface SearchOptions {
  matchCase: boolean;
  matchWholeWord: boolean;
}

/** The text of a block, and where each of its text fragments starts in it */
export interface TextBlock<T> {
  text: string;
  fragments: { target: T; start: number; length: number }[];
}

/** Where the searched text comes from: the editor's nodes, or a static copy of the document */
export interface SearchSource<T> {
  /** The blocks of the document in order, so that a match can span the formats inside a paragraph but not a paragraph break */
  getBlocks(): TextBlock<T>[];
  /** The rendered text of part of a match, null when it is not rendered */
  toDOMRange(range: SearchRange<T>): Range | null;
}

export interface SearchActions {
  setQuery: (query: string) => void;
  setMatchCase: (value: boolean) => void;
  setMatchWholeWord: (value: boolean) => void;
  nextMatch: () => void;
  previousMatch: () => void;
  goToMatch: (index: number) => void;
  clear: () => void;
}

/** What the search panel shows and drives */
export interface SearchController {
  query: ReadonlySignal<string>;
  matchCase: ReadonlySignal<boolean>;
  matchWholeWord: ReadonlySignal<boolean>;
  matches: ReadonlySignal<SearchMatch[]>;
  activeIndex: ReadonlySignal<number>;
  actions: SearchActions;
}

const CONTEXT_LENGTH = 30;
const MAX_MATCHES = 1000;
/** The highlights' names, styled with `::highlight()` */
const MATCH_HIGHLIGHT = "search-match";
const ACTIVE_MATCH_HIGHLIGHT = "search-match-active";

const supportsHighlights = () => typeof CSS !== "undefined" && "highlights" in CSS;
const escapeRegex = (value: string) => value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

export function findMatches<T>(blocks: TextBlock<T>[], query: string, options: SearchOptions): SearchMatch<T>[] {
  if (!query) return [];
  const pattern = options.matchWholeWord ? `\\b${escapeRegex(query)}\\b` : escapeRegex(query);
  const regex = new RegExp(pattern, options.matchCase ? "g" : "gi");
  const matches: SearchMatch<T>[] = [];

  for (const { text, fragments } of blocks) {
    if (!text) continue;
    for (const m of text.matchAll(regex)) {
      const start = m.index;
      const end = start + m[0].length;
      if (end === start) continue;
      const ranges: SearchRange<T>[] = [];
      for (const fragment of fragments) {
        const fragmentEnd = fragment.start + fragment.length;
        if (fragmentEnd <= start || fragment.start >= end) continue;
        ranges.push({
          target: fragment.target,
          start: Math.max(start - fragment.start, 0),
          end: Math.min(end - fragment.start, fragment.length),
        });
      }
      if (ranges.length === 0) continue;
      const beforeStart = Math.max(0, start - CONTEXT_LENGTH);
      const afterEnd = Math.min(text.length, end + CONTEXT_LENGTH);
      matches.push({
        ranges,
        before: text.slice(beforeStart, start),
        match: m[0],
        after: text.slice(end, afterEnd),
        truncatedLeft: beforeStart > 0,
        truncatedRight: afterEnd < text.length,
      });
      if (matches.length >= MAX_MATCHES) return matches;
    }
  }
  return matches;
}

export function clearHighlights() {
  if (!supportsHighlights()) return;
  CSS.highlights.delete(MATCH_HIGHLIGHT);
  CSS.highlights.delete(ACTIVE_MATCH_HIGHLIGHT);
}

/**
 * Finds text and highlights the matches. The highlights are painted with the
 * CSS Custom Highlight API, so they follow the text through the page layout
 * and zoom without touching the document's DOM. Its owner calls `recompute`
 * when the text changes, and runs `paint` in an effect.
 */
export function createSearch<T>(source: SearchSource<T>) {
  const signals = namedSignals({
    query: "",
    matchCase: false,
    matchWholeWord: false,
    matches: [] as SearchMatch<T>[],
    activeIndex: -1,
  });

  const getDOMRanges = (match: SearchMatch<T>) =>
    match.ranges.map((range) => source.toDOMRange(range)).filter((range): range is Range => range !== null);

  const scrollToActiveMatch = () => {
    const match = signals.matches.peek()[signals.activeIndex.peek()];
    const range = match && getDOMRanges(match)[0];
    const element = range?.startContainer.parentElement;
    element?.scrollIntoView({ block: "center", behavior: "smooth" });
  };

  /** Finds the matches again, keeping the active one when it is still there */
  const recompute = () => {
    const query = signals.query.peek();
    const matches = query ? findMatches(source.getBlocks(), query, {
      matchCase: signals.matchCase.peek(),
      matchWholeWord: signals.matchWholeWord.peek(),
    }) : [];
    const activeIndex = signals.activeIndex.peek();
    signals.matches.value = matches;
    signals.activeIndex.value = matches.length === 0 ? -1 : Math.min(Math.max(activeIndex, 0), matches.length - 1);
  };

  /** Searches from the start of the document, as the query or its options changed */
  const search = () => {
    signals.activeIndex.value = 0;
    recompute();
    scrollToActiveMatch();
  };

  const goToMatch = (index: number) => {
    const count = signals.matches.peek().length;
    if (count === 0) return;
    signals.activeIndex.value = (index + count) % count;
    scrollToActiveMatch();
  };

  const actions: SearchActions = {
    setQuery: (query) => {
      if (signals.query.peek() === query) return;
      signals.query.value = query;
      search();
    },
    setMatchCase: (value) => {
      if (signals.matchCase.peek() === value) return;
      signals.matchCase.value = value;
      search();
    },
    setMatchWholeWord: (value) => {
      if (signals.matchWholeWord.peek() === value) return;
      signals.matchWholeWord.value = value;
      search();
    },
    goToMatch,
    nextMatch: () => goToMatch(signals.activeIndex.peek() + 1),
    previousMatch: () => goToMatch(signals.activeIndex.peek() - 1),
    clear: () => {
      signals.query.value = "";
      recompute();
    },
  };

  /** Paints the highlights of the matches, tracking them when run in an effect */
  const paint = () => {
    const all = signals.matches.value;
    const active = all[signals.activeIndex.value];
    if (!supportsHighlights()) return;
    if (all.length === 0) return clearHighlights();
    CSS.highlights.set(MATCH_HIGHLIGHT, new Highlight(...all.flatMap((match) => match === active ? [] : getDOMRanges(match))));
    CSS.highlights.set(ACTIVE_MATCH_HIGHLIGHT, new Highlight(...(active ? getDOMRanges(active) : [])));
  };

  /** Keeps the highlights painted until the returned function is called */
  const registerHighlights = () => {
    const dispose = effect(paint);
    return () => {
      dispose();
      clearHighlights();
    };
  };

  return { ...signals, actions, recompute, registerHighlights };
}
