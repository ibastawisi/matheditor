import { $isListNode, ListNode, ListItemNode } from "@lexical/list";
import { CheckBox, IParagraphOptions, LevelFormat, Paragraph, TextRun } from "docx";

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
  const dir = node.getDirection();

  if (listType === 'check') {
    return new Paragraph({
      alignment,
      indent: {
        start: 20 * 15 * (indent + 1),
        hanging: 20 * 15,
      },
      bidirectional: dir === 'rtl',
      children: [new CheckBox({ checked }), new TextRun({ text: ' ', })],
    });
  }
  return new Paragraph({
    alignment,
    numbering: { reference: listKey, level: indent, },
    indent: {
      start: 12 * 15 * (indent + 1) + value.length * 8 * 15,
      hanging: 12 * 15 + value.length * 8 * 15,
    },
    bidirectional: dir === 'rtl',
  });
}


export const numbered = Array(3)
  .fill([LevelFormat.DECIMAL, LevelFormat.UPPER_LETTER, LevelFormat.LOWER_LETTER])
  .flat()
  .map((format, level) => ({
    level,
    format,
    text: `%${level + 1}.`,
  }));

export const bullets = Array(3)
  .fill(['●', '○', '■'])
  .flat()
  .map((text, level) => ({
    level,
    format: LevelFormat.BULLET,
    text,
  }));
