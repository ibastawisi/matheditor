import { $getNodeByKey, $getSelection, $isNodeSelection, $isRangeSelection, ElementNode, NodeKey, RangeSelection, TextNode } from 'lexical';
import { $isCodeNode } from '@lexical/code';
import { $isListNode, ListNode, } from '@lexical/list';
import { useLexicalComposerContext } from '@lexical/react/LexicalComposerContext';
import { $isHeadingNode } from '@lexical/rich-text';
import { $getSelectionStyleValueForProperty, $isAtNodeEnd, $isParentElementRTL, $patchStyleText, } from '@lexical/selection';
import { $getNearestNodeOfType, mergeRegister, } from '@lexical/utils';
import { CAN_REDO_COMMAND, CAN_UNDO_COMMAND, REDO_COMMAND, SELECTION_CHANGE_COMMAND, UNDO_COMMAND, COMMAND_PRIORITY_CRITICAL, } from 'lexical';
import { useCallback, useEffect, useState } from 'react';

import Box from '@mui/material/Box';
import Select, { SelectChangeEvent } from '@mui/material/Select';
import MenuItem from '@mui/material/MenuItem';
import IconButton from '@mui/material/IconButton';
import UndoIcon from '@mui/icons-material/Undo';
import RedoIcon from '@mui/icons-material/Redo';

import * as React from 'react';
import AppBar from '@mui/material/AppBar';
import Toolbar from '@mui/material/Toolbar';
import useScrollTrigger from '@mui/material/useScrollTrigger';

import { BlockFormatSelect } from './BlockFormatSelect';
import InsertToolMenu from './InsertToolMenu';
import TextFormatToggles from './TextFormatToggles';
import AlignTextMenu from './AlignTextMenu';
import { IS_APPLE } from '../../../shared/environment';
import { $isMathNode, MathNode } from '../../nodes/MathNode';
import MathTools from './MathTools';
import { $isImageNode, ImageNode } from '../../nodes/ImageNode';
import ImageTools from './ImageTools';
import { $isSketchNode, SketchNode } from '../../nodes/SketchNode';
import { $isGraphNode, GraphNode } from '../../nodes/GraphNode';

export const blockTypeToBlockName = {
  bullet: 'Bulleted List',
  check: 'Check List',
  code: 'Code Block',
  h1: 'Heading 1',
  h2: 'Heading 2',
  h3: 'Heading 3',
  number: 'Numbered List',
  paragraph: 'Normal',
};

const CODE_LANGUAGE_OPTIONS: [string, string][] = [
  ['', '- Select language -'],
  ['c', 'C'],
  ['clike', 'C-like'],
  ['css', 'CSS'],
  ['html', 'HTML'],
  ['js', 'JavaScript'],
  ['markdown', 'Markdown'],
  ['objc', 'Objective-C'],
  ['plain', 'Plain Text'],
  ['py', 'Python'],
  ['rust', 'Rust'],
  ['sql', 'SQL'],
  ['swift', 'Swift'],
  ['xml', 'XML'],
];

const CODE_LANGUAGE_MAP = {
  javascript: 'js',
  md: 'markdown',
  plaintext: 'plain',
  python: 'py',
  text: 'plain',
};

export function getSelectedNode(selection: RangeSelection): TextNode | ElementNode {
  const anchor = selection.anchor;
  const focus = selection.focus;
  const anchorNode = selection.anchor.getNode();
  const focusNode = selection.focus.getNode();
  if (anchorNode === focusNode) {
    return anchorNode;
  }
  const isBackward = selection.isBackward();
  if (isBackward) {
    return $isAtNodeEnd(focus) ? anchorNode : focusNode;
  } else {
    return $isAtNodeEnd(anchor) ? focusNode : anchorNode;
  }
}

export function positionEditorElement(
  editor: HTMLElement,
  rect: ClientRect | null,
  rootElement: HTMLElement,
): void {
  if (rect === null) {
    editor.style.opacity = '0';
    editor.style.top = '-1000px';
    editor.style.left = '-1000px';
  } else {
    editor.style.opacity = '1';
    editor.style.top = `${rect.top + rect.height + window.pageYOffset + 10}px`;
    const left = rect.left - editor.offsetWidth / 2 + rect.width / 2;
    const rootElementRect = rootElement.getBoundingClientRect();
    if (rootElementRect.left > left) {
      editor.style.left = `${rect.left + window.pageXOffset}px`;
    } else if (left + editor.offsetWidth > rootElementRect.right) {
      editor.style.left = `${rect.right + window.pageXOffset - editor.offsetWidth
        }px`;
    }
  }
}

