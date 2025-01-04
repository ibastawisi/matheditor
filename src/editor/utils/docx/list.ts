import { $isListNode, ListNode, ListItemNode } from "@/editor";
import { AlignmentType, CheckBox, convertInchesToTwip, ILevelsOptions, IParagraphOptions, LevelFormat, Paragraph, SpaceType, TextRun } from "docx";

export function $convertListItemNode(node: ListItemNode) {
  const firstChild = node.getFirstChild();
  if ($isListNode(firstChild)) return null;
  const alignment = node.getFormatType().replace('justify', 'both') as IParagraphOptions['alignment'];
  const indent = node.getIndent();
  const ListNode = node.getParent() as ListNode;
  const listKey = ListNode.getKey();
  const listType = ListNode.getListType();
  const value = listType === 'number' ? node.getValue().toString() : '1';
  const checked = node.getChecked();
  if (listType === 'check') {
    return new Paragraph({
      alignment,
      indent: { left: convertInchesToTwip(indent / 4), hanging: convertInchesToTwip(0.1) },
      children: [new CheckBox({ checked }), new TextRun({ text: ' ', })],
    });
  }
  return new Paragraph({
    alignment,
    numbering: { reference: listKey, level: indent, },
    indent: { hanging: convertInchesToTwip(0.1 + value.length * 0.1) },
  });
}

function basicIndentStyle(indent: number): Pick<ILevelsOptions, 'style' | 'alignment'> {
  return {
    alignment: AlignmentType.START,
    style: {
      paragraph: {
        indent: { left: convertInchesToTwip(indent / 2), hanging: convertInchesToTwip(0.2) },
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
