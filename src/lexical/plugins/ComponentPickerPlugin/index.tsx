/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import { $createCodeNode } from '@lexical/code';
import {
  INSERT_CHECK_LIST_COMMAND,
  INSERT_ORDERED_LIST_COMMAND,
  INSERT_UNORDERED_LIST_COMMAND,
} from '@lexical/list';
import { useLexicalComposerContext } from '@lexical/react/LexicalComposerContext';
import { INSERT_HORIZONTAL_RULE_COMMAND } from '@lexical/react/LexicalHorizontalRuleNode';
import {
  LexicalTypeaheadMenuPlugin,
  TypeaheadOption,
  useBasicTypeaheadTriggerMatch,
} from '@lexical/react/LexicalTypeaheadMenuPlugin';
import { $createHeadingNode, $createQuoteNode } from '@lexical/rich-text';
import { $wrapLeafNodesInElements } from '@lexical/selection';
import { INSERT_TABLE_COMMAND } from '@lexical/table';
import {
  $createParagraphNode,
  $getSelection,
  $isRangeSelection,
  FORMAT_ELEMENT_COMMAND,
  TextNode,
} from 'lexical';
import { useCallback, useMemo, useState } from 'react';
import * as ReactDOM from 'react-dom';

import InsertTableDialog from '../ToolbarPlugin/InsertTableDialog';
import ImageDialog, { ImageDialogMode } from '../ToolbarPlugin/ImageDialog';
import SketchDialog, { SketchDialogMode } from '../ToolbarPlugin/Sketch/SketchDialog';
import GraphDialog, { GraphDialogMode } from '../ToolbarPlugin/GraphDialog';
import { GraphType } from '../../nodes/GraphNode';
import { INSERT_MATH_COMMAND } from '../MathPlugin';
import { INSERT_STICKY_COMMAND } from '../StickyPlugin';

import Paper from '@mui/material/Paper';
import MenuList from '@mui/material/MenuList';
import MenuItem from '@mui/material/MenuItem';
import ListItemText from '@mui/material/ListItemText';
import ListItemIcon from '@mui/material/ListItemIcon';
import Typography from '@mui/material/Typography';

import ViewHeadlineIcon from '@mui/icons-material/ViewHeadline';
import FormatListBulletedIcon from '@mui/icons-material/FormatListBulleted';
import FormatListNumberedIcon from '@mui/icons-material/FormatListNumbered';
import PlaylistAddCheckIcon from '@mui/icons-material/PlaylistAddCheck';
import FormatQuoteIcon from '@mui/icons-material/FormatQuote';
import CodeIcon from '@mui/icons-material/Code';

import HorizontalRuleIcon from '@mui/icons-material/HorizontalRule';
import ImageIcon from '@mui/icons-material/Image';
import TableIcon from '@mui/icons-material/TableChart';
import FunctionsIcon from '@mui/icons-material/Functions';
import BrushIcon from '@mui/icons-material/Brush';
import ViewInArIcon from '@mui/icons-material/ViewInAr';
import StickyNote2Icon from '@mui/icons-material/StickyNote2';
import FormatAlignLeftIcon from '@mui/icons-material/FormatAlignLeft';
import FormatAlignCenterIcon from '@mui/icons-material/FormatAlignCenter';
import FormatAlignRightIcon from '@mui/icons-material/FormatAlignRight';
import FormatAlignJustifyIcon from '@mui/icons-material/FormatAlignJustify';

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

const HeadingIcon = (level: number) => level === 1 ? <H1Icon /> : level === 2 ? <H2Icon /> : <H3Icon />;

