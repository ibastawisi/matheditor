import { HeadingNode } from "@/editor";
import { IParagraphOptions, Paragraph } from "docx";

export function $convertHeadingNode(node: HeadingNode) {
    const heading = node.getTag().replace('h', 'Heading') as IParagraphOptions['heading'];
    const alignment = node.getFormatType().replace('justify', 'both') as IParagraphOptions['alignment'];
    return new Paragraph({ heading, alignment, });
}
type Index = 1 | 2 | 3 | 4 | 5 | 6;
type HeadingMap = Record<Index, number>;
const headingSize: HeadingMap = { 1: 32 * 4 / 3, 2: 24 * 4 / 3, 3: 18.72 * 4 / 3, 4: 16 * 4 / 3, 5: 13.28 * 4 / 3, 6: 10.72 * 4 / 3 };
const headingSpacing: HeadingMap = { 1: 21.44 * 15, 2: 19.92 * 15, 3: 18.72 * 15, 4: 21.28 * 15, 5: 22.178 * 15, 6: 24.978 * 15 };
export const heading = (level: Index) => ({
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
});
