import { convertInchesToTwip, Document, FileChild, IParagraphOptions, Packer, PageBreak, Paragraph, ParagraphChild, Table, TextRun } from "docx";
import { $getRoot, LexicalNode, $isElementNode, $isTextNode, $isParagraphNode, $isLineBreakNode } from "lexical";
import { $isCodeHighlightNode, $isCodeNode, $isDetailsContainerNode, $isHeadingNode, $isHorizontalRuleNode, $isIFrameNode, $isImageNode, $isLayoutContainerNode, $isLinkNode, $isListItemNode, $isListNode, $isMathNode, $isPageBreakNode, $isQuoteNode, $isStickyNode, $isTableNode, ListNode } from "../..";
import { $convertMathNode } from "./math";
import { $convertCodeHighlightNode, $convertCodeNode } from "./code";
import { $convertTableNode } from "./table";
import { $convertTextNode } from "./text";
import { $convertImageNode } from "./image";
import { $convertListItemNode, bullets, numbered } from "./list";
import { $convertHeadingNode, heading } from "./heading";
import { $convertLinkNode } from "./link";
import { $convertLayoutNode } from "./layout";
import { $convertIFrameNode } from "./iframe";
import { $convertStickyNode } from "./sticky";
import { $convertDetailsNode } from "./details";

const listNodes = new Map<string, ListNode>();

export function $convertEditortoDocx() {
  const root = $getRoot();
  const elements = $convertNodeToDocx(root);
  return elements as FileChild[];
}

export function $convertNodeToDocx(node: LexicalNode): FileChild | ParagraphChild | ParagraphChild[] | null {
  const element = $mapNodeToDocx(node);
  if (!$isElementNode(node)) return element;
  const childNodes = node.getChildren();
  const shouldSkipChildren = (
    $isLinkNode(node) ||
    $isTableNode(node) ||
    $isLayoutContainerNode(node) ||
    $isDetailsContainerNode(node)
  );
  if (shouldSkipChildren) return element;
  if (childNodes.length === 0) return element;
  const children = childNodes.map($convertNodeToDocx).filter(Boolean).flat() as FileChild[];
  if (!element) return children;
  const rootChildren = children.filter((child) => child instanceof Table || child instanceof Paragraph);
  const paragraphChildren = children.filter((child) => !(child instanceof Table) && !(child instanceof Paragraph));
  if (element instanceof FileChild) paragraphChildren.forEach((child) => element.addChildElement(child));
  if (Array.isArray(element)) { return [...rootChildren, ...element]; }
  if (rootChildren.length && !paragraphChildren.length) return rootChildren;
  return [...rootChildren, element];
}

function $mapNodeToDocx(node: LexicalNode): FileChild | ParagraphChild | ParagraphChild[] | null {
  if ($isParagraphNode(node)) {
    const alignment = node.getFormatType().replace('justify', 'both') as IParagraphOptions['alignment'];
    const indent = node.getIndent() || 0;
    return new Paragraph({ alignment, indent: { left: convertInchesToTwip(indent / 2) } });
  }
  if ($isHeadingNode(node)) {
    return $convertHeadingNode(node);
  }
  if ($isMathNode(node)) {
    return $convertMathNode(node);
  }
  if ($isIFrameNode(node)) {
    return $convertIFrameNode(node);
  }
  if ($isImageNode(node)) {
    return $convertImageNode(node);
  }
  if ($isListNode(node)) {
    if (node.getType() === 'check') return null;
    listNodes.set(node.getKey(), node);
    return null;
  }
  if ($isListItemNode(node)) {
    return $convertListItemNode(node);
  }

  if ($isLineBreakNode(node)) {
    return new TextRun({ text: '', break: 1 });
  }

  if ($isHorizontalRuleNode(node)) {
    return new Paragraph({
      spacing: { after: 8 * 15, line: 2 * 15, },
      border: {
        top: { color: '#cccccc', space: 1, size: 6, style: 'single', },
      },
    });
  }

  if ($isPageBreakNode(node)) {
    return new Paragraph({
      children: [new PageBreak()],
      spacing: { after: 0 },
    });
  }

  if ($isQuoteNode(node)) {
    const alignment = node.getFormatType().replace('justify', 'both') as IParagraphOptions['alignment'];
    const indent = node.getIndent() || 0;
    return new Paragraph({
      style: 'Quote',
      alignment,
      indent: { left: convertInchesToTwip(indent / 2) },
      border: {
        left: { size: 30, color: '#ced0d4', space: 8, style: 'single' },
        top: { space: 4, style: 'none' },
        bottom: { space: 2, style: 'none' },
      },
    });
  }

  if ($isCodeNode(node)) {
    return $convertCodeNode(node);
  }

  if ($isCodeHighlightNode(node)) {
    return $convertCodeHighlightNode(node);
  }

  if ($isTableNode(node)) {
    return $convertTableNode(node);
  }

  if ($isLinkNode(node)) {
    return $convertLinkNode(node);
  }

  if ($isLayoutContainerNode(node)) {
    return $convertLayoutNode(node);
  }

  if ($isStickyNode(node)) {
    return $convertStickyNode(node);
  }

  if ($isDetailsContainerNode(node)) {
    return $convertDetailsNode(node);
  }

  if ($isTextNode(node)) {
    return $convertTextNode(node);
  }

  return null;
}

export async function $generateDocxBlob(): Promise<Blob> {
  listNodes.clear();
  const children = $convertEditortoDocx();

  const doc = new Document({
    styles: {
      default: {
        heading1: heading(1),
        heading2: heading(2),
        heading3: heading(3),
        heading4: heading(4),
        heading5: heading(5),
        heading6: heading(6),
        hyperlink: {
          run: { color: '#216fdb', underline: undefined, },
        },
        document: {
          run: { size: "12pt", font: "Roboto", },
          paragraph: {
            spacing: { line: 20 * 15, after: 8 * 15, },
          },
        },
      },
      paragraphStyles: [
        {
          id: 'Quote', name: 'Quote', basedOn: 'Normal', quickFormat: true,
          run: { color: '#65676b', },
          paragraph: {
            spacing: { after: 10 * 15 },
            indent: { left: 30 * 15 },
          },
        },
      ],
    },
    sections: [{ children }],
    numbering: {
      config: [...listNodes.entries()].map(([key, node]) => (
        {
          reference: key,
          levels: (node.getListType() === 'number' ? numbered : bullets).map(level => ({
            ...level,
            start: node.getStart(),
          }))
        }
      )),

    }
  });

  const buffer = await Packer.toBuffer(doc);
  return new Blob([buffer], { type: "application/vnd.openxmlformats-officedocument.wordprocessingml.document" });
}
