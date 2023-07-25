"use client"
import { $getNodeByKey, $getSelection, $isNodeSelection, $isRangeSelection, ElementNode, LexicalCommand, LexicalNode, NodeKey, RangeSelection, TextNode, createCommand } from 'lexical';
import { $isCodeNode, CODE_LANGUAGE_MAP, CODE_LANGUAGE_FRIENDLY_NAME_MAP } from '../../nodes/CodeNode';
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

import AppBar from '@mui/material/AppBar';
import Toolbar from '@mui/material/Toolbar';
import useScrollTrigger from '@mui/material/useScrollTrigger';

import { BlockFormatSelect } from './Menus/BlockFormatSelect';
import InsertToolMenu from './Menus/InsertToolMenu';
import TextFormatToggles from './Tools/TextFormatToggles';
import AlignTextMenu from './Menus/AlignTextMenu';
import { IS_APPLE } from '../../shared/environment';
import { $isMathNode } from '../../nodes/MathNode';
import MathTools from './Tools/MathTools';
import { $isImageNode } from '../../nodes/ImageNode';
import ImageTools from './Tools/ImageTools';
import { $isSketchNode } from '../../nodes/SketchNode';
import { $isGraphNode } from '../../nodes/GraphNode';
import { $patchStyle } from '../../nodes/utils';
import { ImageDialog, GraphDialog, SketchDialog, TableDialog } from './Dialogs';
import { $isStickyNode } from '../../nodes/StickyNode';

type EditorDialogs = {
  image: {
    open: boolean;
  };
  graph: {
    open: boolean;
  };
  sketch: {
    open: boolean;
  };
  table: {
    open: boolean;
  };
};

export type SetDialogsPayload = Readonly<Partial<EditorDialogs>>;

export const SET_DIALOGS_COMMAND: LexicalCommand<SetDialogsPayload> = createCommand();

