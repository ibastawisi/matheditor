import { memo, useEffect, useState } from 'react';
import { EditorState } from 'lexical';
import { LexicalComposer } from "@lexical/react/LexicalComposer";
import { ContentEditable } from "@lexical/react/LexicalContentEditable";
import { useSharedHistoryContext } from "./context/SharedHistoryContext";

import { RichTextPlugin } from "@lexical/react/LexicalRichTextPlugin";
import { HistoryPlugin } from "@lexical/react/LexicalHistoryPlugin";
import { OnChangePlugin } from '@lexical/react/LexicalOnChangePlugin';
import { TablePlugin } from '@lexical/react/LexicalTablePlugin';
import { LinkPlugin } from "@lexical/react/LexicalLinkPlugin";
import { ListPlugin } from "@lexical/react/LexicalListPlugin";
import { CheckListPlugin } from '@lexical/react/LexicalCheckListPlugin';
import LexicalErrorBoundary from '@lexical/react/LexicalErrorBoundary';
import { TabIndentationPlugin } from '@lexical/react/LexicalTabIndentationPlugin';
import MarkdownPlugin from "./plugins/MarkdownPlugin/MarkdownShortcutPlugin";
import TreeViewPlugin from "./plugins/TreeViewPlugin";
import ToolbarPlugin from "./plugins/ToolbarPlugin";
import ListMaxIndentLevelPlugin from "./plugins/ListPlugin/ListMaxIndentLevelPlugin";
import CodeHighlightPlugin from "./plugins/CodePlugin/CodeHighlightPlugin";
import AutoLinkPlugin from "./plugins/LinkPlugin/AutoLinkPlugin";
import TableCellActionMenuPlugin from './plugins/TablePlugin/TableActionMenuPlugin';
import TableCellResizer from './plugins/TablePlugin/TableCellResizer';
import FloatingToolbarPlugin from "./plugins/FloatingToolbar";
import HorizontalRulePlugin from "./plugins/HorizontalRulePlugin";
import MathPlugin from "./plugins/MathPlugin";
import ImagePlugin from "./plugins/ImagePlugin";
import SketchPlugin from './plugins/SketchPlugin';
import GraphPlugin from './plugins/GraphPlugin';
import StickyPlugin from './plugins/StickyPlugin';
import ClickableLinkPlugin from './plugins/LinkPlugin/ClickableLinkPlugin';
import ComponentPickerMenuPlugin from './plugins/ComponentPickerPlugin';
import DraggableBlockPlugin from './plugins/DraggableBlockPlugin';
import TabFocusPlugin from './plugins/TabFocusPlugin';

import { HeadingNode, QuoteNode } from "@lexical/rich-text";
import { TableCellNode, TableNode, TableRowNode } from "@lexical/table";
import { ListItemNode, ListNode } from "@lexical/list";
import { CodeHighlightNode, CodeNode } from "@lexical/code";
import { AutoLinkNode, LinkNode } from "@lexical/link";
import { HorizontalRuleNode } from "@lexical/react/LexicalHorizontalRuleNode";
import { MathNode } from "./nodes/MathNode";
import { ImageNode } from "./nodes/ImageNode";
import { SketchNode } from './nodes/SketchNode';
import { GraphNode } from './nodes/GraphNode';
import { StickyNode } from './nodes/StickyNode';

import { useDispatch } from "react-redux";
import { validate } from 'uuid';
import { AppDispatch } from "../store";
import { actions } from "../slices";
import { EditorDocument } from "../slices/app";

import Box from '@mui/material/Box';
import SplashScreen from '../components/SplashScreen';
import theme from "./theme";
import isEqual from 'fast-deep-equal'
import { validateData } from './utils/state';
import "./styles.css";
import DragDropPaste from './plugins/DragDropPastePlugin';
import EmojiPickerPlugin from './plugins/EmojiPickerPlugin';
import useLocalStorage from '../hooks/useLocalStorage';

export const editorConfig = {
  namespace: "matheditor",
  // The editor theme
  theme: theme,
  // Handling of errors during update
  onError(error: Error) {
    throw error;
  },
  // Any custom nodes go here
  nodes: [
    HeadingNode,
    ListNode,
    ListItemNode,
    QuoteNode,
    CodeNode,
    CodeHighlightNode,
    TableNode,
    TableCellNode,
    TableRowNode,
    AutoLinkNode,
    LinkNode,
    HorizontalRuleNode,
    MathNode,
    ImageNode,
    SketchNode,
    GraphNode,
    StickyNode,
  ]
};

const Editor: React.FC<{ document: EditorDocument, editable: boolean }> = ({ document, editable }) => {
  const [initialized, setInitialized] = useState(false);
  const [config] = useLocalStorage('config', { debug: false });
  const dispatch = useDispatch<AppDispatch>();

  function onChange(editorState: EditorState) {
    const data = editorState.toJSON();
    if (isEqual(data, document.data)) return;
    const updatedDocument: EditorDocument = { ...document, data, updatedAt: new Date().toISOString() };
    validate(document.id) && dispatch(actions.app.saveDocument(updatedDocument));
  }

  useEffect(() => {
    window.scrollTo(0, 0);
    setInitialized(true);
  }, []);

  return (
    <Box className="editor">
      {!initialized && <SplashScreen title='Loading Editor' />}
      <LexicalComposer initialConfig={{ ...editorConfig, editorState: JSON.stringify(validateData(document.data)), editable }}>
        <ToolbarPlugin />
        <EditorPlugins contentEditable={<ContentEditable className="editor-input" />} onChange={onChange} showDebugView={config.debug} isReady={initialized} />
      </LexicalComposer>
    </Box>
  );
}

export const EditorPlugins: React.FC<{ contentEditable: React.ReactElement; onChange: (editorState: EditorState) => void; showDebugView?: boolean; isReady?: boolean }> =
  ({ contentEditable, onChange, showDebugView, isReady }) => {
    const { historyState } = useSharedHistoryContext();
    return (
      <>
        <RichTextPlugin contentEditable={contentEditable} ErrorBoundary={LexicalErrorBoundary} placeholder={null} />
        <HistoryPlugin externalHistoryState={historyState} />
        <OnChangePlugin ignoreHistoryMergeTagChange ignoreSelectionChange onChange={onChange} />
        {showDebugView && <TreeViewPlugin />}
        <ListPlugin />
        <CheckListPlugin />
        <LinkPlugin />
        <ClickableLinkPlugin />
        <TabFocusPlugin />
        <TabIndentationPlugin />
        <ListMaxIndentLevelPlugin maxDepth={7} />
        <MarkdownPlugin />
        <FloatingToolbarPlugin />
        <HorizontalRulePlugin />
        <TablePlugin />
        <TableCellActionMenuPlugin />
        <TableCellResizer />
        <ComponentPickerMenuPlugin />
        <EmojiPickerPlugin />
        <MathPlugin />
        <ImagePlugin />
        <SketchPlugin />
        <GraphPlugin />
        <StickyPlugin />
        {isReady && <>
          <DraggableBlockPlugin />
          <DragDropPaste />
          <CodeHighlightPlugin />
          <AutoLinkPlugin />
        </>}
      </>
    )
  };

export default memo(Editor, (prev, next) => prev.document.id === next.document.id);