const GraphIcon = <SvgIcon viewBox='0 0 512 512' fontSize='small'>
  <path d="M500.364,244.365h-37.248c12.695-18.223,27.124-31.674,42.415-39.273c5.76-2.851,8.099-9.844,5.248-15.593    c-2.851-5.76-9.821-8.122-15.593-5.248c-24.041,11.927-45.894,34.804-63.185,66.129c-22.726,41.146-52.166,63.802-82.909,63.802    c-26.077,0-51.188-16.465-72.087-46.545H384c6.423,0,11.636-5.201,11.636-11.636c0-6.435-5.213-11.636-11.636-11.636H267.636v-128    h11.636c4.701,0,8.948-2.828,10.752-7.18s0.803-9.356-2.525-12.684l-23.273-23.273c-4.55-4.55-11.904-4.55-16.454,0L224.5,96.502    c-3.328,3.328-4.329,8.332-2.525,12.684s6.051,7.18,10.752,7.18h11.636V218.09c-23.599-28.323-51.7-43.543-81.455-43.543    c-37.876,0-72.972,24.879-99.607,69.818H11.636C5.213,244.365,0,249.567,0,256.001c0,6.435,5.213,11.636,11.636,11.636h37.248    C36.189,285.86,21.76,299.312,6.47,306.911c-5.76,2.851-8.099,9.844-5.248,15.593c2.025,4.108,6.144,6.47,10.426,6.47    c1.734,0,3.503-0.384,5.167-1.21C40.855,315.836,62.708,292.959,80,261.633c22.726-41.158,52.166-63.814,82.909-63.814    c26.077,0,51.188,16.465,72.087,46.545H128c-6.423,0-11.636,5.201-11.636,11.636c0,6.435,5.213,11.636,11.636,11.636h116.364    v162.909c0,6.435,5.213,11.636,11.636,11.636s11.636-5.201,11.636-11.636V293.913c23.599,28.323,51.7,43.543,81.455,43.543    c37.876,0,72.972-24.879,99.607-69.818h51.665c6.423,0,11.636-5.201,11.636-11.636C512,249.567,506.787,244.365,500.364,244.365z" />
</SvgIcon>;

const FormatAlignIcon = (alignment: string) =>
  alignment === 'left' ? <FormatAlignLeftIcon /> :
    alignment === 'center' ? <FormatAlignCenterIcon /> :
      alignment === 'right' ? <FormatAlignRightIcon /> :
        <FormatAlignJustifyIcon />;

function IconMenu({ options, anchorEl, selectedIndex, setHighlightedIndex, selectOptionAndCleanUp }: {
  options: ComponentPickerOption[];
  anchorEl: HTMLElement | null;
  selectedIndex: number | null;
  selectOptionAndCleanUp: (option: ComponentPickerOption) => void;
  setHighlightedIndex: (index: number) => void;
}) {
  return (
    <Paper>
      <MenuList sx={{
        maxHeight: 200,
        width: 224,
        overflow: 'auto',
        displayPrint: 'none',
        colorScheme: 'initial',
      }}>
        {options.map((option, i: number) => (
          <MenuItem key={option.key} selected={selectedIndex === i}
            ref={(el) => { selectedIndex === i && el?.scrollIntoView({ block: 'nearest', behavior: 'smooth' }); }}
            onClick={() => {
              setHighlightedIndex(i);
              selectOptionAndCleanUp(option);
            }}
            onMouseEnter={() => {
              setHighlightedIndex(i);
            }}
          >
            <ListItemIcon>
              {option.icon}
            </ListItemIcon>
            <ListItemText>{option.title}</ListItemText>
            <Typography variant="body2" color="text.secondary">
              {option.keyboardShortcut}
            </Typography>
          </MenuItem>
        ))}
      </MenuList>
    </Paper>
  );
}

class ComponentPickerOption extends TypeaheadOption {
  // What shows up in the editor
  title: string;
  // Icon for display
  icon?: JSX.Element;
  // For extra searching.
  keywords: Array<string>;
  // TBD
  keyboardShortcut?: string;
  // What happens when you select this option?
  onSelect: (queryString: string) => void;

  constructor(
    title: string,
    options: {
      icon?: JSX.Element;
      keywords?: Array<string>;
      keyboardShortcut?: string;
      onSelect: (queryString: string) => void;
    },
  ) {
    super(title);
    this.title = title;
    this.keywords = options.keywords || [];
    this.icon = options.icon;
    this.keyboardShortcut = options.keyboardShortcut;
    this.onSelect = options.onSelect.bind(this);
  }
}

