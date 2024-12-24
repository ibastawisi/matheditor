import { AlignmentType, convertInchesToTwip, Document, FileChild, ILevelsOptions, ImageRun, IParagraphOptions, LevelFormat, Packer, PageBreak, Paragraph, ParagraphChild, TextRun } from "docx";
import { $getRoot, LexicalNode, $isElementNode, $isTextNode, $isParagraphNode, $isLineBreakNode } from "lexical";
import { $getNodeStyleValueForProperty } from "../../nodes/utils";
import { $isHeadingNode, $isHorizontalRuleNode, $isImageNode, $isListItemNode, $isListNode, $isMathNode, $isPageBreakNode, $isQuoteNode, ListNode } from "../..";
import { convertMathNode } from "./math";

export function $getDocxFileChildren() {
  const root = $getRoot();
  const elements = $exportNodeToDocx(root);
  return elements as FileChild[];
}

function $exportNodeToDocx(node: LexicalNode): FileChild | ParagraphChild | ParagraphChild[] | null {
  const element = $mapNodeToDocx(node);
  const childNodes = $isElementNode(node) ? node.getChildren() : [];
  if (childNodes.length === 0) return element;
  const children = childNodes.map($exportNodeToDocx).filter(Boolean).flat() as FileChild[];
  if (!element) return children
  if (element instanceof FileChild) children.forEach((child) => element.addChildElement(child));
  return element;
}

