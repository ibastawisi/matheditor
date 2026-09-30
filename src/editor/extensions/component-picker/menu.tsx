"use client"
/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import { $createCodeNode } from '@lexical/code-core';
import {
  INSERT_CHECK_LIST_COMMAND,
  INSERT_ORDERED_LIST_COMMAND,
  INSERT_UNORDERED_LIST_COMMAND,
} from '@lexical/list';
import { useLexicalComposerContext } from '@lexical/react/LexicalComposerContext';
import {
  LexicalTypeaheadMenuPlugin,
  MenuOption,
  useBasicTypeaheadTriggerMatch,
} from '@lexical/react/LexicalTypeaheadMenuPlugin';
import { useLexicalEditable } from '@lexical/react/useLexicalEditable';
import { $createHeadingNode, $createQuoteNode, HeadingTagType } from '@lexical/rich-text';
import { $setBlocksType } from '@lexical/selection';
import { INSERT_TABLE_COMMAND } from '@lexical/table';
import {
  $getSelection,
  $isRangeSelection,
  ElementFormatType,
  FORMAT_ELEMENT_COMMAND,
  TextNode,
} from 'lexical';
import { useCallback, useMemo, useState, JSX } from 'react';
import * as ReactDOM from 'react-dom';
import { Paper, MenuList, MenuItem, ListItemIcon, ListItemText, Typography } from '@mui/material';
import { FormatAlignLeft, FormatAlignCenter, FormatAlignRight, FormatAlignJustify, FormatListNumbered, FormatListBulleted, PlaylistAddCheck, FormatQuote, Code, Image as ImageIcon, TableChart, HorizontalRule, Functions, Brush, StickyNote2, InsertPageBreak, Web, ViewColumn, ImageSearch, Expand } from '@mui/icons-material';

import { INSERT_HORIZONTAL_RULE_COMMAND } from '@/editor/extensions/horizontal-rule/commands';
import { INSERT_MATH_COMMAND } from '@/editor/extensions/math/commands';
import { INSERT_STICKY_COMMAND } from '@/editor/extensions/sticky/commands';
import { INSERT_PAGE_BREAK_COMMAND } from '@/editor/extensions/page-break/commands';
import { INSERT_DETAILS_COMMAND } from '@/editor/extensions/details/commands';
import { setOpenDialog } from '@/editor/extensions/store';
import { GraphIcon, HeadingIcon } from '@/editor/extensions/shared/icons';

const FormatAlignIcon = (alignment: string) =>
  alignment === 'left' ? <FormatAlignLeft /> :
    alignment === 'center' ? <FormatAlignCenter /> :
      alignment === 'right' ? <FormatAlignRight /> :
        <FormatAlignJustify />;

function IconMenu({ options, selectedIndex, setHighlightedIndex, selectOptionAndCleanUp }: {
  options: ComponentPickerOption[];
  selectedIndex: number | null;
  selectOptionAndCleanUp: (option: ComponentPickerOption) => void;
  setHighlightedIndex: (index: number) => void;
}) {
  return (
    <Paper sx={{ width: 224, marginTop: 3 }}>
      <MenuList sx={{
        maxHeight: 200,
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
            <Typography variant="body2" sx={{ color: "text.secondary" }}>
              {option.keyboardShortcut}
            </Typography>
          </MenuItem>
        ))}
      </MenuList>
    </Paper>
  );
}

