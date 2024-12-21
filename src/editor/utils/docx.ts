import { Document, FileChild, IParagraphOptions, Math, MathRun, Packer, Paragraph, ParagraphChild, TextRun } from "docx";
import { LexicalEditor, $getRoot, LexicalNode, $isElementNode, $isTextNode, $isParagraphNode } from "lexical";
import { $getNodeStyleValueForProperty } from "../nodes/utils";
import { $isHeadingNode, $isMathNode } from "..";

// Define the function to export a Lexical node to a DOCX element
function $exportNodeToDocx(node: LexicalNode): FileChild | ParagraphChild | null {
  // debugger;
  if ($isHeadingNode(node)) {
    const level = node.getTag().replace('h', 'Heading') as IParagraphOptions['heading'];

    return new Paragraph({ children: [], heading: level });
  }
  if ($isParagraphNode(node)) {
    return new Paragraph({ children: [] });
  }

  if ($isTextNode(node)) {
    const textContent = node.getTextContent();
    const textRun = new TextRun({
      text: textContent,
      bold: node.hasFormat('bold'),
      italics: node.hasFormat('italic'),
      strike: node.hasFormat('strikethrough'),
      underline: node.hasFormat('underline') ? { type: "single" } : undefined,
      color: $getNodeStyleValueForProperty(node, 'color'),
      highlight: node.hasFormat('highlight') ? 'yellow' : undefined,
      subScript: node.hasFormat('subscript'),
      superScript: node.hasFormat('superscript'),
      font: $getNodeStyleValueForProperty(node, 'font-family', 'Roboto'),
    });

    return textRun;
  }

  if ($isMathNode(node)) {
    const value = node.getValue();
    return new Math({ children: [new MathRun(value)] });
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

  const doc = new Document({
    sections: [
      {
        properties: {},
        children: children,
      },
    ],
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

  if (!element) {
    return false;
  }

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