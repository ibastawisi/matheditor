import { memo } from 'react';
import { EditorState } from 'lexical';
import { LexicalComposer } from "@lexical/react/LexicalComposer";
import { ContentEditable } from "@lexical/react/LexicalContentEditable";
import { useSharedHistoryContext } from "./context/SharedHistoryContext";

import { RichTextPlugin } from "@lexical/react/LexicalRichTextPlugin";
import { HistoryPlugin } from "@lexical/react/LexicalHistoryPlugin";
import { OnChangePlugin } from '@lexical/react/LexicalOnChangePlugin';
import { TablePlugin } from './plugins/TablePlugin';
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

import { useDispatch } from "react-redux";
import { validate } from 'uuid';
import { AppDispatch } from "../store";
import { actions } from "../store";
import { EditorDocument } from '../store/types';

import Box from '@mui/material/Box';
import isEqual from 'fast-deep-equal'
import { validateData } from './utils/state';
import "./styles.css";
import DragDropPaste from './plugins/DragDropPastePlugin';
import EmojiPickerPlugin from './plugins/EmojiPickerPlugin';
import useLocalStorage from '../hooks/useLocalStorage';
import { IS_MOBILE } from './shared/environment';
import { editorConfig } from './config';

const Editor: React.FC<{ document: EditorDocument, editable: boolean, onChange?: (editorState: EditorState) => void }> =
  ({ document, editable, onChange }) => {
    const [config] = useLocalStorage('config', { debug: false });
    const dispatch = useDispatch<AppDispatch>();

    function handleChange(editorState: EditorState) {
      if (!editable) return;
      const data = editorState.toJSON();
      if (isEqual(data, document.data)) return;
      const updatedDocument: EditorDocument = { ...document, data, updatedAt: new Date().toISOString() };
      validate(document.id) && dispatch(actions.app.saveDocument(updatedDocument));
      onChange && onChange(editorState);
    }

    const disableContextMenu = (e: React.MouseEvent<HTMLDivElement, MouseEvent>) => {
      if (IS_MOBILE) e.preventDefault();
    }

    return (
      <Box className="editor">
        <LexicalComposer initialConfig={{ ...editorConfig, editorState: JSON.stringify(validateData(document.data)), editable }}>
          <ToolbarPlugin />
          <EditorPlugins contentEditable={<ContentEditable className="editor-input" onContextMenu={disableContextMenu} />} onChange={handleChange} showDebugView={config.debug} />
        </LexicalComposer>
      </Box>
    );
  }

export const EditorPlugins: React.FC<{ contentEditable: React.ReactElement; onChange: (editorState: EditorState) => void; showDebugView?: boolean; }> =
  ({ contentEditable, onChange, showDebugView }) => {
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
        <DraggableBlockPlugin />
        <DragDropPaste />
        <CodeHighlightPlugin />
        <AutoLinkPlugin />
      </>
    )
  };

export default memo(Editor, (prev, next) => prev.document.id === next.document.id);