class ComponentPickerOption extends MenuOption {
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

export function ComponentPickerMenu() {
  const [editor] = useLexicalComposerContext();
  const isEditable = useLexicalEditable();
  const [queryString, setQueryString] = useState<string | null>(null);
  const openImageDialog = () => setOpenDialog(editor, 'image');
  const openTableDialog = () => setOpenDialog(editor, 'table');
  const openGraphDialog = () => setOpenDialog(editor, 'graph');
  const openSketchDialog = () => setOpenDialog(editor, 'sketch');
  const openIFrameDialog = () => setOpenDialog(editor, 'iframe');
  const openLayoutDialog = () => setOpenDialog(editor, 'layout');
  const openOCRDialog = () => setOpenDialog(editor, 'ocr');

  const checkForTriggerMatch = useBasicTypeaheadTriggerMatch('/', {
    minLength: 0,
  });

  const getDynamicOptions = useCallback(() => {
    const options: Array<ComponentPickerOption> = [];
    if (queryString == null) {
      return options;
    }

    const fullTableRegex = new RegExp(/^([1-9]|10)x([1-9]|10)$/);
    const partialTableRegex = new RegExp(/^([1-9]|10)x?$/);

    const fullTableMatch = fullTableRegex.exec(queryString);
    const partialTableMatch = partialTableRegex.exec(queryString);

    if (fullTableMatch) {
      const [rows, columns] = fullTableMatch[0]
        .split('x')
        .map((n: string) => parseInt(n, 10));

      options.push(
        new ComponentPickerOption(`${rows}x${columns} Table`, {
          icon: <TableChart />,
          keywords: ['table'],
          keyboardShortcut: `${rows}x${columns}`,
          onSelect: () =>
            editor.dispatchCommand(INSERT_TABLE_COMMAND, { columns: `${columns}`, rows: `${rows}` }),
        }),
      );
    } else if (partialTableMatch) {
      const rows = parseInt(partialTableMatch[0], 10);

      options.push(
        ...Array.from({ length: 5 }, (_, i) => i + 1).map(
          (columns) =>
            new ComponentPickerOption(`${rows}x${columns} Table`, {
              icon: <TableChart />,
              keywords: ['table'],
              keyboardShortcut: `${rows}x${columns}`,
              onSelect: () =>
                editor.dispatchCommand(INSERT_TABLE_COMMAND, { columns: `${columns}`, rows: `${rows}` }),
            }),
        ),
      );
    }

    return options;
  }, [editor, queryString]);

  const options = useMemo(() => {
    const baseOptions = [
      ...Array.from({ length: 4 }, (_, i) => i + 1).map(
        (n) =>
          new ComponentPickerOption(`Heading ${n}`, {
            icon: <HeadingIcon level={n} />,
            keywords: ['heading', 'header', `h${n}`],
            keyboardShortcut: '#'.repeat(n),
            onSelect: () =>
              editor.update(() => {
                const selection = $getSelection();
                if ($isRangeSelection(selection)) {
                  $setBlocksType(selection, () =>
                    $createHeadingNode(`h${n}` as HeadingTagType),
                  );
                }
              }),
          }),
      ),
      new ComponentPickerOption('Numbered List', {
        icon: <FormatListNumbered />,
        keywords: ['numbered list', 'ordered list', 'ol'],
        keyboardShortcut: '1.',
        onSelect: () =>
          editor.dispatchCommand(INSERT_ORDERED_LIST_COMMAND, undefined),
      }),
      new ComponentPickerOption('Bulleted List', {
        icon: <FormatListBulleted />,
        keywords: ['bulleted list', 'unordered list', 'ul'],
        keyboardShortcut: '*',
        onSelect: () =>
          editor.dispatchCommand(INSERT_UNORDERED_LIST_COMMAND, undefined),
      }),
      new ComponentPickerOption('Check List', {
        icon: <PlaylistAddCheck />,
        keywords: ['check list', 'todo list'],
        keyboardShortcut: '[x]',
        onSelect: () =>
          editor.dispatchCommand(INSERT_CHECK_LIST_COMMAND, undefined),
      }),
      new ComponentPickerOption('Quote', {
        icon: <FormatQuote />,
        keywords: ['block quote'],
        keyboardShortcut: '>',
        onSelect: () =>
          editor.update(() => {
            const selection = $getSelection();
            if ($isRangeSelection(selection)) {
              $setBlocksType(selection, () => $createQuoteNode());
            }
          }),
      }),
      new ComponentPickerOption('Code', {
        icon: <Code />,
        keywords: ['javascript', 'python', 'js', 'codeblock'],
        keyboardShortcut: '```',
        onSelect: () =>
          editor.update(() => {
            const selection = $getSelection();

            if ($isRangeSelection(selection)) {
              if (selection.isCollapsed()) {
                $setBlocksType(selection, () => $createCodeNode());
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
        icon: <HorizontalRule />,
        keywords: ['horizontal rule', 'divider', 'hr'],
        keyboardShortcut: '---',
        onSelect: () =>
          editor.dispatchCommand(INSERT_HORIZONTAL_RULE_COMMAND, undefined),
      }),
      new ComponentPickerOption('Math', {
        icon: <Functions />,
        keywords: ['equation', 'latex', 'math'],
        keyboardShortcut: '$$',
        onSelect: () =>
          editor.dispatchCommand(INSERT_MATH_COMMAND, { value: '' }),
      }),
      new ComponentPickerOption('OCR', {
        icon: <ImageSearch />,
        keywords: ['ocr', 'image', 'text'],
        keyboardShortcut: '/ocr',
        onSelect: openOCRDialog,
      }),
      ...['left', 'center', 'right', 'justify'].map(
        (alignment) =>
          new ComponentPickerOption(`Align ${alignment}`, {
            icon: FormatAlignIcon(alignment),
            keywords: ['align', alignment],
            keyboardShortcut: `/${alignment}`,
            onSelect: () =>
              editor.dispatchCommand(FORMAT_ELEMENT_COMMAND, alignment as ElementFormatType),
          }),
      ),
    ];

    baseOptions.push(
      new ComponentPickerOption('Image', {
        icon: <ImageIcon />,
        keywords: ['image', 'photo', 'picture', 'img'],
        keyboardShortcut: '/img',
        onSelect: openImageDialog
      }),
    );

    baseOptions.push(
      new ComponentPickerOption('Graph', {
        icon: <GraphIcon />,
        keywords: ['geogebra', 'graph', 'plot', '2d', '3d'],
        keyboardShortcut: '/plot',
        onSelect: openGraphDialog,
      }),
    );

    baseOptions.push(
      new ComponentPickerOption('Sketch', {
        icon: <Brush />,
        keywords: ['excalidraw', 'sketch', 'drawing', 'diagram'],
        keyboardShortcut: '/sketch',
        onSelect: openSketchDialog,
      }),
    );

    baseOptions.push(
      new ComponentPickerOption('Note', {
        icon: <StickyNote2 />,
        keywords: ['sticky', 'note', 'sticky note'],
        keyboardShortcut: '/note',
        onSelect: () =>
          editor.dispatchCommand(INSERT_STICKY_COMMAND, undefined),
      }),
    );

    baseOptions.push(
      new ComponentPickerOption('Table', {
        icon: <TableChart />,
        keywords: ['table', 'grid', 'spreadsheet', 'rows', 'columns'],
        keyboardShortcut: '/3x3',
        onSelect: openTableDialog,
      }),
    );

    baseOptions.push(
      new ComponentPickerOption('Columns', {
        icon: <ViewColumn />,
        keywords: ['columns', 'layout', 'col'],
        keyboardShortcut: '/col',
        onSelect: openLayoutDialog,
      }),
    );

    baseOptions.push(
      new ComponentPickerOption('Page Break', {
        icon: <InsertPageBreak />,
        keywords: ['page break', 'break', 'page'],
        keyboardShortcut: '/page',
        onSelect: () =>
          editor.dispatchCommand(INSERT_PAGE_BREAK_COMMAND, undefined),
      }),
    );

    baseOptions.push(
      new ComponentPickerOption('IFrame', {
        icon: <Web />,
        keywords: ['iframe', 'embed'],
        keyboardShortcut: '/iframe',
        onSelect: openIFrameDialog,
      }),
    );

    baseOptions.push(
      new ComponentPickerOption('Details', {
        icon: <Expand />,
        keywords: ['details', 'summary', 'expand', 'collapse'],
        keyboardShortcut: '/details',
        onSelect: () =>
          editor.dispatchCommand(INSERT_DETAILS_COMMAND, undefined),
      }),
    );
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

  if (!isEditable) return null;

  return (
    <LexicalTypeaheadMenuPlugin<ComponentPickerOption>
      onQueryChange={setQueryString}
      onSelectOption={onSelectOption}
      triggerFn={checkForTriggerMatch}
      options={options}
      menuRenderFn={(
        anchorElement,
        props,
      ) =>
        anchorElement.current && options.length ? ReactDOM.createPortal(<IconMenu {...props} />, anchorElement.current) : null
      }
    />
  );
}