export default function ToolbarPlugin() {
  const [editor] = useLexicalComposerContext();
  const [activeEditor, setActiveEditor] = useState(editor);
  const [blockType, setBlockType] = useState<keyof typeof blockTypeToBlockName>('paragraph');
  const [selectedElementKey, setSelectedElementKey] = useState<NodeKey | null>(null);
  const [fontSize, setFontSize] = useState<string>('15px');
  const [fontFamily, setFontFamily] = useState<string>('Roboto');
  const [isRTL, setIsRTL] = useState(false);
  const [mathNode, setMathNode] = useState<MathNode | null>(null);
  const [imageNode, setImageNode] = useState<ImageNode | GraphNode | SketchNode | null>(null);
  const [canUndo, setCanUndo] = useState(false);
  const [canRedo, setCanRedo] = useState(false);
  const [codeLanguage, setCodeLanguage] = useState<string>('');

  const updateToolbar = useCallback(() => {
    const selection = $getSelection();
    if ($isRangeSelection(selection)) {
      const anchorNode = selection.anchor.getNode();
      const element =
        anchorNode.getKey() === 'root'
          ? anchorNode
          : anchorNode.getTopLevelElementOrThrow();
      const elementKey = element.getKey();
      const elementDOM = activeEditor.getElementByKey(elementKey);

      setIsRTL($isParentElementRTL(selection));

      if (elementDOM !== null) {
        setSelectedElementKey(elementKey);
        if ($isListNode(element)) {
          const parentList = $getNearestNodeOfType<ListNode>(
            anchorNode,
            ListNode,
          );
          const type = parentList
            ? parentList.getListType()
            : element.getListType();
          setBlockType(type);
        } else {
          const type = $isHeadingNode(element)
            ? element.getTag()
            : element.getType();
          if (type in blockTypeToBlockName) {
            setBlockType(type as keyof typeof blockTypeToBlockName);
          }
          if ($isCodeNode(element)) {
            const language =
              element.getLanguage() as keyof typeof CODE_LANGUAGE_MAP;
            setCodeLanguage(
              language ? CODE_LANGUAGE_MAP[language] || language : '',
            );
            return;
          }
        }
      }
      // Handle buttons
      setFontSize(
        $getSelectionStyleValueForProperty(selection, 'font-size', '15px'),
      );
      setFontFamily(
        $getSelectionStyleValueForProperty(selection, 'font-family', 'Roboto'),
      );
      setMathNode(null);
      setImageNode(null);
    }

    if ($isNodeSelection(selection)) {
      const node = selection.getNodes()[0];
      const isMathNode = $isMathNode(node);
      setMathNode(isMathNode ? node : null);
      const isImageNode = $isImageNode(node) || $isGraphNode(node) || $isSketchNode(node);
      setImageNode(isImageNode ? node : null);
    }

    if (selection === null) {
      setMathNode(null);
      setImageNode(null);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeEditor]);

  useEffect(() => {
    return editor.registerCommand(
      SELECTION_CHANGE_COMMAND,
      (_payload, newEditor) => {
        updateToolbar();
        setActiveEditor(newEditor);
        return false;
      },
      COMMAND_PRIORITY_CRITICAL,
    );
  }, [editor, updateToolbar]);

  useEffect(() => {
    return mergeRegister(
      activeEditor.registerUpdateListener(({ editorState }) => {
        editorState.read(() => {
          updateToolbar();
        });
      }),
      activeEditor.registerCommand<boolean>(
        CAN_UNDO_COMMAND,
        (payload) => {
          setCanUndo(payload);
          return false;
        },
        COMMAND_PRIORITY_CRITICAL,
      ),
      activeEditor.registerCommand<boolean>(
        CAN_REDO_COMMAND,
        (payload) => {
          setCanRedo(payload);
          return false;
        },
        COMMAND_PRIORITY_CRITICAL,
      ),
    );
  }, [activeEditor, updateToolbar]);

  const applyStyleText = useCallback(
    (styles: Record<string, string>) => {
      activeEditor.update(() => {
        const selection = $getSelection();
        if ($isRangeSelection(selection)) {
          $patchStyleText(selection, styles);
        }
      });
    },
    [activeEditor],
  );

  const onFontSizeSelect = useCallback(
    (e: SelectChangeEvent) => {
      applyStyleText({ 'font-size': (e.target as HTMLSelectElement).value });
    },
    [applyStyleText],
  );


  const onFontFamilySelect = useCallback(
    (e: SelectChangeEvent) => {
      applyStyleText({ 'font-family': (e.target as HTMLSelectElement).value });
    },
    [applyStyleText],
  );

  const onCodeLanguageSelect = useCallback(
    (e: SelectChangeEvent) => {
      activeEditor.update(() => {
        if (selectedElementKey !== null) {
          const node = $getNodeByKey(selectedElementKey);
          if ($isCodeNode(node)) {
            node.setLanguage((e.target as HTMLSelectElement).value);
          }
        }
      });
    },
    [activeEditor, selectedElementKey],
  );

  const FONT_FAMILY_MAP = [
    ['Roboto', 'Roboto'],
    ['Virgil', 'Virgil'],
    ['Cascadia', 'Cascadia'],
    ['Courier New', 'Courier New'],
    ['Georgia', 'Georgia'],
  ];

  const FONT_SIZE_MAP = [
    ['15px', '15'],
    ['16px', '16'],
    ['17px', '17'],
    ['18px', '18'],
    ['19px', '19'],
    ['20px', '20'],
  ];

  if (editor.isReadOnly()) return null;

  return (
    <ElevationScroll>
      <AppBar className='toolbar-appbar'>
        <Toolbar className="toolbar" sx={{ displayPrint: 'none', px: 0, justifyContent: "space-between", alignItems: "center" }}>
          <Box sx={{ display: "flex" }}>
            <IconButton title={IS_APPLE ? 'Undo (⌘Z)' : 'Undo (Ctrl+Z)'} aria-label="Undo" disabled={!canUndo}
              onClick={() => { activeEditor.dispatchCommand(UNDO_COMMAND, undefined); }}> <UndoIcon />
            </IconButton>
            <IconButton title={IS_APPLE ? 'Redo (⌘Y)' : 'Redo (Ctrl+Y)'} aria-label="Redo" disabled={!canRedo}
              onClick={() => { activeEditor.dispatchCommand(REDO_COMMAND, undefined); }}>
              <RedoIcon />
            </IconButton>
          </Box>
          <Box sx={{ display: "flex" }}>
            {mathNode ? <MathTools editor={activeEditor} node={mathNode} sx={{ mx: 1 }} /> :
              imageNode ? <ImageTools editor={activeEditor} node={imageNode} sx={{ mx: 1 }} />
                : <>
                  {blockType in blockTypeToBlockName && activeEditor === editor && <BlockFormatSelect blockType={blockType} editor={editor} />}
                  {blockType === 'code' ? (
                    <Select size='small' sx={{ mx: 0.25 }} onChange={onCodeLanguageSelect} value={codeLanguage}>
                      {CODE_LANGUAGE_OPTIONS.map(([option, text]) => <MenuItem key={option} value={option}>{text}</MenuItem>)}
                    </Select>
                  ) : (
                    <>
                      <Select size='small' sx={{ mx: 0.25, width: 80 }} onChange={onFontFamilySelect} value={fontFamily}>
                        {FONT_FAMILY_MAP.map(([option, text]) => <MenuItem key={option} value={option}>  {text}</MenuItem>)}
                      </Select>
                      <Select size='small' sx={{ mx: 0.25 }} onChange={onFontSizeSelect} value={fontSize}>
                        {FONT_SIZE_MAP.map(([option, text]) => <MenuItem key={option} value={option}>  {text}</MenuItem>)}
                      </Select>
                      <TextFormatToggles editor={activeEditor} sx={{ mx: 1, display: { xs: "none", sm: "none", md: "none", lg: "flex" } }} />
                    </>
                  )}
                </>
            }
          </Box>
          <Box sx={{ display: "flex" }}>
            {blockType !== 'code' && <InsertToolMenu editor={activeEditor} />}
            <AlignTextMenu editor={activeEditor} isRTL={isRTL} />
          </Box>
        </Toolbar >
      </AppBar>
    </ElevationScroll>
  );
}

interface Props {
  /**
   * Injected by the documentation to work in an iframe.
   * You won't need it on your project.
   */
  window?: () => Window;
  children: React.ReactElement;
}

function ElevationScroll(props: Props) {
  const { children, window } = props;
  // Note that you normally won't need to set the window ref as useScrollTrigger
  // will default to window.
  // This is only being set here because the demo is in an iframe.
  const trigger = useScrollTrigger({
    disableHysteresis: true,
    threshold: 100,
    target: window ? window() : undefined,
  });

  return React.cloneElement(children, {
    elevation: trigger ? 4 : 0,
    position: trigger ? 'fixed' : 'static',
  });
}
