"use client"
import { $getNodeByKey, $getSelection, $isNodeSelection, $isRangeSelection, LexicalNode, NodeKey } from 'lexical';
import { $isCodeNode, CODE_LANGUAGE_MAP, CODE_LANGUAGE_FRIENDLY_NAME_MAP } from '../../nodes/CodeNode';
import { $isListNode, ListNode, } from '@lexical/list';
import { useLexicalComposerContext } from '@lexical/react/LexicalComposerContext';
import { $isHeadingNode } from '@lexical/rich-text';
import { $getSelectionStyleValueForProperty, $isParentElementRTL, $patchStyleText, } from '@lexical/selection';
import { $getNearestNodeOfType, mergeRegister, } from '@lexical/utils';
import { CAN_REDO_COMMAND, CAN_UNDO_COMMAND, REDO_COMMAND, SELECTION_CHANGE_COMMAND, UNDO_COMMAND, COMMAND_PRIORITY_CRITICAL, } from 'lexical';
import { useCallback, useEffect, useState } from 'react';
import { BlockFormatSelect } from './Menus/BlockFormatSelect';
import InsertToolMenu from './Menus/InsertToolMenu';
import TextFormatToggles from './Tools/TextFormatToggles';
import AlignTextMenu from './Menus/AlignTextMenu';
import { IS_APPLE, IS_MOBILE } from '../../shared/environment';
import { $isMathNode } from '../../nodes/MathNode';
import MathTools from './Tools/MathTools';
import { $isImageNode } from '../../nodes/ImageNode';
import ImageTools from './Tools/ImageTools';
import { $isGraphNode } from '../../nodes/GraphNode';
import { $patchStyle } from '../../nodes/utils';
import { ImageDialog, GraphDialog, SketchDialog, TableDialog, IFrameDialog, LinkDialog, LayoutDialog, OCRDialog } from './Dialogs';
import { $isStickyNode } from '../../nodes/StickyNode';
import { SelectChangeEvent, useScrollTrigger, AppBar, Toolbar, Box, IconButton, Select, MenuItem, Fab, ToggleButton } from '@mui/material';
import { ImageSearch, Mic, Redo, Undo } from '@mui/icons-material';
import { $isIFrameNode } from '@/editor/nodes/IFrameNode';
import { $findMatchingParent } from '@lexical/utils';
import { $isTableNode, TableNode } from '@/editor/nodes/TableNode';
import TableTools from './Tools/TableTools';
import { $isLinkNode } from '@lexical/link';
import { EditorDialogs, SetDialogsPayload, SET_DIALOGS_COMMAND } from './Dialogs/commands';
import { getSelectedNode } from '@/editor/utils/getSelectedNode';
import { useMeasure } from '@/hooks/useMeasure';
import { SPEECH_TO_TEXT_COMMAND, SUPPORT_SPEECH_RECOGNITION } from '../SpeechToTextPlugin';

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
  const [selectedTable, setSelectedTable] = useState<TableNode | null>(null);
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
    iframe: {
      open: false,
    },
    link: {
      open: false,
    },
    layout: {
      open: false,
    },
    ocr: {
      open: false,
    },
  });
  const [isSpeechToText, setIsSpeechToText] = useState(false);

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
      const node = getSelectedNode(selection);
      if ($isLinkNode(node)) setSelectedNode(node);
      const parent = node.getParent();
      if ($isLinkNode(parent)) setSelectedNode(parent);

      const tableNode = $findMatchingParent(node, $isTableNode) as TableNode | null;
      setSelectedTable(tableNode);
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
      editor.registerCommand<boolean>(
        SPEECH_TO_TEXT_COMMAND,
        (payload) => {
          setIsSpeechToText(payload);
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

  const toolbarTrigger = useScrollTrigger({
    disableHysteresis: true,
    threshold: 32,
  });

  const slideTrigger = useScrollTrigger({
    disableHysteresis: true,
    threshold: 100,
  });

  const showMathTools = $isMathNode(selectedNode);
  const showImageTools = $isImageNode(selectedNode);
  const showTableTools = !!selectedTable;
  const showTextTools = (!showMathTools && !showImageTools) || $isStickyNode(selectedNode);

  const [toolbarRef, toolbarDimensions] = useMeasure();
  const [toolboxRef, toolboxDimensions] = useMeasure();
  const toolboxOverflow = toolbarDimensions.width && toolboxDimensions.width ? toolboxDimensions.width + 168 > toolbarDimensions.width : false;

  return (
    <>
      <AppBar elevation={toolbarTrigger ? 4 : 0} position={toolbarTrigger ? 'fixed' : 'static'}>
        <Toolbar className="editor-toolbar" ref={toolbarRef} sx={{
          displayPrint: 'none', px: `${(toolbarTrigger ? 1 : 0)}!important`,
          display: "grid", gridTemplateColumns: "repeat(3,auto)", gridAutoFlow: "dense",
          justifyContent: "space-between", alignItems: "center", gap: 0.5, py: 1,
        }}>
          <Box sx={{ display: "flex" }}>
            <IconButton title={IS_APPLE ? 'Undo (⌘Z)' : 'Undo (Ctrl+Z)'} aria-label="Undo" disabled={!canUndo}
              onClick={() => { activeEditor.dispatchCommand(UNDO_COMMAND, undefined); }}>
              <Undo />
            </IconButton>
            <IconButton title={IS_APPLE ? 'Redo (⌘Y)' : 'Redo (Ctrl+Y)'} aria-label="Redo" disabled={!canRedo}
              onClick={() => { activeEditor.dispatchCommand(REDO_COMMAND, undefined); }}>
              <Redo />
            </IconButton>
          </Box>
          <Box sx={{ display: "flex", gap: 0.5, mx: 'auto', gridColumn: toolboxOverflow ? "1/-1" : "auto" }} ref={toolboxRef}>
            {showMathTools && <MathTools editor={activeEditor} node={selectedNode} />}
            {(showImageTools) && <ImageTools editor={activeEditor} node={selectedNode} />}
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
                  {showTableTools && <TableTools editor={activeEditor} node={selectedTable} />}
                  <TextFormatToggles editor={activeEditor} sx={{ display: { xs: "none", sm: "none", md: "none", lg: "flex" } }} />
                  <ToggleButton component="label" value="ocr" size='small' onClick={() => {
                    activeEditor.dispatchCommand(SET_DIALOGS_COMMAND, { ocr: { open: true } });
                  }}>
                    <ImageSearch />
                  </ToggleButton>
                </>
              )}
            </>
            }
          </Box>
          <Box sx={{ display: "flex", gridColumn: "3/-1" }}>
            <InsertToolMenu editor={activeEditor} />
            <AlignTextMenu editor={activeEditor} isRTL={isRTL} />
          </Box>
          {(!IS_MOBILE && SUPPORT_SPEECH_RECOGNITION) ? <Fab size='small' color={isSpeechToText ? 'secondary' : 'primary'}
            sx={{ position: 'fixed', right: slideTrigger ? 64 : 24, bottom: 16, px: 2, displayPrint: 'none', transition: `right 225ms ease-in-out` }}
            onClick={() => {
              editor.dispatchCommand(SPEECH_TO_TEXT_COMMAND, !isSpeechToText);
            }}>
            <Mic />
          </Fab> : null}
        </Toolbar >
      </AppBar>
      {toolbarTrigger && <Box sx={(theme) => ({ ...theme.mixins.toolbar, displayPrint: "none" })} />}
      <ImageDialog editor={activeEditor} node={$isImageNode(selectedNode) ? selectedNode : null} open={dialogs.image.open} />
      <GraphDialog editor={activeEditor} node={$isGraphNode(selectedNode) ? selectedNode : null} open={dialogs.graph.open} />
      <SketchDialog editor={activeEditor} node={$isImageNode(selectedNode) ? selectedNode : null} open={dialogs.sketch.open} />
      <TableDialog editor={activeEditor} open={dialogs.table.open} />
      <IFrameDialog editor={activeEditor} node={$isIFrameNode(selectedNode) ? selectedNode : null} open={dialogs.iframe.open} />
      <LinkDialog editor={activeEditor} node={$isLinkNode(selectedNode) ? selectedNode : null} open={dialogs.link.open} />
      <LayoutDialog editor={activeEditor} open={dialogs.layout.open} />
      <OCRDialog editor={activeEditor} open={dialogs.ocr.open} />
    </>
  );
}

export default function useToolbarPlugin(): null | JSX.Element {
  return <ToolbarPlugin />
}
