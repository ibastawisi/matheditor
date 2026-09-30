import type { LexicalNode } from "lexical";

export const CSS_TO_STYLES: Map<string, Record<string, string>> = new Map();

export function getStyleObjectFromRawCSS(css: string): Record<string, string> {
  const styleObject: Record<string, string> = {};
  if (!css) return styleObject;
  const styles = css.split(';');

  for (const style of styles) {
    if (style.trim() !== '') {
      const [key, value] = style.split(/:([^]+)/); // split on first colon
      if (!key || value === undefined) continue;
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

type StylableNode = LexicalNode & { getStyle(): string; setStyle(style: string): unknown };

const isStylableNode = (node: LexicalNode): node is StylableNode => {
  return 'getStyle' in node && 'setStyle' in node;
}

export function $getNodeStyleValueForProperty(
  node: LexicalNode,
  styleProperty: string,
  defaultValue: string = '',
): string {
  if (!isStylableNode(node)) return defaultValue;
  const css = node.getStyle();
  const styleObject = getStyleObjectFromCSS(css);
  return styleObject[styleProperty] || defaultValue;
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
