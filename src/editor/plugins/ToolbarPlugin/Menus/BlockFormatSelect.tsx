"use client"
import type { LexicalEditor } from 'lexical';
import { $createCodeNode } from '@lexical/code';
import { INSERT_CHECK_LIST_COMMAND, INSERT_ORDERED_LIST_COMMAND, INSERT_UNORDERED_LIST_COMMAND } from '@lexical/list';
import { $createHeadingNode, $createQuoteNode, HeadingTagType, } from '@lexical/rich-text';
import { $setBlocksType } from '@lexical/selection';
import { $createParagraphNode, $getSelection, $isRangeSelection } from 'lexical';

import { Select, MenuItem, ListItemIcon, ListItemText, SvgIcon } from '@mui/material';
import { ViewHeadline, FormatListBulleted, FormatListNumbered, PlaylistAddCheck, FormatQuote, Code } from '@mui/icons-material';
import { $isTableSelection } from '@/editor/nodes/TableNode';

const H1 = () => <SvgIcon viewBox='0 96 960 960' fontSize='small'>
  <path xmlns="http://www.w3.org/2000/svg" d="M200 776V376h60v170h180V376h60v400h-60V606H260v170h-60Zm500 0V436h-80v-60h140v400h-60Z" />
</SvgIcon>;
const H2 = () => <SvgIcon viewBox='0 96 960 960' fontSize='small'>
  <path xmlns="http://www.w3.org/2000/svg" d="M120 776V376h60v170h180V376h60v400h-60V606H180v170h-60Zm420 0V606q0-24.75 17.625-42.375T600 546h180V436H540v-60h240q25 0 42.5 17.625T840 436v110q0 24.75-17.625 42.375T780 606H600v110h240v60H540Z" />
</SvgIcon>;
const H3 = () => <SvgIcon viewBox='0 96 960 960' fontSize='small'>
  <path xmlns="http://www.w3.org/2000/svg" d="M120 776V376h60v170h180V376h60v400h-60V606H180v170h-60Zm420 0v-60h240V606H620v-60h160V436H540v-60h240q25 0 42.5 17.625T840 436v280q0 24.75-17.625 42.375T780 776H540Z" />
</SvgIcon>;
const H4 = () => <SvgIcon viewBox='0 96 960 960' fontSize='small'>
  <path xmlns="http://www.w3.org/2000/svg" d="M120 776V376h60v170h180V376h60v400h-60V606H180v170h-60Zm620 0V646H540V376h60v210h140V376h60v210h80v60h-80v130h-60Z" />
</SvgIcon>;

const blockTypeToBlockName = {
  bullet: 'Bulleted List',
  check: 'Check List',
  code: 'Code Block',
  quote: 'Quote',
  h1: 'Heading 1',
  h2: 'Heading 2',
  h3: 'Heading 3',
  h4: 'Heading 4',
  number: 'Numbered List',
  paragraph: 'Normal',
};

