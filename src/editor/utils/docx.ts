import { AlignmentType, convertInchesToTwip, Document, FileChild, IImageOptions, ImageRun, IParagraphOptions, Math, MathRun, Packer, Paragraph, ParagraphChild, TextRun } from "docx";
import { promises as fs } from 'fs';
import { LexicalEditor, $getRoot, LexicalNode, $isElementNode, $isTextNode, $isParagraphNode } from "lexical";
import { $getNodeStyleValueForProperty } from "../nodes/utils";
import { $isHeadingNode, $isImageNode, $isMathNode } from "..";
import RobotoLatin500 from '@fontsource/roboto/files/roboto-latin-500-normal.woff2?url';
import Virgil from '@public/excalidraw-assets/Virgil.woff2?url';

// Define the function to export a Lexical node to a DOCX element
function $exportNodeToDocx(node: LexicalNode): FileChild | ParagraphChild | null {
  // debugger;
  if ($isHeadingNode(node)) {
    const heading = node.getTag().replace('h', 'Heading') as IParagraphOptions['heading'];
    const alignment = node.getFormatType().replace('justify', 'both') as IParagraphOptions['alignment'];

    return new Paragraph({
      heading,
      alignment,
      spacing: { after: convertInchesToTwip(0.1) }
    });

  }
  if ($isParagraphNode(node)) {
    const alignment = node.getFormatType().replace('justify', 'both') as IParagraphOptions['alignment'];
    const indent = node.getIndent();
    return new Paragraph({
      alignment,
      indent: { left: convertInchesToTwip(indent / 2) },
      spacing: { after: 6 }
    });
  }

  if ($isTextNode(node)) {
    const textContent = node.getTextContent();
    const parent = node.getParent();
    const isParagraphText = $isParagraphNode(parent);
    const isHeadingText = $isHeadingNode(parent);
    const fontsizeInPx = parseInt($getNodeStyleValueForProperty(node, 'font-size'));
    const backgroundColor = $getNodeStyleValueForProperty(node, 'background-color');
    const textRun = new TextRun({
      text: textContent,
      bold: node.hasFormat('bold') || isHeadingText,
      italics: node.hasFormat('italic'),
      strike: node.hasFormat('strikethrough'),
      underline: node.hasFormat('underline') ? { type: "single" } : undefined,
      color: $getNodeStyleValueForProperty(node, 'color'),
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

  if ($isMathNode(node)) {
    const value = node.getValue();
    return new Math({ children: [new MathRun(value)] });
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

    return new ImageRun({
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

  }
  // Return null if the node type is unsupported
  return null;
}

// Generate DOCX from nodes
export async function $generateDocxFromNodes(
  editor: LexicalEditor,
): Promise<Blob> {
  const root = $getRoot();
  const topLevelChildren = root.getChildren();
  const children: FileChild[] = [];

  for (let i = 0; i < topLevelChildren.length; i++) {
    const topLevelNode = topLevelChildren[i];
    const child = $appendNodesToDocx(editor, topLevelNode) as FileChild;
    if (child) children.push(child);
  }
  // const RobotoBuffer = await fs.readFile(process.cwd() + "/.next" + RobotoLatin500);
  // const VirgilBuffer = await fs.readFile(process.cwd() + "/.next" + Virgil);
  // debugger;
  const doc = new Document({

    styles: {
      default: {
        heading1: {
          run: {
            size: 28,
          },
          paragraph: {
            spacing: {
              after: 120,
            },
          },
        },
        heading2: {
          run: {
            size: 26,
          },
          paragraph: {
            spacing: {
              before: 240,
              after: 120,
            },
          },
        },
        heading3: {
          run: {
            size: 24,
          },
          paragraph: {
            spacing: {
              before: 240,
              after: 120,
            },
          },
        },
        heading4: {
          run: {
            size: 22,
          },
          paragraph: {
            spacing: {
              before: 240,
              after: 120,
            },
          },
        },
        heading5: {
          run: {
            size: 20,
          },
          paragraph: {
            spacing: {
              before: 240,
              after: 120,
            },
          },
        },
        heading6: {
          run: {
            size: 18,
          },
          paragraph: {
            spacing: {
              before: 240,
              after: 120,
            },
          },
        },
        document: {
          run: {
            size: "12pt",
            font: "Roboto",
          },
          paragraph: {
            spacing: {
              line: 276,
            },
          },
        },
      },
    },
    sections: [
      {
        properties: {},
        children: children,
      },
    ],
    // fonts: [
    //   {
    //     name: 'Roboto',
    //     data: RobotoBuffer,
    //     characterSet: '00'
    //   },
    //   {
    //     name: 'Virgil',
    //     data: VirgilBuffer,
    //     characterSet: '00'
    //   },
    // ],
  });

  const buffer = await Packer.toBuffer(doc);
  return new Blob([buffer], { type: "application/vnd.openxmlformats-officedocument.wordprocessingml.document" });
}

// Modify the $appendNodesToDocx function to use $exportNodeToDocx
function $appendNodesToDocx(
  editor: LexicalEditor,
  node: LexicalNode,
) {
  const element = $exportNodeToDocx(node);

  if (!element) return false;
  // debugger;
  if (element instanceof Paragraph) {
    const children = $isElementNode(node) ? node.getChildren() : [];

    for (let i = 0; i < children.length; i++) {
      const childNode = children[i];
      const child = $appendNodesToDocx(editor, childNode) as any;
      if (child) element.addChildElement(child);
    }
  }


  return element;
}