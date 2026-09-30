import { LinkNode } from "@lexical/link";
import { ListItemNode, ListNode } from "@lexical/list";
import { QuoteNode } from "@lexical/rich-text";
import {
  defineExtension,
  DOMExportOutput,
  isHTMLElement,
  Klass,
  LexicalEditor,
  LexicalNode,
  ParagraphNode,
} from "lexical";
import { $isImageNode } from "@/editor/extensions/image/nodes";
import { $isStickyNode } from "@/editor/extensions/sticky/nodes";

function defineDOMExport<T extends LexicalNode>(
  klass: Klass<T>,
  fn: (editor: LexicalEditor, node: T) => DOMExportOutput
): [Klass<LexicalNode>, (editor: LexicalEditor, node: LexicalNode) => DOMExportOutput] {
  return [klass, (editor, node) => fn(editor, node as T)];
}

function withDirection(output: DOMExportOutput, direction: string | null): DOMExportOutput {
  const element = output.element;
  if (!element || !isHTMLElement(element)) return output;
  if (direction) element.dir = direction;
  return output;
}

/** Tweaks the exported html so that it renders correctly outside of the editor */
export const HtmlExtension = defineExtension({
  name: "html",
  html: {
    export: new Map([
      defineDOMExport(ParagraphNode, (editor, node) => {
        const output = node.exportDOM(editor);
        // figures and notes are not valid children of a <p>, they would break it when the html is parsed
        const hasBlocks = node.getChildren().some((child) => $isImageNode(child) || $isStickyNode(child));
        if (!hasBlocks) return output;
        const element = output.element;
        if (!element || !isHTMLElement(element)) return output;
        const div = document.createElement("div");
        div.append(...Array.from(element.childNodes));
        for (const attr of Array.from(element.attributes)) {
          div.setAttribute(attr.name, attr.value);
        }
        return { ...output, element: div };
      }),
      defineDOMExport(ListNode, (editor, node) => withDirection(node.exportDOM(editor), node.getDirection())),
      defineDOMExport(ListItemNode, (editor, node) => {
        const output = withDirection(node.exportDOM(editor), node.getDirection());
        const element = output.element;
        if (!element || !isHTMLElement(element)) return output;
        // linkedom doesn't support the value attribute
        const value = node.getValue();
        if (value) element.setAttribute("value", value.toString());
        return output;
      }),
      defineDOMExport(QuoteNode, (editor, node) => withDirection(node.exportDOM(editor), node.getDirection())),
      defineDOMExport(LinkNode, (editor, node) => {
        const output = node.exportDOM(editor);
        const element = output.element;
        if (!element || !isHTMLElement(element)) return output;
        const url = node.getURL();
        const target = node.getTarget();
        if (target === "_self") element.setAttribute("id", url.slice(1));
        if (target !== "_blank") element.removeAttribute("target");
        element.removeAttribute("rel");
        return output;
      }),
    ]),
  },
});