export function BlockFormatSelect({ editor, blockType }: {
  blockType: keyof typeof blockTypeToBlockName;
  editor: LexicalEditor;
}): JSX.Element {
  const formatParagraph = () => {
    editor.update(() => {
      const selection = $getSelection();
      if (
        $isRangeSelection(selection) ||
        $isTableSelection(selection)
      ) {
        $setBlocksType(selection as any, () => $createParagraphNode());
      }
    });
  };

  const formatHeading = (headingSize: HeadingTagType) => {
    if (blockType !== headingSize) {
      editor.update(() => {
        const selection = $getSelection();
        if (
          $isRangeSelection(selection) ||
          $isTableSelection(selection)
        ) {
          $setBlocksType(selection as any, () => $createHeadingNode(headingSize));
        }
      });
    }
  };

  const formatBulletList = () => {
    if (blockType !== 'bullet') {
      editor.dispatchCommand(INSERT_UNORDERED_LIST_COMMAND, undefined);
    } else {
      formatParagraph();
    }
  };

  const formatCheckList = () => {
    if (blockType !== 'check') {
      editor.dispatchCommand(INSERT_CHECK_LIST_COMMAND, undefined);
    } else {
      formatParagraph();
    }
  };

  const formatNumberedList = () => {
    if (blockType !== 'number') {
      editor.dispatchCommand(INSERT_ORDERED_LIST_COMMAND, undefined);
    } else {
      formatParagraph();
    }
  };

  const formatQuote = () => {
    if (blockType !== 'quote') {
      editor.update(() => {
        const selection = $getSelection();
        if (
          $isRangeSelection(selection) ||
          $isTableSelection(selection)
        ) {
          $setBlocksType(selection as any, () => $createQuoteNode());
        }
      });
    }
  };

  const formatCode = () => {
    if (blockType !== 'code') {
      editor.update(() => {
        let selection = $getSelection();

        if (
          $isRangeSelection(selection) ||
          $isTableSelection(selection)
        ) {
          if (selection.isCollapsed()) {
            $setBlocksType(selection as any, () => $createCodeNode());
          } else {
            const textContent = selection.getTextContent();
            const codeNode = $createCodeNode();
            selection.insertNodes([codeNode]);
            selection = $getSelection();
            if ($isRangeSelection(selection))
              selection.insertRawText(textContent);
          }
        }
      });
    }
  };

  return (
    <Select value={blockType} aria-label="Formatting options for text style" size='small' sx={{
      '& .MuiSelect-select': { display: 'flex !important', alignItems: 'center', py: 0.5 },
      '& .MuiListItemIcon-root': { mr: { md: 0.5 }, minWidth: 20 },
      '& .MuiListItemText-root': { display: { xs: "none", md: "flex" } }
    }}>
      <MenuItem value='paragraph' onClick={formatParagraph}>
        <ListItemIcon>
          <ViewHeadline fontSize="small" />
        </ListItemIcon>
        <ListItemText>Normal</ListItemText>
      </MenuItem>
      <MenuItem value='h1' onClick={() => formatHeading('h1')}>
        <ListItemIcon>
          <H1 />
        </ListItemIcon>
        <ListItemText>Heading 1</ListItemText>
      </MenuItem>
      <MenuItem value='h2' onClick={() => formatHeading('h2')}>
        <ListItemIcon>
          <H2 />
        </ListItemIcon>
        <ListItemText>Heading 2</ListItemText>
      </MenuItem>
      <MenuItem value='h3' onClick={() => formatHeading('h3')}>
        <ListItemIcon>
          <H3 />
        </ListItemIcon>
        <ListItemText>Heading 3</ListItemText>
      </MenuItem>
      <MenuItem value='h4' onClick={() => formatHeading('h4')}>
        <ListItemIcon>
          <H4 />
        </ListItemIcon>
        <ListItemText>Heading 4</ListItemText>
      </MenuItem>
      <MenuItem value='bullet' onClick={formatBulletList}>
        <ListItemIcon>
          <FormatListBulleted fontSize="small" />
        </ListItemIcon>
        <ListItemText>Bullet List</ListItemText>
      </MenuItem>
      <MenuItem value='number' onClick={formatNumberedList}>
        <ListItemIcon>
          <FormatListNumbered fontSize="small" />
        </ListItemIcon>
        <ListItemText>Numbered List</ListItemText>
      </MenuItem>
      <MenuItem value='check' onClick={formatCheckList}>
        <ListItemIcon>
          <PlaylistAddCheck fontSize="small" />
        </ListItemIcon>
        <ListItemText>Check List</ListItemText>
      </MenuItem>
      <MenuItem value='quote' onClick={formatQuote}>
        <ListItemIcon>
          <FormatQuote fontSize="small" />
        </ListItemIcon>
        <ListItemText>Quote</ListItemText>
      </MenuItem>
      <MenuItem value='code' onClick={formatCode}>
        <ListItemIcon>
          <Code fontSize="small" />
        </ListItemIcon>
        <ListItemText>CodeBlock</ListItemText>
      </MenuItem>
    </Select>
  );
}
