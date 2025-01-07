import { QuoteNode } from "@lexical/rich-text";
import { ListItemNode, ListNode } from "@lexical/list";
import { DOMExportOutput, ParagraphNode, isHTMLElement } from "lexical";
import type { HTMLConfig, Klass, LexicalEditor, LexicalNode } from "lexical";
import { LinkNode } from "@lexical/link";

export const htmlConfig: HTMLConfig = {
  export: new Map<Klass<LexicalNode>, (editor: LexicalEditor, target: LexicalNode) => DOMExportOutput>([
    [
      ParagraphNode,
      (editor, node) => {
        const paragraphNode = node as ParagraphNode;
        const output = paragraphNode.exportDOM(editor);
        const children = paragraphNode.getChildren();
        const hasDivs = children.some((child: any) => child.__caption || child.__editor);
        if (!hasDivs) return output;
        const element = output.element;
        if (!element || !isHTMLElement(element)) return output;
        const div = document.createElement("div");
        div.append(...element.childNodes);
        for (const attr of element.attributes) {
          div.setAttribute(attr.name, attr.value);
        }
        return { element: div };
      },
    ],
    [
      ListNode,
      (editor, node) => {
        const listNode = node as ListNode;
        const output = listNode.exportDOM(editor);
        const element = output.element;
        if (!element || !isHTMLElement(element)) return output;
        const direction = listNode.getDirection();
        if (direction) { element.dir = direction; }
        return { element };
      },
    ],
    [
      ListItemNode,
      (editor, node) => {
        const listItemNode = node as ListItemNode;
        const output = listItemNode.exportDOM(editor);
        const element = output.element;
        if (!element || !isHTMLElement(element)) return output;
        const direction = listItemNode.getDirection();
        if (direction) { element.dir = direction; }
        return { element };
      },
    ],
    [
      QuoteNode,
      (editor, node) => {
        const quoteNode = node as QuoteNode;
        const output = quoteNode.exportDOM(editor);
        const element = output.element;
        if (!element || !isHTMLElement(element)) return output;
        const direction = quoteNode.getDirection();
        if (direction) { element.dir = direction; }
        return { element };
      },
    ],
    [
      LinkNode,
      (editor, node) => {
        const linkNode = node as LinkNode;
        const output = linkNode.exportDOM(editor);
        const element = output.element;
        if (!element || !isHTMLElement(element)) return output;
        const url = linkNode.getURL();
        const rel = linkNode.getRel();
        if (rel) element.setAttribute('rel', rel);
        const target = linkNode.getTarget();
        if (target) element.setAttribute('target', target);
        if (target === '_self') element.setAttribute('id', url.slice(1));
        return { element };
      },
    ]
  ]),
};
