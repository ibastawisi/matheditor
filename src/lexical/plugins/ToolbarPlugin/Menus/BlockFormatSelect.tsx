import { DEPRECATED_$isGridSelection, LexicalEditor } from 'lexical';
import { $createCodeNode } from '../../../nodes/CodeNode';
import { INSERT_CHECK_LIST_COMMAND, INSERT_ORDERED_LIST_COMMAND, INSERT_UNORDERED_LIST_COMMAND, REMOVE_LIST_COMMAND } from '@lexical/list';
import { $createHeadingNode, $createQuoteNode, HeadingTagType, } from '@lexical/rich-text';
import { $setBlocksType } from '@lexical/selection';
import { $createParagraphNode, $getSelection, $isRangeSelection } from 'lexical';

import Select from '@mui/material/Select';
import MenuItem from '@mui/material/MenuItem';
import FormatQuoteIcon from '@mui/icons-material/FormatQuote';
import CodeIcon from '@mui/icons-material/Code';
import ListItemIcon from '@mui/material/ListItemIcon';
import ListItemText from '@mui/material/ListItemText';
import ViewHeadlineIcon from '@mui/icons-material/ViewHeadline';
import FormatListBulletedIcon from '@mui/icons-material/FormatListBulleted';
import FormatListNumberedIcon from '@mui/icons-material/FormatListNumbered';
import PlaylistAddCheckIcon from '@mui/icons-material/PlaylistAddCheck';
import { blockTypeToBlockName } from '../index';

import SvgIcon from '@mui/material/SvgIcon';
const H1Icon = () => <SvgIcon viewBox='0 96 960 960' fontSize='small'>
  <path xmlns="http://www.w3.org/2000/svg" d="M200 776V376h60v170h180V376h60v400h-60V606H260v170h-60Zm500 0V436h-80v-60h140v400h-60Z" />
</SvgIcon>;
const H2Icon = () => <SvgIcon viewBox='0 96 960 960' fontSize='small'>
  <path xmlns="http://www.w3.org/2000/svg" d="M120 776V376h60v170h180V376h60v400h-60V606H180v170h-60Zm420 0V606q0-24.75 17.625-42.375T600 546h180V436H540v-60h240q25 0 42.5 17.625T840 436v110q0 24.75-17.625 42.375T780 606H600v110h240v60H540Z" />
</SvgIcon>;
const H3Icon = () => <SvgIcon viewBox='0 96 960 960' fontSize='small'>
  <path xmlns="http://www.w3.org/2000/svg" d="M120 776V376h60v170h180V376h60v400h-60V606H180v170h-60Zm420 0v-60h240V606H620v-60h160V436H540v-60h240q25 0 42.5 17.625T840 436v280q0 24.75-17.625 42.375T780 776H540Z" />
</SvgIcon>;
const H4Icon = () => <SvgIcon viewBox='0 96 960 960' fontSize='small'>
  <path xmlns="http://www.w3.org/2000/svg" d="M120 776V376h60v170h180V376h60v400h-60V606H180v170h-60Zm620 0V646H540V376h60v210h140V376h60v210h80v60h-80v130h-60Z" />
</SvgIcon>;

export function BlockFormatSelect({ editor, blockType }: {
  blockType: keyof typeof blockTypeToBlockName;
  editor: LexicalEditor;
}): JSX.Element {
  const formatParagraph = () => {
    editor.update(() => {
      const selection = $getSelection();
      if (
        $isRangeSelection(selection) ||
        DEPRECATED_$isGridSelection(selection)
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
          DEPRECATED_$isGridSelection(selection)
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
      editor.dispatchCommand(REMOVE_LIST_COMMAND, undefined);
    }
  };

  const formatCheckList = () => {
    if (blockType !== 'check') {
      editor.dispatchCommand(INSERT_CHECK_LIST_COMMAND, undefined);
    } else {
      editor.dispatchCommand(REMOVE_LIST_COMMAND, undefined);
    }
  };

  const formatNumberedList = () => {
    if (blockType !== 'number') {
      editor.dispatchCommand(INSERT_ORDERED_LIST_COMMAND, undefined);
    } else {
      editor.dispatchCommand(REMOVE_LIST_COMMAND, undefined);
    }
  };

  const formatQuote = () => {
    if (blockType !== 'quote') {
      editor.update(() => {
        const selection = $getSelection();
        if (
          $isRangeSelection(selection) ||
          DEPRECATED_$isGridSelection(selection)
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
          DEPRECATED_$isGridSelection(selection)
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
  
  return (
    <Select value={blockType} aria-label="Formatting options for text style" size='small' sx={{
      '& .MuiSelect-select': { display: 'flex', alignItems: 'center', py: 0.5 },
      '& .MuiListItemIcon-root': { mr: { sm: 0.5 }, minWidth: 20 },
      '& .MuiListItemText-root': { display: { xs: "none", sm: "flex" } }
    }}>
      <MenuItem value='paragraph' onClick={formatParagraph}>
        <ListItemIcon>
          <ViewHeadlineIcon fontSize="small" />
        </ListItemIcon>
        <ListItemText>Normal</ListItemText>
      </MenuItem>
      <MenuItem value='h1' onClick={() => formatHeading('h1')}>
        <ListItemIcon>
          <H1Icon />
        </ListItemIcon>
        <ListItemText>Heading 1</ListItemText>
      </MenuItem>
      <MenuItem value='h2' onClick={() => formatHeading('h2')}>
        <ListItemIcon>
          <H2Icon />
        </ListItemIcon>
        <ListItemText>Heading 2</ListItemText>
      </MenuItem>
      <MenuItem value='h3' onClick={() => formatHeading('h3')}>
        <ListItemIcon>
          <H3Icon />
        </ListItemIcon>
        <ListItemText>Heading 3</ListItemText>
      </MenuItem>
      <MenuItem value='h4' onClick={() => formatHeading('h4')}>
        <ListItemIcon>
          <H4Icon />
        </ListItemIcon>
        <ListItemText>Heading 4</ListItemText>
      </MenuItem>
      <MenuItem value='bullet' onClick={formatBulletList}>
        <ListItemIcon>
          <FormatListBulletedIcon fontSize="small" />
        </ListItemIcon>
        <ListItemText>Bullet List</ListItemText>
      </MenuItem>
      <MenuItem value='number' onClick={formatNumberedList}>
        <ListItemIcon>
          <FormatListNumberedIcon fontSize="small" />
        </ListItemIcon>
        <ListItemText>Numbered List</ListItemText>
      </MenuItem>
      <MenuItem value='check' onClick={formatCheckList}>
        <ListItemIcon>
          <PlaylistAddCheckIcon fontSize="small" />
        </ListItemIcon>
        <ListItemText>Check List</ListItemText>
      </MenuItem>
      <MenuItem value='quote' onClick={formatQuote}>
        <ListItemIcon>
          <FormatQuoteIcon fontSize="small" />
        </ListItemIcon>
        <ListItemText>Quote</ListItemText>
      </MenuItem>
      <MenuItem value='code' onClick={formatCode}>
        <ListItemIcon>
          <CodeIcon fontSize="small" />
        </ListItemIcon>
        <ListItemText>CodeBlock</ListItemText>
      </MenuItem>
    </Select>
  );
}
