import { $isElementNode, $isTextNode, LexicalNode, TextNode } from "lexical";
import { $isMathNode, MathNode } from "./MathNode";

export const CSS_TO_STYLES: Map<string, Record<string, string>> = new Map();

export function getStyleObjectFromRawCSS(css: string): Record<string, string> {
  const styleObject: Record<string, string> = {};
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
  defaultValue: string,
): string {
  const css = node.getStyle();
  const styleObject = getStyleObjectFromCSS(css);

  if (styleObject !== null) {
    return styleObject[styleProperty] || defaultValue;
  }

  return defaultValue;
}

export function $addNodeStyle(node: TextNode | MathNode): void {
  const CSSText = node.getStyle();
  const styles = getStyleObjectFromRawCSS(CSSText);
  CSS_TO_STYLES.set(CSSText, styles);
}

export function $patchNodeStyle(
  target: TextNode | MathNode,
  patch: Record<string, string | null>,
): void {
  if (!('getStyle' in target)) return;
  const prevStyles = getStyleObjectFromCSS(target.getStyle());
  const newStyles = Object.entries(patch).reduce<Record<string, string>>(
    (styles, [key, value]) => {
      if (value === null) {
        delete styles[key];
      } else {
        styles[key] = value;
      }
      return styles;
    },
    { ...prevStyles } || {},
  );
  const newCSSText = getCSSFromStyleObject(newStyles);
  target.setStyle(newCSSText);
  CSS_TO_STYLES.set(newCSSText, newStyles);
}


const getStylableNodes = (nodes: LexicalNode[]): Array<TextNode | MathNode> => {
  const stylableNodes: Array<TextNode | MathNode> = [];
  for (let node of nodes) {
    if ($isTextNode(node) || $isMathNode(node)) {
      stylableNodes.push(node);
    } else if ($isElementNode(node)) {
      stylableNodes.push(...getStylableNodes(node.getChildren()));
    }
  }
  return stylableNodes;
}

export function $patchStyle(
  nodes: LexicalNode[],
  patch: Record<string, string | null>,
): void {
  getStylableNodes(nodes).forEach((node) => $patchNodeStyle(node, patch));
}
