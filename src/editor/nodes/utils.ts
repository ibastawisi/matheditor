import { LexicalNode, type EditorConfig } from "lexical";
import { removeClassNamesFromElement, addClassNamesToElement } from "@lexical/utils";

export const CSS_TO_STYLES: Map<string, Record<string, string>> = new Map();

export function getStyleObjectFromRawCSS(css: string): Record<string, string> {
  const styleObject: Record<string, string> = {};
  if (!css) return styleObject;
  const styles = css.split(';');

  for (const style of styles) {
    if (style !== '') {
      const [key, value] = style.split(/:([^]+)/); // split on first colon
      styleObject[key.trim()] = value.trim();
    }
  }

  return styleObject;
}

export function getStyleObjectFromCSS(css: string): Record<string, string> {
  let value = CSS_TO_STYLES.get(css);
  if (value === undefined) {
    value = getStyleObjectFromRawCSS(css);
    CSS_TO_STYLES.set(css, value);
  }
  return value;
}

export function getCSSFromStyleObject(styles: Record<string, string>): string {
  let css = '';

  for (const style in styles) {
    if (style) {
      css += `${style}: ${styles[style]};`;
    }
  }

  return css;
}

export function $getNodeStyleValueForProperty(
  node: LexicalNode,
  styleProperty: string,
  defaultValue: string = '',
): string {
  if (!isStylableNode(node)) return defaultValue;
  const css = node.getStyle();
  const styleObject = getStyleObjectFromCSS(css);

  if (styleObject !== null) {
    return styleObject[styleProperty] || defaultValue;
  }

  return defaultValue;
}

export function $addNodeStyle(node: LexicalNode): void {
  if (!isStylableNode(node)) return;
  const CSSText = node.getStyle();
  const styles = getStyleObjectFromRawCSS(CSSText);
  CSS_TO_STYLES.set(CSSText, styles);
}

export function $patchNodeStyle(
  target: LexicalNode,
  patch: Record<string, string | null>,
): void {
  if (!isStylableNode(target)) return;
  const prevStyles = getStyleObjectFromCSS(target.getStyle() || '');
  const newStyles = Object.entries(patch).reduce<Record<string, string>>(
    (styles, [key, value]) => {
      if (value === null) {
        delete styles[key];
      } else {
        styles[key] = value;
      }
      return styles;
    },
    { ...prevStyles },
  );
  const newCSSText = getCSSFromStyleObject(newStyles);
  target.setStyle(newCSSText);
  CSS_TO_STYLES.set(newCSSText, newStyles);
}


export function $patchStyle(
  target: LexicalNode | LexicalNode[],
  patch: Record<string, string | null>,
): void {
  if (Array.isArray(target)) return target.forEach(node => $patchNodeStyle(node, patch));
  $patchNodeStyle(target, patch);
}

const hasGetStyle = (node: LexicalNode): node is LexicalNode & { getStyle(): string } => {
  return 'getStyle' in node;
}

const hasSetStyle = (node: LexicalNode): node is LexicalNode & { setStyle(style: string): void } => {
  return 'setStyle' in node;
}

const isStylableNode = (node: LexicalNode): node is LexicalNode & { getStyle(): string; setStyle(style: string): void } => {
  return hasGetStyle(node) && hasSetStyle(node);
}

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
export function floatWrapperElement(dom: HTMLElement, config: EditorConfig, float: string): void {
  if (!config.theme.float) {
    return;
  }
  const removeClasses: string[] = [];
  const addClasses: string[] = [];
  for (const format of ['left', 'right'] as const) {
    const classes = config.theme.float[format];
    if (!classes) {
      continue;
    }
    (format === float ? addClasses : removeClasses).push(classes);
  }
  removeClassNamesFromElement(dom, ...removeClasses);
  addClassNamesToElement(dom, ...addClasses);
}
