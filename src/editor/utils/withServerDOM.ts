import { parseHTML } from "linkedom";

const DOM_GLOBALS = ["window", "document", "DocumentFragment", "Element", "HTMLElement", "Node", "Text"] as const;

let styleDefaultsPatched = false;

/**
 * linkedom returns undefined for unset style properties where browsers return
 * an empty string, which makes Lexical throw when it calls string methods on
 * them, e.g. `node.style.display.startsWith` when exporting a paragraph that
 * ends in a line break. Wraps each element's style so unset properties read
 * as "" like in the browser.
 */
function patchStyleDefaults(Element: typeof globalThis.Element) {
  if (styleDefaultsPatched) return;
  styleDefaultsPatched = true;
  const descriptor = Object.getOwnPropertyDescriptor(Element.prototype, "style");
  const getStyle = descriptor?.get;
  if (!getStyle) return;
  const wrapped = new WeakMap<object, CSSStyleDeclaration>();
  Object.defineProperty(Element.prototype, "style", {
    ...descriptor,
    get(this: Element) {
      const style: CSSStyleDeclaration = getStyle.call(this);
      const cached = wrapped.get(style);
      if (cached) return cached;
      const proxy = new Proxy(style, {
        get(target, name) {
          const value = Reflect.get(target, name);
          return value === undefined && typeof name === "string" ? "" : value;
        },
      });
      wrapped.set(style, proxy);
      return proxy;
    },
  });
}

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
  patchStyleDefaults(dom.Element as typeof globalThis.Element);
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
