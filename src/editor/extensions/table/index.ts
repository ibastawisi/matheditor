import "./index.css";
import { configExtension, defineExtension } from "@lexical/extension";
import { domOverride, DOMRenderExtension } from "@lexical/html";
import {
  getTableElement,
  TableCellNode,
  TableExtension as LexicalTableExtension,
  TableNode,
  TableRowNode,
} from "@lexical/table";
import { addClassNamesToElement, isHTMLElement, removeClassNamesFromElement } from "@lexical/utils";
import type { DOMExportOutput, EditorConfig, Klass, LexicalEditor, LexicalNode } from "lexical";
import {
  $getTableCellColor,
  $getTableCellWritingMode,
  $getTableFloat,
  colorState,
  floatState,
  writingModeState,
} from "./states";
import { $getId, idState } from "@/editor/extensions/shared/states";
import { getNodeAnchorName } from "@/editor/utils/getEditorContainer";

function defineDOMExport<T extends LexicalNode>(
  klass: Klass<T>,
  fn: (editor: LexicalEditor, node: T) => DOMExportOutput
): [Klass<LexicalNode>, (editor: LexicalEditor, node: LexicalNode) => DOMExportOutput] {
  return [klass, (editor, node) => fn(editor, node as T)];
}

function floatElement(dom: HTMLElement, config: EditorConfig, float: string) {
  const floatTheme = config.theme.float;
  if (!floatTheme) return;
  for (const format of ["left", "right"] as const) {
    const className = floatTheme[format];
    if (!className) continue;
    if (format === float) addClassNamesToElement(dom, className);
    else removeClassNamesFromElement(dom, className);
  }
}

function $decorateTableNodeDOM(node: TableNode, dom: HTMLElement, config: EditorConfig) {
  const tableElement = getTableElement(node, dom);
  const direction = node.getDirection();
  if (direction) tableElement.dir = direction;
  else tableElement.removeAttribute("dir");
  const id = $getId(node);
  if (id) tableElement.id = id;
  else tableElement.removeAttribute("id");
  // the float is applied to the scrollable wrapper so that the whole table floats
  if (dom !== tableElement) floatElement(dom, config, $getTableFloat(node));
}

function $decorateTableCellNodeDOM(node: TableCellNode, dom: HTMLElement) {
  dom.style.color = $getTableCellColor(node);
  dom.style.writingMode = $getTableCellWritingMode(node);
}

export const TableExtension = defineExtension({
  name: "table",
  dependencies: [
    configExtension(LexicalTableExtension, {
      hasCellMerge: true,
      hasCellBackgroundColor: true,
      hasTabHandler: true,
      hasHorizontalScroll: true,
      hasNestedTables: false,
    }),
    configExtension(DOMRenderExtension, {
      overrides: [
        domOverride([TableNode], {
          $decorateDOM(nextNode, _prevNode, dom, editor) {
            $decorateTableNodeDOM(nextNode, dom, editor._config);
            dom.style.setProperty("anchor-name", getNodeAnchorName(nextNode.getKey()));
          },
          $updateDOM(nextNode, prevNode, _dom, $next) {
            const float = $getTableFloat(nextNode);
            const colWidthsChanged = nextNode.getColWidths()?.join(",") !== prevNode.getColWidths()?.join(",");
            if (float !== "none" && colWidthsChanged) {
              return true;
            }
            return $next();
          },
        }),
        domOverride([TableCellNode], {
          $decorateDOM(nextNode, _prevNode, dom) {
            $decorateTableCellNodeDOM(nextNode, dom);
            dom.style.setProperty("anchor-name", getNodeAnchorName(nextNode.getKey()));
          },
        }),
      ],
    }),
  ],
  nodes: () => [TableNode, TableRowNode, TableCellNode],
  html: {
    export: new Map([
      defineDOMExport(TableNode, (editor, node) => {
        const output = node.exportDOM(editor);
        const config = editor._config;
        return {
          ...output,
          after: (element) => {
            if (output.after) element = output.after(element);
            if (!isHTMLElement(element)) return element;
            const direction = node.getDirection();
            if (direction) element.dir = direction;
            const id = $getId(node);
            if (id) element.id = id;
            element.dataset.float = $getTableFloat(node);
            // the exported element is replaced with the returned one, so the wrapper holds a clone of it
            const wrapper = document.createElement("div");
            addClassNamesToElement(wrapper, config.theme.tableScrollableWrapper);
            floatElement(wrapper, config, $getTableFloat(node));
            wrapper.appendChild(element.cloneNode(true));
            return wrapper;
          },
        };
      }),
      defineDOMExport(TableCellNode, (editor, node) => {
        const output = node.exportDOM(editor);
        const element = output.element;
        if (!isHTMLElement(element)) {
          return output;
        }
        const color = $getTableCellColor(node);
        if (color) element.dataset.color = color;
        const writingMode = $getTableCellWritingMode(node);
        if (writingMode) element.dataset.writingMode = writingMode;
        $decorateTableCellNodeDOM(node, element);
        // linkedom does not implement setting colSpan and rowSpan
        if (node.getColSpan() > 1) element.setAttribute("colspan", node.getColSpan().toString());
        if (node.getRowSpan() > 1) element.setAttribute("rowspan", node.getRowSpan().toString());
        return output;
      }),
    ]),
  },
});

export { colorState, floatState, idState, writingModeState };
