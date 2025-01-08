import { HeadingNode } from "@/editor";
import { convertInchesToTwip, IParagraphOptions, Paragraph } from "docx";

export function $convertHeadingNode(node: HeadingNode) {
  const heading = node.getTag().replace('h', 'Heading') as IParagraphOptions['heading'];
  const alignment = node.getFormatType().replace('justify', 'both') as IParagraphOptions['alignment'];
  const indent = node.getIndent() || 0;
  return new Paragraph({ heading, alignment, indent: { left: convertInchesToTwip(indent / 2) } });
}
type Index = 1 | 2 | 3 | 4 | 5 | 6;
type HeadingMap = Record<Index, number>;
const headingSize: HeadingMap = { 1: 32 * 1.5, 2: 24 * 1.5, 3: 18.72 * 1.5, 4: 16 * 1.5, 5: 13.28 * 1.5, 6: 10.72 * 1.5 };
const headingSpacing: HeadingMap = { 1: 21.44 * 15, 2: 19.92 * 15, 3: 18.72 * 15, 4: 21.28 * 15, 5: 22.178 * 15, 6: 24.978 * 15 };
export const heading = (level: Index) => ({
  run: {
    bold: true,
    size: headingSize[level],
  },
  paragraph: {
    spacing: {
      before: headingSpacing[level],
      after: headingSpacing[level],
    },
  },
});