export const blockTypeToBlockName = {
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


function getCodeLanguageOptions(): [string, string][] {
  const options: [string, string][] = [];

  for (const [lang, friendlyName] of Object.entries(
    CODE_LANGUAGE_FRIENDLY_NAME_MAP,
  )) {
    options.push([lang, friendlyName]);
  }

  return options;
}

const CODE_LANGUAGE_OPTIONS = getCodeLanguageOptions();

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

function ToolbarPlugin() {
  const [editor] = useLexicalComposerContext();
  const [activeEditor, setActiveEditor] = useState(editor);
  const [blockType, setBlockType] = useState<keyof typeof blockTypeToBlockName>('paragraph');
  const [selectedElementKey, setSelectedElementKey] = useState<NodeKey | null>(null);
  const [fontSize, setFontSize] = useState<string>('15px');
  const [fontFamily, setFontFamily] = useState<string>('Roboto');
  const [isRTL, setIsRTL] = useState(false);
  const [canUndo, setCanUndo] = useState(false);
  const [canRedo, setCanRedo] = useState(false);
  const [codeLanguage, setCodeLanguage] = useState<string>('');
  const [selectedNode, setSelectedNode] = useState<LexicalNode | null>(null);
  const [dialogs, setDialogs] = useState<EditorDialogs>({
    image: {
      open: false,
    },
    graph: {
      open: false,
    },
    sketch: {
      open: false,
    },
    table: {
      open: false,
    },
  });

  const updateToolbar = useCallback(() => {
    const selection = $getSelection();
    if ($isNodeSelection(selection)) {
      const node = selection.getNodes()[0];
      setSelectedNode(node);
      setSelectedElementKey(null);
      setBlockType('paragraph');
    } else {
      setSelectedNode(null);
    }
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
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeEditor]);

  useEffect(() => {
    return mergeRegister(
      editor.registerCommand(
        SELECTION_CHANGE_COMMAND,
        (_payload, newEditor) => {
          updateToolbar();
          setActiveEditor(newEditor);
          return false;
        },
        COMMAND_PRIORITY_CRITICAL,
      ),
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

  useEffect(() => {
    return activeEditor.registerCommand<SetDialogsPayload>(
      SET_DIALOGS_COMMAND,
      (payload) => {
        setDialogs({ ...dialogs, ...payload });
        return false;
      },
      COMMAND_PRIORITY_CRITICAL,
    );
  }, [activeEditor, dialogs]);

  const applyStyleText = useCallback(
    (styles: Record<string, string>) => {
      activeEditor.update(() => {
        const selection = $getSelection();
        if ($isRangeSelection(selection)) {
          $patchStyleText(selection, styles);
          const mathNodes = selection.getNodes().filter($isMathNode);
          $patchStyle(mathNodes, styles);
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

  const FONT_FAMILY_OPTIONS = [
    ['Roboto', 'Roboto'],
    ['KaTeX_Main', 'KaTeX'],
    ['Virgil', 'Virgil'],
    ['Cascadia', 'Cascadia'],
    ['Courier New', 'Courier New'],
    ['Georgia', 'Georgia'],
  ];

  const FONT_SIZE_OPTIONS: [string, string][] = [
    ['10px', '10'],
    ['11px', '11'],
    ['12px', '12'],
    ['13px', '13'],
    ['14px', '14'],
    ['15px', '15'],
    ['16px', '16'],
    ['17px', '17'],
    ['18px', '18'],
    ['19px', '19'],
    ['20px', '20'],
  ];

  const trigger = useScrollTrigger({
    disableHysteresis: true,
    threshold: 32,
  });

  const showMathTools = $isMathNode(selectedNode);
  const showImageTools = $isImageNode(selectedNode);
  const showTextTools = (!showMathTools && !showImageTools) || $isStickyNode(selectedNode);
  return (
    <>
      <AppBar className='toolbar-appbar' elevation={trigger ? 4 : 0} position={trigger ? 'fixed' : 'static'}>
        <Toolbar className="toolbar" sx={{ displayPrint: 'none', px: `${(trigger ? 1 : 0)}!important`, justifyContent: "space-between", alignItems: "center", gap: 0.5, minHeight: 64 }}>
          <Box sx={{ display: "flex" }}>
            <IconButton title={IS_APPLE ? 'Undo (⌘Z)' : 'Undo (Ctrl+Z)'} aria-label="Undo" disabled={!canUndo}
              onClick={() => { activeEditor.dispatchCommand(UNDO_COMMAND, undefined); }}>
              <UndoIcon />
            </IconButton>
            <IconButton title={IS_APPLE ? 'Redo (⌘Y)' : 'Redo (Ctrl+Y)'} aria-label="Redo" disabled={!canRedo}
              onClick={() => { activeEditor.dispatchCommand(REDO_COMMAND, undefined); }}>
              <RedoIcon />
            </IconButton>
          </Box>
          <Box sx={{ display: "flex", gap: 0.5 }}>
            {showMathTools && <MathTools editor={activeEditor} node={selectedNode} />}
            {showImageTools && <ImageTools editor={activeEditor} node={selectedNode} />}
            {showTextTools && <>
              {blockType in blockTypeToBlockName && <BlockFormatSelect blockType={blockType} editor={activeEditor} />}
              {blockType === 'code' ? (
                <Select size='small' onChange={onCodeLanguageSelect} value={codeLanguage}>
                  {CODE_LANGUAGE_OPTIONS.map(([option, text]) => <MenuItem key={option} value={option}>{text}</MenuItem>)}
                </Select>
              ) : (
                <>
                  <Select size='small' sx={{ width: 68 }} onChange={onFontFamilySelect} value={fontFamily}>
                    {FONT_FAMILY_OPTIONS.map(([option, text]) => <MenuItem key={option} value={option}>  {text}</MenuItem>)}
                  </Select>
                  <Select size='small' sx={{ width: 68 }} onChange={onFontSizeSelect} value={fontSize}>
                    {FONT_SIZE_OPTIONS.map(([option, text]) => <MenuItem key={option} value={option}>  {text}</MenuItem>)}
                  </Select>
                  <TextFormatToggles editor={activeEditor} sx={{ display: { xs: "none", sm: "none", md: "none", lg: "flex" } }} />
                </>
              )}
            </>
            }
          </Box>
          <Box sx={{ display: "flex" }}>
            <InsertToolMenu editor={activeEditor} />
            <AlignTextMenu editor={activeEditor} isRTL={isRTL} />
          </Box>
        </Toolbar >
      </AppBar>
      {trigger && <Box sx={(theme) => ({ ...theme.mixins.toolbar, displayPrint: "none" })} />}
      <ImageDialog editor={activeEditor} node={$isImageNode(selectedNode) ? selectedNode : null} open={dialogs.image.open} />
      <GraphDialog editor={activeEditor} node={$isGraphNode(selectedNode) ? selectedNode : null} open={dialogs.graph.open} />
      <SketchDialog editor={activeEditor} node={$isSketchNode(selectedNode) ? selectedNode : null} open={dialogs.sketch.open} />
      <TableDialog editor={activeEditor} open={dialogs.table.open} />
    </>
  );
}

export default function useToolbarPlugin(): null | JSX.Element {
  return <ToolbarPlugin />
}
