import { $getRoot, $isElementNode, $isTextNode, GridSelection, LexicalEditor, LexicalNode, NodeSelection, RangeSelection, RootNode } from "lexical";
import {
  $cloneWithProperties,
  $sliceSelectedTextNodeContent,
} from '@lexical/selection';

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

export function $addNodeStyle(node: LexicalNode): void {
  const CSSText = node.getStyle();
  const styles = getStyleObjectFromRawCSS(CSSText);
  CSS_TO_STYLES.set(CSSText, styles);
}

export function $patchNodeStyle(
  target: LexicalNode,
  patch: Record<string, string | null>,
): void {
  if (!('getStyle' in target)) return;
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
    { ...prevStyles } || {},
  );
  const newCSSText = getCSSFromStyleObject(newStyles);
  target.setStyle(newCSSText);
  CSS_TO_STYLES.set(newCSSText, newStyles);
}


const getStylableNodes = (nodes: LexicalNode[]): LexicalNode[] => {
  const stylableNodes: LexicalNode[] = [];
  for (let node of nodes) {
    if ('getStyle' in node) {
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

export function $generateHtmlFromNodes(
  editor: LexicalEditor,
  selection?: RangeSelection | NodeSelection | GridSelection | null,
): string {
  if (typeof document === 'undefined' || typeof window === 'undefined') {
    throw new Error(
      'To use $generateHtmlFromNodes in headless mode please initialize a headless browser implementation such as JSDom before calling this function.',
    );
  }

  const container = document.createElement('div');
  editor.getEditorState().read(() => {
    const root = $getRoot();
    const topLevelChildren = root.getChildren();
    for (let i = 0; i < topLevelChildren.length; i++) {
      const topLevelNode = topLevelChildren[i];
      $appendNodesToHTML(editor, topLevelNode, container, selection);
    }
  });
  return container.innerHTML;
}

function $appendNodesToHTML(
  editor: LexicalEditor,
  currentNode: LexicalNode,
  parentElement: HTMLElement | DocumentFragment,
  selection: RangeSelection | NodeSelection | GridSelection | null = null,
): boolean {
  let shouldInclude =
    selection != null ? currentNode.isSelected(selection) : true;
  const shouldExclude =
    $isElementNode(currentNode) && currentNode.excludeFromCopy('html');
  let target = currentNode;

  if (selection !== null) {
    let clone = $cloneWithProperties<LexicalNode>(currentNode);
    clone =
      $isTextNode(clone) && selection != null
        ? $sliceSelectedTextNodeContent(selection, clone)
        : clone;
    target = clone;
  }
  const children = $isElementNode(target) ? target.getChildren() : [];
  const { element, after } = target.exportDOM(editor);

  if (!element) {
    return false;
  }

  const fragment = document.createDocumentFragment();

  for (let i = 0; i < children.length; i++) {
    const childNode = children[i];
    const shouldIncludeChild = $appendNodesToHTML(
      editor,
      childNode,
      fragment,
      selection,
    );

    if (
      !shouldInclude &&
      $isElementNode(currentNode) &&
      shouldIncludeChild &&
      currentNode.extractWithChild(childNode, selection, 'html')
    ) {
      shouldInclude = true;
    }
  }

  if (shouldInclude && !shouldExclude) {
    element.append(fragment);
    parentElement.append(element);

    if (after) {
      const newElement = after.call(target, element);
      if (newElement) element.replaceWith(newElement);
    }
  } else {
    parentElement.append(fragment);
  }

  return shouldInclude;
}
