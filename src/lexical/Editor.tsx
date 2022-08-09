import { memo, useEffect, useState } from 'react';
import { LexicalEditor, EditorState } from 'lexical';
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
import { MarkdownShortcutPlugin } from "@lexical/react/LexicalMarkdownShortcutPlugin";
import { TRANSFORMERS } from "./plugins/MarkdownTransforms";
import TreeViewPlugin from "./plugins/TreeViewPlugin";
import ToolbarPlugin from "./plugins/toolbar/ToolbarPlugin";
import ListMaxIndentLevelPlugin from "./plugins/ListMaxIndentLevelPlugin";
import CodeHighlightPlugin from "./plugins/CodeHighlightPlugin";
import AutoLinkPlugin from "./plugins/AutoLinkPlugin";
import TableCellActionMenuPlugin from './plugins/TableActionMenuPlugin';
import TableCellResizer from './plugins/TableCellResizer';
import TextFormatFloatingToolbarPlugin from "./plugins/TextFormatFloatingToolbarPlugin";
import HorizontalRulePlugin from "./plugins/HorizontalRulePlugin";
import MathPlugin from "./plugins/MathPlugin";
import ImagePlugin from "./plugins/ImagePlugin";
import SketchPlugin from './plugins/SketchPlugin';
import GraphPlugin from './plugins/GraphPlugin';
import StickyPlugin from './plugins/StickyPlugin';

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

import { useDispatch, useSelector } from "react-redux";
import { validate } from 'uuid';
import { AppDispatch, RootState } from "../store";
import { actions } from "../slices";
import { EditorDocument } from "../slices/app";

import Box from '@mui/material/Box';
import { SxProps, Theme } from '@mui/material/styles';
import SplashScreen from '../components/SplachScreen';
import theme from "./theme";
import "./styles.css";

const editorConfig = {
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

const Editor: React.FC<{ document: EditorDocument, sx?: SxProps<Theme> | undefined, readOnly?: boolean }> = ({ document, sx, readOnly }) => {
  const [initialized, setInitialized] = useState(false);
  const { historyState } = useSharedHistoryContext();
  const config = useSelector((state: RootState) => state.app.config.editor);
  const dispatch = useDispatch<AppDispatch>();

  function onChange(editorState: EditorState, editor: LexicalEditor) {
    const data = editorState.toJSON();
    if (JSON.stringify(data) === JSON.stringify(document.data)) return;
    validate(document.id) && dispatch(actions.app.saveDocument(data));
  }

  useEffect(() => { setInitialized(true); }, []);

  return (
    <>
      {!initialized && <SplashScreen title='Loading Editor' />}
      <LexicalComposer initialConfig={{ ...editorConfig, editorState: JSON.stringify(document.data), readOnly }}>
        <Box className="editor-shell" sx={sx}>
          <ToolbarPlugin />
          <div className="editor-inner">
            <RichTextPlugin contentEditable={<ContentEditable className="editor-input" />} placeholder="" />
            <HistoryPlugin externalHistoryState={historyState} />
            <OnChangePlugin ignoreSelectionChange onChange={onChange} />
            {config.debug && <TreeViewPlugin />}
            <ListPlugin />
            <CheckListPlugin />
            <LinkPlugin />
            <ListMaxIndentLevelPlugin maxDepth={7} />
            <MarkdownShortcutPlugin transformers={TRANSFORMERS} />
            <TextFormatFloatingToolbarPlugin />
            <HorizontalRulePlugin />
            <TablePlugin />
            <TableCellActionMenuPlugin />
            <TableCellResizer />
            <MathPlugin />
            <ImagePlugin />
            <SketchPlugin />
            <GraphPlugin />
            <StickyPlugin />
            {initialized && <>
              <CodeHighlightPlugin />
              <AutoLinkPlugin />
            </>}
          </div>
        </Box>
      </LexicalComposer>
    </>
  );
}

export default memo(Editor, (prev, next) => prev.document.id === next.document.id);