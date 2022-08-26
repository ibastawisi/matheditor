import { LexicalEditor } from 'lexical';
import { $createCodeNode } from '@lexical/code';
import { INSERT_CHECK_LIST_COMMAND, INSERT_ORDERED_LIST_COMMAND, INSERT_UNORDERED_LIST_COMMAND, REMOVE_LIST_COMMAND } from '@lexical/list';
import { $createHeadingNode, $createQuoteNode, HeadingTagType, } from '@lexical/rich-text';
import { $wrapLeafNodesInElements } from '@lexical/selection';
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
import { blockTypeToBlockName } from '.';

import SvgIcon from '@mui/material/SvgIcon';
const H1Icon = () => <SvgIcon viewBox='0 0 16 16' fontSize='small'>
  <path d="M8.637 13V3.669H7.379V7.62H2.758V3.67H1.5V13h1.258V8.728h4.62V13h1.259zm5.329 0V3.669h-1.244L10.5 5.316v1.265l2.16-1.565h.062V13h1.244z" />
</SvgIcon>;
const H2Icon = () => <SvgIcon viewBox='0 0 16 16' fontSize='small'>
  <path d="M7.638 13V3.669H6.38V7.62H1.759V3.67H.5V13h1.258V8.728h4.62V13h1.259zm3.022-6.733v-.048c0-.889.63-1.668 1.716-1.668.957 0 1.675.608 1.675 1.572 0 .855-.554 1.504-1.067 2.085l-3.513 3.999V13H15.5v-1.094h-4.245v-.075l2.481-2.844c.875-.998 1.586-1.784 1.586-2.953 0-1.463-1.155-2.556-2.919-2.556-1.941 0-2.966 1.326-2.966 2.74v.049h1.223z" />
</SvgIcon>;
const H3Icon = () => <SvgIcon viewBox='0 0 16 16' fontSize='small'>
  <path d="M7.637 13V3.669H6.379V7.62H1.758V3.67H.5V13h1.258V8.728h4.62V13h1.259zm3.625-4.272h1.018c1.142 0 1.935.67 1.949 1.674.013 1.005-.78 1.737-2.01 1.73-1.08-.007-1.853-.588-1.935-1.32H9.108c.069 1.327 1.224 2.386 3.083 2.386 1.935 0 3.343-1.155 3.309-2.789-.027-1.51-1.251-2.16-2.037-2.249v-.068c.704-.123 1.764-.91 1.723-2.229-.035-1.353-1.176-2.4-2.954-2.385-1.873.006-2.857 1.162-2.898 2.358h1.196c.062-.69.711-1.299 1.696-1.299.998 0 1.695.622 1.695 1.525.007.922-.718 1.592-1.695 1.592h-.964v1.074z" />
</SvgIcon>;

export function BlockFormatSelect({ editor, blockType }: {
  blockType: keyof typeof blockTypeToBlockName;
  editor: LexicalEditor;
}): JSX.Element {
  const formatParagraph = () => {
    if (blockType !== 'paragraph') {
      editor.update(() => {
        const selection = $getSelection();
        if ($isRangeSelection(selection)) {
          $wrapLeafNodesInElements(selection, () => $createParagraphNode());
        }
      });
    }
  };

  const formatHeading = (headingSize: HeadingTagType) => {
    if (blockType !== headingSize) {
      editor.update(() => {
        const selection = $getSelection();
        if ($isRangeSelection(selection)) {
          $wrapLeafNodesInElements(selection, () => $createHeadingNode(headingSize)
          );
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

        if ($isRangeSelection(selection)) {
          $wrapLeafNodesInElements(selection, () => $createQuoteNode());
        }
      });
    }
  };

  const formatCode = () => {
    if (blockType !== 'code') {
      editor.update(() => {
        const selection = $getSelection();
        if ($isRangeSelection(selection)) {
          if (selection.isCollapsed()) {
            $wrapLeafNodesInElements(selection, () => $createCodeNode());
          } else {
            const textContent = selection.getTextContent();
            const codeNode = $createCodeNode();
            selection.insertNodes([codeNode]);
            selection.insertRawText(textContent);
          }
        }
      });
    }
  };

  return (
    <Select value={blockType} aria-label="Formatting options for text style" size='small' sx={{
      mx: 0.25,
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
