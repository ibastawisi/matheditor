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

/** Decodes an svg data url and strips any embedded editor payload */
export function decodeSvgDataUrl(src: string): string {
  const isBase64 = src.startsWith("data:image/svg+xml;base64");
  const data = src.slice(src.indexOf(",") + 1);
  const decoded = isBase64 ? atob(data) : decodeURIComponent(data);
  return decoded.replace(SVG_PAYLOAD_REGEX, "");
}

/**
 * Renders an svg data url as an inline svg element, so that it can use the
 * fonts and color scheme of the page instead of being sandboxed in an img.
 */
export function createInlineSvg(src: string, width: number, height: number): SVGSVGElement {
  const container = document.createElement("div");
  container.innerHTML = decodeSvgDataUrl(src).replaceAll("//dist", "");
  const parsed = container.querySelector("svg");
  const svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
  svg.setAttribute("xmlns", "http://www.w3.org/2000/svg");
  svg.setAttribute("version", "1.1");
  if (!parsed) return svg;
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
  svg.append(...parsed.childNodes);
  return svg;
}
