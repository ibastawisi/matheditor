/** Custom property holding the line numbers of a code block, as a CSS string for `content` */
const LINE_NUMBERS_PROPERTY = "--code-line-numbers";

/**
 * The number of rows a wrapped line takes: its fragments that start on
 * different rows. Fragments on one row may differ by a pixel, but never by
 * half their height.
 */
function countRows(rects: DOMRectList) {
  const tops = Array.from(rects, (rect) => rect.width > 0 ? rect.top : NaN).filter((top) => !isNaN(top));
  if (!tops.length) return 1;
  const threshold = Math.max(...Array.from(rects, (rect) => rect.height)) / 2;
  tops.sort((a, b) => a - b);
  let rows = 1;
  for (let i = 1; i < tops.length; i++) {
    if (tops[i] - tops[i - 1] > threshold) rows++;
  }
  return rows;
}

/**
 * The line numbers of a code block as a CSS string: one per line followed by
 * an empty row for each row the line wraps onto, so that every number stays
 * beside the start of its line. Lines are separated by `<br>`; blank lines
 * have no element of their own to number, which is why the gutter is one
 * column of text instead of a number on each line.
 */
export function measureLineNumbers(code: HTMLElement) {
  const lines: Node[][] = [[]];
  for (const child of Array.from(code.childNodes)) {
    if (child.nodeName === "BR") lines.push([]);
    else lines[lines.length - 1].push(child);
  }
  // a break at the end starts no line of its own
  if (lines.length > 1 && code.lastChild?.nodeName === "BR") lines.pop();
  const range = code.ownerDocument.createRange();
  return lines.map((nodes, index) => {
    let rows = 1;
    if (nodes.length) {
      range.setStartBefore(nodes[0]);
      range.setEndAfter(nodes[nodes.length - 1]);
      rows = countRows(range.getClientRects());
    }
    return String(index + 1) + "\\A ".repeat(rows - 1);
  }).join("\\A ");
}

/** Keeps the line numbers of code blocks in sync with their content and width */
export class CodeGutters {
  private readonly pending = new Set<HTMLElement>();
  private readonly observer: ResizeObserver | null;
  private frame = 0;

  constructor() {
    this.observer = typeof ResizeObserver !== "undefined"
      ? new ResizeObserver((entries) => entries.forEach((entry) => this.update(entry.target as HTMLElement)))
      : null;
  }

  observe(code: HTMLElement) {
    this.observer?.observe(code);
    this.update(code);
  }

  unobserve(code: HTMLElement) {
    this.observer?.unobserve(code);
    this.pending.delete(code);
  }

  /** Measures the code block before the next paint, once however often it changes */
  update(code: HTMLElement) {
    this.pending.add(code);
    this.frame ||= requestAnimationFrame(() => this.flush());
  }

  private flush() {
    this.frame = 0;
    for (const code of this.pending) {
      if (code.isConnected) code.style.setProperty(LINE_NUMBERS_PROPERTY, `"${measureLineNumbers(code)}"`);
    }
    this.pending.clear();
  }

  dispose() {
    cancelAnimationFrame(this.frame);
    this.observer?.disconnect();
    this.pending.clear();
  }
}
