"use client"
import { $getNodeByKey, $getSelection, $isNodeSelection, $isRangeSelection, LexicalNode, NodeKey } from 'lexical';
import { $isCodeNode, CODE_LANGUAGE_MAP, CODE_LANGUAGE_FRIENDLY_NAME_MAP } from '@lexical/code';
import { $isListNode, ListNode, } from '@lexical/list';
import { useLexicalComposerContext } from '@lexical/react/LexicalComposerContext';
import { $isHeadingNode } from '@lexical/rich-text';
import { $isParentElementRTL, } from '@lexical/selection';
import { $getNearestNodeOfType, mergeRegister, } from '@lexical/utils';
import { CAN_REDO_COMMAND, CAN_UNDO_COMMAND, REDO_COMMAND, SELECTION_CHANGE_COMMAND, UNDO_COMMAND, COMMAND_PRIORITY_CRITICAL, } from 'lexical';
import { useCallback, useEffect, useState } from 'react';
import { BlockFormatSelect } from './Menus/BlockFormatSelect';
import InsertToolMenu from './Menus/InsertToolMenu';
import TextFormatToggles from './Tools/TextFormatToggles';
import AlignTextMenu from './Menus/AlignTextMenu';
import { IS_MOBILE } from '@/shared/environment';
import { $isMathNode } from '@/editor/nodes/MathNode';
import MathTools from './Tools/MathTools';
import { $isImageNode } from '@/editor/nodes/ImageNode';
import ImageTools from './Tools/ImageTools';
import { $isGraphNode } from '@/editor/nodes/GraphNode';
import { ImageDialog, GraphDialog, SketchDialog, TableDialog, IFrameDialog, LinkDialog, LayoutDialog, OCRDialog } from './Dialogs';
import { $isStickyNode } from '@/editor/nodes/StickyNode';
import { SelectChangeEvent, useScrollTrigger, AppBar, Toolbar, Box, IconButton, Select, MenuItem, Fab } from '@mui/material';
import { Code, Mic, Redo, Undo } from '@mui/icons-material';
import { $isIFrameNode } from '@/editor/nodes/IFrameNode';
import { IS_APPLE, $findMatchingParent } from '@lexical/utils';
import { $isTableNode, TableNode } from '@/editor/nodes/TableNode';
import TableTools from './Tools/TableTools';
import { $isLinkNode } from '@lexical/link';
import { EditorDialogs, SetDialogsPayload, SET_DIALOGS_COMMAND } from './Dialogs/commands';
import { getSelectedNode } from '@/editor/utils/getSelectedNode';
import { SPEECH_TO_TEXT_COMMAND, SUPPORT_SPEECH_RECOGNITION } from '../SpeechToTextPlugin';
import AITools from './Tools/AITools';
import useOnlineStatus from '@/hooks/useOnlineStatus';
import FontSelect from './Menus/FontSelect';
import CodeTools from './Tools/CodeTools';

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




function ToolbarPlugin() {
  const [editor] = useLexicalComposerContext();
  const [activeEditor, setActiveEditor] = useState(editor);
  const [blockType, setBlockType] = useState<keyof typeof blockTypeToBlockName>('paragraph');
  const [isRTL, setIsRTL] = useState(false);
  const [canUndo, setCanUndo] = useState(false);
  const [canRedo, setCanRedo] = useState(false);
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
      setBlockType('paragraph');
    } else {
      setSelectedNode(null);
    }
    if ($isRangeSelection(selection)) {
      const node = getSelectedNode(selection);
      if ($isLinkNode(node)) setSelectedNode(node);
      const parent = node.getParent();
      if ($isLinkNode(parent)) setSelectedNode(parent);

      const tableNode = $findMatchingParent(node, $isTableNode);
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
            setSelectedNode(element);
            return;
          }
        }
      }
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

  const toolbarTrigger = useScrollTrigger({
    disableHysteresis: IS_MOBILE,
    threshold: 32,
  });

  const slideTrigger = useScrollTrigger({
    disableHysteresis: true,
    threshold: 100,
  });

  const isOnline = useOnlineStatus();

  const showMathTools = $isMathNode(selectedNode);
  const showImageTools = $isImageNode(selectedNode);
  const showCodeTools = $isCodeNode(selectedNode);
  const showTableTools = !!selectedTable;
  const showTextTools = (!showMathTools && !showImageTools) || $isStickyNode(selectedNode);
  const showTextFormatTools = showTextTools && !showCodeTools;
  const showAITools = !!isOnline;

  return (
    <>
      <AppBar elevation={toolbarTrigger ? 4 : 0} position={toolbarTrigger ? 'fixed' : 'static'}>
        <Toolbar className="editor-toolbar" sx={{
          position: "relative",
          displayPrint: 'none', px: `${(toolbarTrigger ? 1 : 0)}!important`,
          justifyContent: "space-between", alignItems: "start", gap: 0.5, py: 1,
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
          <Box sx={{ display: "flex", gap: 0.5, mx: 'auto', flexWrap: "wrap", justifyContent: "center" }}>
            {showMathTools && <MathTools editor={activeEditor} node={selectedNode} />}
            {showImageTools && <ImageTools editor={activeEditor} node={selectedNode} />}
            {showTextTools && <>
              {blockType in blockTypeToBlockName && <BlockFormatSelect blockType={blockType} editor={activeEditor} />}
              {showCodeTools && <CodeTools editor={activeEditor} node={selectedNode} />}
              {showTextFormatTools && <FontSelect editor={activeEditor} />}
              {showAITools && <AITools editor={activeEditor} />}
              {showTableTools && <TableTools editor={activeEditor} node={selectedTable} />}
              {showTextFormatTools && <TextFormatToggles editor={activeEditor} sx={{ display: { xs: "none", sm: "none", md: "none", lg: "flex" } }} />}
            </>}
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
