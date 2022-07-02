import { LexicalEditor } from 'lexical';
import { $createCodeNode } from '@lexical/code';
import { INSERT_CHECK_LIST_COMMAND, INSERT_ORDERED_LIST_COMMAND, INSERT_UNORDERED_LIST_COMMAND, REMOVE_LIST_COMMAND } from '@lexical/list';
import { $createHeadingNode, HeadingTagType } from '@lexical/rich-text';
import { $wrapLeafNodesInElements } from '@lexical/selection';
import { $createParagraphNode, $getSelection, $isRangeSelection } from 'lexical';

import Select from '@mui/material/Select';
import MenuItem from '@mui/material/MenuItem';
import CodeIcon from '@mui/icons-material/Code';
import ListItemIcon from '@mui/material/ListItemIcon';
import ListItemText from '@mui/material/ListItemText';
import ViewHeadlineIcon from '@mui/icons-material/ViewHeadline';
import FormatListBulletedIcon from '@mui/icons-material/FormatListBulleted';
import FormatListNumberedIcon from '@mui/icons-material/FormatListNumbered';
import PlaylistAddCheckIcon from '@mui/icons-material/PlaylistAddCheck';
import { blockTypeToBlockName } from './ToolbarPlugin';

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
const H4Icon = () => <SvgIcon viewBox='0 0 16 16' fontSize='small'>
  <path d="M7.637 13V3.669H6.379V7.62H1.758V3.67H.5V13H1.758V8.728h4.62V13Zm5.337.2V10.872H9.108V9.828l3.441-6.35h1.632V9.619H15.5v1.253H14.181V13.2ZM10.359 9.619h2.615V6.7L13 4.689l-.872 1.7z" />
</SvgIcon>;
const H5Icon = () => <SvgIcon viewBox='0 0 16 16' fontSize='small'>
  <path d="M7.637 13V3.669H6.379V7.62H1.758V3.67H.5V13H1.758V8.728h4.62V13Zm2.755-5.791a3.763 3.763 0 0 1 2.113-.517 2.973 2.973 0 0 1 2.995 3.1 3.45 3.45 0 0 1-.9 2.442 3.111 3.111 0 0 1-2.393.968 3.327 3.327 0 0 1-2.094-.671 2.758 2.758 0 0 1-1.007-2h1.284a1.387 1.387 0 0 0 .511 1.1 2.384 2.384 0 0 0 1.4.421 1.819 1.819 0 0 0 1.479-.638A2.042 2.042 0 0 0 14.217 9.9a2.17 2.17 0 0 0-.567-1.584 1.958 1.958 0 0 0-1.468-.58 2.358 2.358 0 0 0-1.79.789H9.108V3.478h5.931V4.612H10.392Z" />
</SvgIcon>;
const H6Icon = () => <SvgIcon viewBox='0 0 16 16' fontSize='small'>
  <path d="M7.637 13V3.669H6.379V7.62H1.758V3.67H.5V13H1.758V8.728h4.62V13Zm5.039-6.13a2.823 2.823 0 0 1 1.419.364 2.69 2.69 0 0 1 1.022 1.05A3.327 3.327 0 0 1 15.5 9.926a3.594 3.594 0 0 1-.39 1.7 2.878 2.878 0 0 1-1.1 1.158 3.165 3.165 0 0 1-1.635.416 2.812 2.812 0 0 1-1.734-.545A3.49 3.49 0 0 1 9.51 11.1a6.515 6.515 0 0 1-.4-2.411A7.726 7.726 0 0 1 9.542 6a4.289 4.289 0 0 1 1.233-1.851 2.831 2.831 0 0 1 1.889-.673A2.7 2.7 0 0 1 13.8 3.7a2.463 2.463 0 0 1 .812.586 2.886 2.886 0 0 1 .514.8 2.768 2.768 0 0 1 .223.861H14a1.488 1.488 0 0 0-.453-.923 1.346 1.346 0 0 0-.935-.329 1.509 1.509 0 0 0-1.072.425A2.839 2.839 0 0 0 10.83 6.3a6.808 6.808 0 0 0-.323 1.771 2.639 2.639 0 0 1 .918-.889A2.48 2.48 0 0 1 12.676 6.87Zm-.285 5.117a1.617 1.617 0 0 0 .91-.256 1.752 1.752 0 0 0 .614-.713 2.336 2.336 0 0 0 .223-1.037 2.211 2.211 0 0 0-.217-1.01 1.6 1.6 0 0 0-.6-.666 1.671 1.671 0 0 0-.892-.236 1.833 1.833 0 0 0-1.164.377 2.4 2.4 0 0 0-.743 1.009 3.749 3.749 0 0 0 .6 1.845A1.5 1.5 0 0 0 12.391 11.987Z" />
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
      <MenuItem value='h4' onClick={() => formatHeading('h4')}>
        <ListItemIcon>
          <H4Icon />
        </ListItemIcon>
        <ListItemText>Heading 4</ListItemText>
      </MenuItem>
      <MenuItem value='h5' onClick={() => formatHeading('h5')}>
        <ListItemIcon>
          <H5Icon />
        </ListItemIcon>
        <ListItemText>Heading 5</ListItemText>
      </MenuItem>
      <MenuItem value='h6' onClick={() => formatHeading('h6')}>
        <ListItemIcon>
          <H6Icon />
        </ListItemIcon>
        <ListItemText>Heading 6</ListItemText>
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
      <MenuItem value='code' onClick={formatCode}>
        <ListItemIcon>
          <CodeIcon fontSize="small" />
        </ListItemIcon>
        <ListItemText>CodeBlock</ListItemText>
      </MenuItem>
    </Select>
  );
}
