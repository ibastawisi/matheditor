"use client"
import { $createCodeNode, CodeNode } from '@lexical/code-core';
import { INSERT_CHECK_LIST_COMMAND, INSERT_ORDERED_LIST_COMMAND, INSERT_UNORDERED_LIST_COMMAND, ListItemNode, ListNode } from '@lexical/list';
import { useLexicalComposerContext } from '@lexical/react/LexicalComposerContext';
import { $createHeadingNode, $createQuoteNode, HeadingNode, HeadingTagType, QuoteNode } from '@lexical/rich-text';
import { $setBlocksType } from '@lexical/selection';
import { $isTableSelection } from '@lexical/table';
import { $createParagraphNode, $getSelection, $isRangeSelection } from 'lexical';

import { Select, MenuItem, ListItemIcon, ListItemText } from '@mui/material';
import { ViewHeadline, FormatListBulleted, FormatListNumbered, PlaylistAddCheck, FormatQuote, Code } from '@mui/icons-material';
import { useCallback } from 'react';
import { useStore } from '@/editor/extensions/store/hooks';
import { blockTypeToBlockName } from '@/editor/extensions/store/constants';
import { H1Icon as H1, H2Icon as H2, H3Icon as H3, H4Icon as H4 } from '@/editor/extensions/shared/icons';
import { restoreFocus } from '@/editor/utils/restoreFocus';

export function BlockFormatSelect() {
  const [editor] = useLexicalComposerContext();
  const [blockType] = useStore("blockType");
  // a page header registers fewer block types than the document
  const hasHeadings = editor.hasNodes([HeadingNode]);
  const hasLists = editor.hasNodes([ListNode, ListItemNode]);
  const hasQuote = editor.hasNodes([QuoteNode]);
  const hasCode = editor.hasNodes([CodeNode]);

  const formatParagraph = () => {
    editor.update(() => {
      const selection = $getSelection();
      if (
        $isRangeSelection(selection) ||
        $isTableSelection(selection)
      ) {
        $setBlocksType(selection, () => $createParagraphNode());
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
          $setBlocksType(selection, () => $createHeadingNode(headingSize));
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
          $setBlocksType(selection, () => $createQuoteNode());
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
            $setBlocksType(selection, () => $createCodeNode());
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

  const handleClose = useCallback(() => {
    setTimeout(() => restoreFocus(editor), 0);
  }, [editor]);

  if (!(blockType in blockTypeToBlockName)) return null;

  return (
    <Select value={blockType} size='small'
      onClose={handleClose} sx={{
        fieldset: { borderColor: 'divider' },
        '& .MuiSelect-select': { display: 'flex !important', alignItems: 'center', pl: 1, pr: '28px !important', py: 1, minHeight: '0 !important', height: '20px !important' },
        '& .MuiSelect-icon': { m: 0, fontSize: 20 },
        '& .MuiListItemIcon-root': { mr: { sm: 0.5 }, minWidth: 20 },
        '& .MuiListItemText-root': { display: { xs: "none", sm: "flex" } },
        '&:hover .MuiOutlinedInput-notchedOutline': { borderColor: 'primary.main' },
      }}
      MenuProps={{
        slotProps: {
          root: { sx: { '& .MuiBackdrop-root': { userSelect: 'none' }, '& .MuiMenuItem-root': { minHeight: 36 }, } }
        }
      }}
      inputProps={{ 'aria-label': 'block type' }}
    >
      <MenuItem value='paragraph' onClick={formatParagraph}>
        <ListItemIcon>
          <ViewHeadline fontSize="small" />
        </ListItemIcon>
        <ListItemText>Normal</ListItemText>
      </MenuItem>
      {hasHeadings && <MenuItem value='h1' onClick={() => formatHeading('h1')}>
        <ListItemIcon>
          <H1 />
        </ListItemIcon>
        <ListItemText>Heading 1</ListItemText>
      </MenuItem>}
      {hasHeadings && <MenuItem value='h2' onClick={() => formatHeading('h2')}>
        <ListItemIcon>
          <H2 />
        </ListItemIcon>
        <ListItemText>Heading 2</ListItemText>
      </MenuItem>}
      {hasHeadings && <MenuItem value='h3' onClick={() => formatHeading('h3')}>
        <ListItemIcon>
          <H3 />
        </ListItemIcon>
        <ListItemText>Heading 3</ListItemText>
      </MenuItem>}
      {hasHeadings && <MenuItem value='h4' onClick={() => formatHeading('h4')}>
        <ListItemIcon>
          <H4 />
        </ListItemIcon>
        <ListItemText>Heading 4</ListItemText>
      </MenuItem>}
      {hasLists && <MenuItem value='bullet' onClick={formatBulletList}>
        <ListItemIcon>
          <FormatListBulleted fontSize="small" />
        </ListItemIcon>
        <ListItemText>Bullet List</ListItemText>
      </MenuItem>}
      {hasLists && <MenuItem value='number' onClick={formatNumberedList}>
        <ListItemIcon>
          <FormatListNumbered fontSize="small" />
        </ListItemIcon>
        <ListItemText>Numbered List</ListItemText>
      </MenuItem>}
      {hasLists && <MenuItem value='check' onClick={formatCheckList}>
        <ListItemIcon>
          <PlaylistAddCheck fontSize="small" />
        </ListItemIcon>
        <ListItemText>Check List</ListItemText>
      </MenuItem>}
      {hasQuote && <MenuItem value='quote' onClick={formatQuote}>
        <ListItemIcon>
          <FormatQuote fontSize="small" />
        </ListItemIcon>
        <ListItemText>Quote</ListItemText>
      </MenuItem>}
      {hasCode && <MenuItem value='code' onClick={formatCode}>
        <ListItemIcon>
          <Code fontSize="small" />
        </ListItemIcon>
        <ListItemText>CodeBlock</ListItemText>
      </MenuItem>}
    </Select>
  );
}
