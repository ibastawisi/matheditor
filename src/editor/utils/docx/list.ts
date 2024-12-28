import { $isListNode, ListNode, ListItemNode } from "@/editor";
import { AlignmentType, convertInchesToTwip, ILevelsOptions, IParagraphOptions, LevelFormat, Paragraph, ParagraphChild } from "docx";

export function $convertListItemNode(node: ListItemNode, children: ParagraphChild[]) {
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
    children,
  });
}

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
export const numbered = Array(3)
  .fill([LevelFormat.DECIMAL, LevelFormat.UPPER_LETTER, LevelFormat.LOWER_LETTER])
  .flat()
  .map((format, level) => ({
    level,
    format,
    text: `%${level + 1}.`,
    ...basicIndentStyle((level + 1) / 4),
  }));
export const bullets = Array(3)
  .fill(['●', '○', '■'])
  .flat()
  .map((text, level) => ({
    level,
    format: LevelFormat.BULLET,
    text,
    ...basicIndentStyle((level + 1) / 4),
  }));
export const unchecked = Array(3)
  .fill(['🗆', '🗆', '🗆'])
  .flat()
  .map((text, level) => ({
    level,
    text,
    ...basicIndentStyle((level + 1) / 4),
  }));
export const checked = Array(3)
  .fill(['🗹', '🗹', '🗹'])
  .flat()
  .map((text, level) => ({
    level,
    text,
    ...basicIndentStyle((level + 1) / 2),
  }));
