/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import type { EditorThemeClasses } from 'lexical';

import './theme.css';

const theme: EditorThemeClasses = {
  blockCursor: 'LexicalTheme__blockCursor',
  characterLimit: 'LexicalTheme__characterLimit',
  code: 'LexicalTheme__code',
  codeHighlight: {
    atrule: 'LexicalTheme__tokenAttr',
    attr: 'LexicalTheme__tokenAttr',
    boolean: 'LexicalTheme__tokenProperty',
    builtin: 'LexicalTheme__tokenSelector',
    cdata: 'LexicalTheme__tokenComment',
    char: 'LexicalTheme__tokenSelector',
    class: 'LexicalTheme__tokenFunction',
    'class-name': 'LexicalTheme__tokenFunction',
    comment: 'LexicalTheme__tokenComment',
    constant: 'LexicalTheme__tokenProperty',
    deleted: 'LexicalTheme__tokenProperty',
    doctype: 'LexicalTheme__tokenComment',
    entity: 'LexicalTheme__tokenOperator',
    function: 'LexicalTheme__tokenFunction',
    important: 'LexicalTheme__tokenVariable',
    inserted: 'LexicalTheme__tokenSelector',
    keyword: 'LexicalTheme__tokenAttr',
    namespace: 'LexicalTheme__tokenVariable',
    number: 'LexicalTheme__tokenProperty',
    operator: 'LexicalTheme__tokenOperator',
    prolog: 'LexicalTheme__tokenComment',
    property: 'LexicalTheme__tokenProperty',
    punctuation: 'LexicalTheme__tokenPunctuation',
    regex: 'LexicalTheme__tokenVariable',
    selector: 'LexicalTheme__tokenSelector',
    string: 'LexicalTheme__tokenSelector',
    symbol: 'LexicalTheme__tokenProperty',
    tag: 'LexicalTheme__tokenProperty',
    url: 'LexicalTheme__tokenOperator',
    variable: 'LexicalTheme__tokenVariable',
  },
  embedBlock: {
    base: 'LexicalTheme__embedBlock',
    focus: 'LexicalTheme__embedBlockFocus',
  },
  hashtag: 'LexicalTheme__hashtag',
  heading: {
    h1: 'LexicalTheme__h1',
    h2: 'LexicalTheme__h2',
    h3: 'LexicalTheme__h3',
    h4: 'LexicalTheme__h4',
    h5: 'LexicalTheme__h5',
    h6: 'LexicalTheme__h6',
  },
  image: 'LexicalTheme__image',
  indent: 'LexicalTheme__indent',
  link: 'LexicalTheme__link',
  list: {
    listitem: 'LexicalTheme__listItem',
    listitemChecked: 'LexicalTheme__listItemChecked',
    listitemUnchecked: 'LexicalTheme__listItemUnchecked',
    nested: {
      listitem: 'LexicalTheme__nestedListItem',
    },
    olDepth: [
      'LexicalTheme__ol1',
      'LexicalTheme__ol2',
      'LexicalTheme__ol3',
      'LexicalTheme__ol4',
      'LexicalTheme__ol5',
    ],
    ul: 'LexicalTheme__ul',
  },
  ltr: 'LexicalTheme__ltr',
  mark: 'LexicalTheme__mark',
  markOverlap: 'LexicalTheme__markOverlap',
  paragraph: 'LexicalTheme__paragraph',
  quote: 'LexicalTheme__quote',
  rtl: 'LexicalTheme__rtl',
  table: 'LexicalTheme__table',
  tableAddColumns: 'LexicalTheme__tableAddColumns',
  tableAddRows: 'LexicalTheme__tableAddRows',
  tableCell: 'LexicalTheme__tableCell',
  tableCellActionButton: 'LexicalTheme__tableCellActionButton',
  tableCellActionButtonContainer:
    'LexicalTheme__tableCellActionButtonContainer',
  tableCellEditing: 'LexicalTheme__tableCellEditing',
  tableCellHeader: 'LexicalTheme__tableCellHeader',
  tableCellPrimarySelected: 'LexicalTheme__tableCellPrimarySelected',
  tableCellResizer: 'LexicalTheme__tableCellResizer',
  tableCellSelected: 'LexicalTheme__tableCellSelected',
  tableCellSortedIndicator: 'LexicalTheme__tableCellSortedIndicator',
  tableResizeRuler: 'LexicalTheme__tableCellResizeRuler',
  tableSelected: 'LexicalTheme__tableSelected',
  tableSelection: 'LexicalTheme__tableSelection',
  text: {
    bold: 'LexicalTheme__textBold',
    code: 'LexicalTheme__textCode',
    italic: 'LexicalTheme__textItalic',
    strikethrough: 'LexicalTheme__textStrikethrough',
    subscript: 'LexicalTheme__textSubscript',
    superscript: 'LexicalTheme__textSuperscript',
    underline: 'LexicalTheme__textUnderline',
    underlineStrikethrough: 'LexicalTheme__textUnderlineStrikethrough',
  },
};

export default theme;
