import { parseHTML } from "linkedom";

const DOM_GLOBALS = ["window", "document", "DocumentFragment", "Element", "HTMLElement", "Node", "Text"] as const;

/**
 * Calls the given synchronous function with a linkedom window installed on
 * globalThis, like `withDOM` from `@lexical/headless/dom`, and restores the
 * previous globals afterwards. In the browser the function is called as is.
 */
export function withServerDOM<T>(fn: () => T): T {
  if (typeof window !== "undefined") return fn();
  const globals = globalThis as Record<string, unknown>;
  const previous = DOM_GLOBALS.map((key) => [key, globals[key]] as const);
  const dom = parseHTML("<!DOCTYPE html><html><head></head><body></body></html>") as unknown as Record<string, unknown>;
  for (const key of DOM_GLOBALS) {
    globals[key] = key === "window" ? dom.window ?? dom : dom[key];
  }
  try {
    return fn();
  } finally {
    for (const [key, value] of previous) {
      if (value === undefined) delete globals[key];
      else globals[key] = value;
    }
  }
}