function $mapNodeToDocx(node: LexicalNode): FileChild | ParagraphChild | ParagraphChild[] | null {
  if ($isTextNode(node)) {
    const textContent = node.getTextContent();
    const parent = node.getParent();
    const isHeadingText = $isHeadingNode(parent);
    const isCheckedText = $isListItemNode(parent) && parent.getChecked();
    const isQuoteText = $isQuoteNode(parent);
    const fontsizeInPx = parseInt($getNodeStyleValueForProperty(node, 'font-size'));
    const backgroundColor = $getNodeStyleValueForProperty(node, 'background-color');
    const textRun = new TextRun({
      text: textContent,
      bold: node.hasFormat('bold') || isHeadingText,
      italics: node.hasFormat('italic'),
      strike: node.hasFormat('strikethrough') || isCheckedText,
      underline: node.hasFormat('underline') ? { type: "single" } : undefined,
      color: isQuoteText ? '#65676b' : $getNodeStyleValueForProperty(node, 'color'),
      highlight: node.hasFormat('highlight') ? 'yellow' : undefined,
      subScript: node.hasFormat('subscript'),
      superScript: node.hasFormat('superscript'),
      font: node.hasFormat('code') ? 'Monospace' : $getNodeStyleValueForProperty(node, 'font-family'),
      size: fontsizeInPx ? `${fontsizeInPx * 0.75}pt` : undefined,
      shading: backgroundColor || node.hasFormat('code') ? ({
        type: 'solid',
        color: node.hasFormat('code') ? '#F2F4F6' : backgroundColor
      }) : undefined,
    });

    return textRun;
  }
  if ($isParagraphNode(node)) {
    const alignment = node.getFormatType().replace('justify', 'both') as IParagraphOptions['alignment'];
    const indent = node.getIndent();
    return new Paragraph({
      alignment,
      indent: { left: convertInchesToTwip(indent / 2) },
    });
  }
  if ($isHeadingNode(node)) {
    const heading = node.getTag().replace('h', 'Heading') as IParagraphOptions['heading'];
    const alignment = node.getFormatType().replace('justify', 'both') as IParagraphOptions['alignment'];
    return new Paragraph({
      heading,
      alignment,
    });
  }
  if ($isMathNode(node)) {
    return convertMathNode(node);
  }

  if ($isImageNode(node)) {
    const dataURI = node.getSrc();
    const type = dataURI.split(",")[0].split(";")[0].split("/")[1].split("+")[0] as any;
    const src = dataURI.split(",")[1];
    const data = type === 'svg' ? Buffer.from(decodeURIComponent(src), 'utf-8') : Buffer.from(src, 'base64');
    const altText = node.getAltText();
    const width = node.getWidth();
    const height = node.getHeight();
    const aspect = height / width;
    const newWidth = global.Math.min(width, 600);
    const newHeight = newWidth * aspect;

    const imageRun = new ImageRun({
      type,
      data,
      altText: { title: altText, description: altText, name: altText },
      transformation: {
        width: newWidth,
        height: newHeight,
      },
      fallback: {
        type: 'png',
        data,
      },
    });
    const showCaption = node.getShowCaption();
    const caption = node.__caption;
    if (!showCaption || !caption) return imageRun;
    const captionChildren = caption.getEditorState().read($getDocxFileChildren);
    return [imageRun, ...captionChildren];
  }

  if ($isListItemNode(node)) {
    const firstChild = node.getFirstChild();
    if ($isListNode(firstChild)) return null;
    const alignment = node.getFormatType().replace('justify', 'both') as IParagraphOptions['alignment'];
    const indent = node.getIndent();
    const ListNode = node.getParent() as ListNode;
    const listType = ListNode.getListType();
    const checked = node.getChecked();
    return new Paragraph({
      alignment,
      numbering: {
        reference: `${listType}-list${listType === 'check' && checked ? '-checked' : ''}`,
        level: indent,
      },
    });
  }

  if ($isLineBreakNode(node)) {
    return new TextRun({ text: '', break: 1 });
  }

  if ($isHorizontalRuleNode(node)) {
    return new Paragraph({
      spacing: {
        after: 8 * 15,
        line: 2 * 15,
      },
      border: {
        top: {
          color: 'auto',
          space: 1,
          size: 6,
          style: 'single',
        },
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

  return null;
}

type Index = 1 | 2 | 3 | 4 | 5 | 6
type HeadingMap = Record<Index, number>

const headingSize: HeadingMap = { 1: 32 * 4 / 3, 2: 24 * 4 / 3, 3: 18.72 * 4 / 3, 4: 16 * 4 / 3, 5: 13.28 * 4 / 3, 6: 10.72 * 4 / 3 }
const headingSpacing: HeadingMap = { 1: 21.44 * 15, 2: 19.92 * 15, 3: 18.72 * 15, 4: 21.28 * 15, 5: 22.178 * 15, 6: 24.978 * 15 }

const heading = (level: Index) => ({
  run: {
    bold: true,
    size: headingSize[level],
  },
  paragraph: {
    spacing: {
      after: headingSpacing[level],
      before: headingSpacing[level],
    },
  },
})

function basicIndentStyle(indent: number): Pick<ILevelsOptions, 'style' | 'alignment'> {
  return {
    alignment: AlignmentType.START,
    style: {
      paragraph: {
        indent: { left: convertInchesToTwip(indent), hanging: convertInchesToTwip(0.18) },
      },
    },
  };
}

const numbered = Array(3)
  .fill([LevelFormat.DECIMAL, LevelFormat.UPPER_LETTER, LevelFormat.LOWER_LETTER])
  .flat()
  .map((format, level) => ({
    level,
    format,
    text: `%${level + 1}.`,
    ...basicIndentStyle((level + 1) / 4),
  }));

const bullets = Array(3)
  .fill(['●', '○', '■'])
  .flat()
  .map((text, level) => ({
    level,
    format: LevelFormat.BULLET,
    text,
    ...basicIndentStyle((level + 1) / 4),
  }));

const unchecked = Array(3)
  .fill(['🗆', '🗆', '🗆'])
  .flat()
  .map((text, level) => ({
    level,
    text,
    ...basicIndentStyle((level + 1) / 4),
  }));

const checked = Array(3)
  .fill(['🗹', '🗹', '🗹'])
  .flat()
  .map((text, level) => ({
    level,
    text,
    ...basicIndentStyle((level + 1) / 2),
  }));

export async function $generateDocxBlobFromEditor(): Promise<Blob> {
  const root = $getRoot();
  const children = $exportNodeToDocx(root) as FileChild[];
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
          run: {
            size: "12pt",
            font: "Roboto",
          },
          paragraph: {
            spacing: {
              line: 20 * 15,
              after: 8 * 15,
            },
          },
        },
      },
    },
    sections: [
      {
        children: children,
      },
    ],
    numbering: {
      config: [
        {
          reference: 'number-list',
          levels: numbered,
        },
        {
          reference: 'bullet-list',
          levels: bullets,
        },
        {
          reference: 'check-list',
          levels: unchecked,
        },
        {
          reference: 'check-list-checked',
          levels: checked,
        },
      ]
    }
  });

  const buffer = await Packer.toBuffer(doc);
  return new Blob([buffer], { type: "application/vnd.openxmlformats-officedocument.wordprocessingml.document" });
}
