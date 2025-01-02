import { ParagraphChild, Table, IParagraphOptions, Paragraph, convertInchesToTwip } from "docx";
import { ParagraphNode } from "lexical";
import { $convertNodeToDocx } from ".";


export function $spreadChildrenOut(node: ParagraphNode) {
  const children = node.getChildren().map($convertNodeToDocx).filter(Boolean).flat() as (ParagraphChild | Table)[];
  const alignment = node.getFormatType().replace('justify', 'both') as IParagraphOptions['alignment'];
  const indent = node.getIndent();
  const hasTables = children.some(child => child instanceof Table);
  if (!hasTables) return new Paragraph({ children, alignment, indent: { left: convertInchesToTwip(indent / 2) } });
  const grouppedChildren = children.reduce((acc, child) => {
    if (child instanceof Table) acc.push(child);
    else {
      const lastChild = acc[acc.length - 1] || [];
      if (lastChild instanceof Table) acc.push([child]);
      else acc[(acc.length || 1) - 1] = [...lastChild, child];
    }
    return acc;
  }, [] as (ParagraphChild[] | Table)[]);

  const rootChildren = grouppedChildren.map((children) => {
    if (children instanceof Table) return children;
    return new Paragraph({ children, spacing: { after: 0 }, alignment, indent: { left: convertInchesToTwip(indent / 2) } });
  });

  return rootChildren;
}
