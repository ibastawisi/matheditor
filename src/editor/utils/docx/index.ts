import { convertInchesToTwip, Document, FileChild, IParagraphOptions, Packer, PageBreak, Paragraph, ParagraphChild, TextRun } from "docx";
import { $getRoot, LexicalNode, $isElementNode, $isTextNode, $isParagraphNode, $isLineBreakNode } from "lexical";
import { $isCodeHighlightNode, $isCodeNode, $isHeadingNode, $isHorizontalRuleNode, $isImageNode, $isListItemNode, $isMathNode, $isPageBreakNode, $isQuoteNode, $isTableNode } from "../..";
import { $convertMathNode } from "./math";
import { $convertCodeHighlightNode, $convertCodeNode } from "./code";
import { $convertTableNode } from "./table";
import { $convertTextNode } from "./text";
import { $convertImageNode } from "./image";
import { $convertListItemNode, bullets, checked, numbered, unchecked } from "./list";
import { $convertHeadingNode, heading } from "./heading";

export function $convertEditortoDocx() {
  const root = $getRoot();
  const elements = $convertNodeToDocx(root);
  return elements as FileChild[];
}

export function $convertNodeToDocx(node: LexicalNode): FileChild | ParagraphChild | ParagraphChild[] | null {
  const element = $mapNodeToDocx(node);
  const shouldSkipChildren = $isTableNode(node);
  if (shouldSkipChildren) return element;
  const childNodes = $isElementNode(node) ? node.getChildren() : [];
  if (childNodes.length === 0) return element;
  const children = childNodes.map($convertNodeToDocx).filter(Boolean).flat() as FileChild[];
  if (!element) return children
  if (element instanceof FileChild) children.forEach((child) => element.addChildElement(child));
  return element;
}

function $mapNodeToDocx(node: LexicalNode): FileChild | ParagraphChild | ParagraphChild[] | null {
  if ($isParagraphNode(node)) {
    const alignment = node.getFormatType().replace('justify', 'both') as IParagraphOptions['alignment'];
    const indent = node.getIndent();
    return new Paragraph({ alignment, indent: { left: convertInchesToTwip(indent / 2) }, });
  }
  if ($isHeadingNode(node)) {
    return $convertHeadingNode(node);
  }
  if ($isMathNode(node)) {
    return $convertMathNode(node);
  }
  if ($isImageNode(node)) {
    return $convertImageNode(node);
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
        top: { color: 'auto', space: 1, size: 6, style: 'single', },
      },
    });
  }

  if ($isPageBreakNode(node)) {
    return new Paragraph({
      children: [new PageBreak()],
    });
  }

  if ($isQuoteNode(node)) {
    return new Paragraph({
      spacing: { after: 10 * 15 },
      border: {
        left: { size: 30, color: '#ced0d4', space: 8, style: 'single' },
        top: { space: 4, style: 'none' },
        bottom: { space: 2, style: 'none' },
      },
      indent: { left: 30 * 15 },
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

  if ($isTextNode(node)) {
    return $convertTextNode(node);
  }

  return null;
}

export async function $generateDocxBlob(): Promise<Blob> {
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
        document: {
          run: { size: "12pt", font: "Roboto", },
          paragraph: {
            spacing: { line: 20 * 15, after: 8 * 15, },
          },
        },
      },
    },
    sections: [{ children }],
    numbering: {
      config: [
        { reference: 'number-list', levels: numbered, },
        { reference: 'bullet-list', levels: bullets, },
        { reference: 'check-list', levels: unchecked, },
        { reference: 'check-list-checked', levels: checked, },
      ]
    }
  });

  const buffer = await Packer.toBuffer(doc);
  return new Blob([buffer], { type: "application/vnd.openxmlformats-officedocument.wordprocessingml.document" });
}
