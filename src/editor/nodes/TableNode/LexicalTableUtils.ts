import { getStyleObjectFromCSS } from "../utils";
import { TableCellNode } from "./LexicalTableCellNode";

/**
 * Gets the CSS styles from the style object.
 * @param styles - The style object containing the styles to get.
 * @returns A string containing the CSS styles and their values.
 */
export function getCSSFromStyleObject(styles: Record<string, string>): string {
  let css = '';

  for (const style in styles) {
    if (style) {
      css += `${style}: ${styles[style]};`;
    }
  }

  return css;
}

/**
 * Applies the provided styles to the provided TableCellNodes.
 * @param nodes - The selected node(s) to update.
 * @param patch - The patch to apply, which can include multiple styles. { CSSProperty: value }
 */

export function $patchCellStyle(
  nodes: TableCellNode[],
  patch: Record<string, string | null>,
): void {
  for (const node of nodes) {
    const cssText = node.getStyle();
    const prevStyles = getStyleObjectFromCSS(cssText || '');
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
    node.setStyle(newCSSText);
  }
}
