import { setDOMUnmanaged } from "lexical";

export function getImageDimensions(src: string): Promise<{ width: number; height: number }> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => {
      resolve({ width: img.width, height: img.height });
    };
    img.onerror = reject;
    img.src = src;
  });
}

const SVG_PAYLOAD_REGEX = /<!-- payload-start -->\s*(.+?)\s*<!-- payload-end -->/;

const svgCache = new Map<string, string>();
const svgFetchPromises = new Map<string, Promise<string | null>>();

export function cacheInlineSvg(src: string, svgText: string) {
  svgCache.set(src, svgText);
}

export function prefetchInlineSvg(src: string, signedUrl: string): Promise<string | null> {
  const cached = svgCache.get(src);
  if (cached !== undefined) return Promise.resolve(cached);
  const existing = svgFetchPromises.get(src);
  if (existing) return existing;
  const promise = fetch(signedUrl)
    .then((response) => (response.ok ? response.text() : null))
    .then((text) => {
      if (text !== null) svgCache.set(src, text);
      return text;
    })
    .catch(() => null)
    .finally(() => {
      svgFetchPromises.delete(src);
    });
  svgFetchPromises.set(src, promise);
  return promise;
}

/** Decodes an svg data url and strips any embedded editor payload */
export function decodeSvgDataUrl(src: string): string {
  const isBase64 = src.startsWith("data:image/svg+xml;base64");
  const data = src.slice(src.indexOf(",") + 1);
  const decoded = isBase64 ? atob(data) : decodeURIComponent(data);
  return decoded.replace(SVG_PAYLOAD_REGEX, "");
}

function populateInlineSvg(svg: SVGSVGElement, rawSvg: string, width: number, height: number) {
  const container = document.createElement("div");
  container.innerHTML = rawSvg.replace(SVG_PAYLOAD_REGEX, "").replaceAll("//dist", "");
  const parsed = container.querySelector("svg");
  if (!parsed) return;
  parsed.querySelectorAll("style").forEach((style) => style.remove());
  const viewBox = parsed.getAttribute("viewBox");
  const svgWidth = parsed.getAttribute("width");
  const svgHeight = parsed.getAttribute("height");
  svg.setAttribute("viewBox", viewBox ? viewBox : `0 0 ${svgWidth} ${svgHeight}`);
  if (width) svg.setAttribute("width", width.toString());
  else if (svgWidth) svg.setAttribute("width", svgWidth);
  if (height) svg.setAttribute("height", height.toString());
  else if (svgHeight) svg.setAttribute("height", svgHeight);
  // Move the parsed children instead of reassigning innerHTML: linkedom parses
  // innerHTML set on an svg element as HTML, leaving self-closing tags open.
  svg.replaceChildren(...parsed.childNodes);
}

/**
 * Renders an svg data url or stored svg as an inline svg element, so that it can use
 * the fonts and color scheme of the page instead of being sandboxed in an img.
 */
export function createInlineSvg(
  src: string,
  width: number,
  height: number,
  signedUrl?: string
): SVGSVGElement {
  const svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
  setDOMUnmanaged(svg as unknown as HTMLElement);
  svg.setAttribute("xmlns", "http://www.w3.org/2000/svg");
  svg.setAttribute("version", "1.1");
  if (width) svg.setAttribute("width", width.toString());
  if (height) svg.setAttribute("height", height.toString());
  if (width && height) svg.setAttribute("viewBox", `0 0 ${width} ${height}`);

  if (src.startsWith("data:image/svg+xml")) {
    populateInlineSvg(svg, decodeSvgDataUrl(src), width, height);
    return svg;
  }

  const cached = svgCache.get(src);
  if (cached !== undefined) {
    populateInlineSvg(svg, cached, width, height);
    return svg;
  }

  if (signedUrl && typeof window !== "undefined") {
    void prefetchInlineSvg(src, signedUrl).then((rawSvg) => {
      if (rawSvg) populateInlineSvg(svg, rawSvg, width, height);
    });
  }
  return svg;
}