export default function ComponentPickerMenuPlugin(): JSX.Element {
  const [editor] = useLexicalComposerContext();
  const [queryString, setQueryString] = useState<string | null>(null);
  const [tableDialogOpen, setTableDialogOpen] = useState(false);
  const [imageDialogOpen, setImageDialogOpen] = useState(false);
  const [graphDialogOpen, setGraphDialogOpen] = useState(false);
  const [sketchDialogOpen, setSketchDialogOpen] = useState(false);
  const [graphType, setGraphType] = useState(GraphType['2D']);

  const checkForTriggerMatch = useBasicTypeaheadTriggerMatch('/', {
    minLength: 0,
  });

  const getDynamicOptions = useCallback(() => {
    const options: Array<ComponentPickerOption> = [];

    if (queryString == null) {
      return options;
    }

    const fullTableRegex = new RegExp(/([1-9]|10)x([1-9]|10)$/);
    const partialTableRegex = new RegExp(/([1-9]|10)x?$/);

    const fullTableMatch = fullTableRegex.exec(queryString);
    const partialTableMatch = partialTableRegex.exec(queryString);

    if (fullTableMatch) {
      const [rows, columns] = fullTableMatch[0]
        .split('x')
        .map((n: string) => parseInt(n, 10));

      options.push(
        new ComponentPickerOption(`${rows}x${columns} Table`, {
          icon: <TableIcon />,
          keywords: ['table'],
          keyboardShortcut: `${rows}x${columns}`,
          onSelect: () =>
            // @ts-ignore Correct types, but since they're dynamic TS doesn't like it.
            editor.dispatchCommand(INSERT_TABLE_COMMAND, { columns, rows }),
        }),
      );
    } else if (partialTableMatch) {
      const rows = parseInt(partialTableMatch[0], 10);

      options.push(
        ...Array.from({ length: 5 }, (_, i) => i + 1).map(
          (columns) =>
            new ComponentPickerOption(`${rows}x${columns} Table`, {
              icon: <TableIcon />,
              keywords: ['table'],
              keyboardShortcut: `${rows}x${columns}`,
              onSelect: () =>
                // @ts-ignore Correct types, but since they're dynamic TS doesn't like it.
                editor.dispatchCommand(INSERT_TABLE_COMMAND, { columns, rows }),
            }),
        ),
      );
    }

    return options;
  }, [editor, queryString]);

  const options = useMemo(() => {
    const baseOptions = [
      new ComponentPickerOption('Paragraph', {
        icon: <ViewHeadlineIcon />,
        keywords: ['normal', 'paragraph', 'p', 'text'],
        onSelect: () =>
          editor.update(() => {
            const selection = $getSelection();
            if ($isRangeSelection(selection)) {
              $wrapLeafNodesInElements(selection, () => $createParagraphNode());
            }
          }),
      }),
      ...Array.from({ length: 3 }, (_, i) => i + 1).map(
        (n) =>
          new ComponentPickerOption(`Heading ${n}`, {
            icon: HeadingIcon(n),
            keywords: ['heading', 'header', `h${n}`],
            keyboardShortcut: '#'.repeat(n),
            onSelect: () =>
              editor.update(() => {
                const selection = $getSelection();
                if ($isRangeSelection(selection)) {
                  $wrapLeafNodesInElements(selection, () =>
                    // @ts-ignore Correct types, but since they're dynamic TS doesn't like it.
                    $createHeadingNode(`h${n}`),
                  );
                }
              }),
          }),
      ),
      new ComponentPickerOption('Numbered List', {
        icon: <FormatListNumberedIcon />,
        keywords: ['numbered list', 'ordered list', 'ol'],
        keyboardShortcut: '1.',
        onSelect: () =>
          editor.dispatchCommand(INSERT_ORDERED_LIST_COMMAND, undefined),
      }),
      new ComponentPickerOption('Bulleted List', {
        icon: <FormatListBulletedIcon />,
        keywords: ['bulleted list', 'unordered list', 'ul'],
        keyboardShortcut: '*',
        onSelect: () =>
          editor.dispatchCommand(INSERT_UNORDERED_LIST_COMMAND, undefined),
      }),
      new ComponentPickerOption('Check List', {
        icon: <PlaylistAddCheckIcon />,
        keywords: ['check list', 'todo list'],
        keyboardShortcut: '[x]',
        onSelect: () =>
          editor.dispatchCommand(INSERT_CHECK_LIST_COMMAND, undefined),
      }),
      new ComponentPickerOption('Quote', {
        icon: <FormatQuoteIcon />,
        keywords: ['block quote'],
        keyboardShortcut: '>',
        onSelect: () =>
          editor.update(() => {
            const selection = $getSelection();
            if ($isRangeSelection(selection)) {
              $wrapLeafNodesInElements(selection, () => $createQuoteNode());
            }
          }),
      }),
      new ComponentPickerOption('Code', {
        icon: <CodeIcon />,
        keywords: ['javascript', 'python', 'js', 'codeblock'],
        keyboardShortcut: '```',
        onSelect: () =>
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
          }),
      }),
      new ComponentPickerOption('Divider', {
        icon: <HorizontalRuleIcon />,
        keywords: ['horizontal rule', 'divider', 'hr'],
        keyboardShortcut: '---',
        onSelect: () =>
          editor.dispatchCommand(INSERT_HORIZONTAL_RULE_COMMAND, undefined),
      }),
      new ComponentPickerOption('Math', {
        icon: <FunctionsIcon />,
        keywords: ['equation', 'latex', 'math'],
        keyboardShortcut: '$$',
        onSelect: () =>
          editor.dispatchCommand(INSERT_MATH_COMMAND, { value: '' }),
      }),
      new ComponentPickerOption('2D Graph', {
        icon: GraphIcon,
        keywords: ['geogebra', 'graph', 'plot', '2d'],
        keyboardShortcut: '/2d',
        onSelect: () => { setGraphType(GraphType['2D']); setGraphDialogOpen(true) },
      }),
      new ComponentPickerOption('3D Graph', {
        icon: <ViewInArIcon />,
        keywords: ['geogebra', 'graph', 'plot', '3d'],
        keyboardShortcut: '/3d',
        onSelect: () => { setGraphType(GraphType['3D']); setGraphDialogOpen(true) },
      }),
      new ComponentPickerOption('Sketch', {
        icon: <BrushIcon />,
        keywords: ['excalidraw', 'sketch', 'drawing', 'diagram'],
        keyboardShortcut: '/sketch',
        onSelect: () => setSketchDialogOpen(true),
      }),
      new ComponentPickerOption('Image', {
        icon: <ImageIcon />,
        keywords: ['image', 'photo', 'picture', 'img'],
        keyboardShortcut: '/img',
        onSelect: () => setImageDialogOpen(true),
      }),
      new ComponentPickerOption('Table', {
        icon: <TableIcon />,
        keywords: ['table', 'grid', 'spreadsheet', 'rows', 'columns'],
        keyboardShortcut: '/3x3',
        onSelect: () =>
          setTableDialogOpen(true)
      }),
      new ComponentPickerOption('Note', {
        icon: <StickyNote2Icon />,
        keywords: ['sticky', 'note', 'sticky note'],
        keyboardShortcut: '/note',
        onSelect: () =>
          editor.dispatchCommand(INSERT_STICKY_COMMAND, undefined),
      }),
      ...['left', 'center', 'right', 'justify'].map(
        (alignment) =>
          new ComponentPickerOption(`Align ${alignment}`, {
            icon: FormatAlignIcon(alignment),
            keywords: ['align', alignment],
            keyboardShortcut: `/${alignment}`,
            onSelect: () =>
              // @ts-ignore Correct types, but since they're dynamic TS doesn't like it.
              editor.dispatchCommand(FORMAT_ELEMENT_COMMAND, alignment),
          }),
      ),
    ];

    const dynamicOptions = getDynamicOptions();

    return queryString
      ? [
        ...dynamicOptions,
        ...baseOptions.filter((option) => {
          return new RegExp(queryString, 'gi').exec(option.title) ||
            option.keywords != null
            ? option.keywords.some((keyword) =>
              new RegExp(queryString, 'gi').exec(keyword),
            )
            : false;
        }),
      ]
      : baseOptions;
  }, [editor, getDynamicOptions, queryString]);

  const onSelectOption = useCallback(
    (
      selectedOption: ComponentPickerOption,
      nodeToRemove: TextNode | null,
      closeMenu: () => void,
      matchingString: string,
    ) => {
      editor.update(() => {
        if (nodeToRemove) {
          nodeToRemove.remove();
        }
        selectedOption.onSelect(matchingString);
        closeMenu();
      });
    },
    [editor],
  );

  return (
    <>
      <ImageDialog editor={editor} mode={ImageDialogMode.create} open={imageDialogOpen} onClose={() => setImageDialogOpen(false)} />
      <InsertTableDialog editor={editor} open={tableDialogOpen} onClose={() => setTableDialogOpen(false)} />
      <GraphDialog editor={editor} mode={GraphDialogMode.create} type={graphType} open={graphDialogOpen} onClose={() => setGraphDialogOpen(false)} />
      <SketchDialog editor={editor} mode={SketchDialogMode.create} open={sketchDialogOpen} onClose={() => setSketchDialogOpen(false)} />
      <LexicalTypeaheadMenuPlugin<ComponentPickerOption>
        onQueryChange={setQueryString}
        onSelectOption={onSelectOption}
        triggerFn={checkForTriggerMatch}
        options={options}
        menuRenderFn={(
          anchorElement,
          props,
        ) =>
          anchorElement && options.length ? ReactDOM.createPortal(<IconMenu options={options} anchorEl={anchorElement} {...props} />, anchorElement) : null
        }
      />
    </>
  );
}
