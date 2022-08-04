import { LexicalEditor, EditorState } from 'lexical';
import { LexicalComposer } from "@lexical/react/LexicalComposer";
import { RichTextPlugin } from "@lexical/react/LexicalRichTextPlugin";
import { ContentEditable } from "@lexical/react/LexicalContentEditable";
import { HistoryPlugin } from "@lexical/react/LexicalHistoryPlugin";
import { OnChangePlugin } from '@lexical/react/LexicalOnChangePlugin';
import { HeadingNode, QuoteNode } from "@lexical/rich-text";
import { TablePlugin } from '@lexical/react/LexicalTablePlugin';
import { TableCellNode, TableNode, TableRowNode } from "@lexical/table";
import { ListItemNode, ListNode } from "@lexical/list";
import { CodeHighlightNode, CodeNode } from "@lexical/code";
import { AutoLinkNode, LinkNode } from "@lexical/link";
import { LinkPlugin } from "@lexical/react/LexicalLinkPlugin";
import { ListPlugin } from "@lexical/react/LexicalListPlugin";
import { CheckListPlugin } from '@lexical/react/LexicalCheckListPlugin';
import { HorizontalRuleNode } from "@lexical/react/LexicalHorizontalRuleNode";
import { MarkdownShortcutPlugin } from "@lexical/react/LexicalMarkdownShortcutPlugin";
import { TRANSFORMERS } from "@lexical/markdown";

import { useSharedHistoryContext } from "./context/SharedHistoryContext";
import TreeViewPlugin from "./plugins/TreeViewPlugin";
import ToolbarPlugin from "./plugins/toolbar/ToolbarPlugin";
import ListMaxIndentLevelPlugin from "./plugins/ListMaxIndentLevelPlugin";
import CodeHighlightPlugin from "./plugins/CodeHighlightPlugin";
import AutoLinkPlugin from "./plugins/AutoLinkPlugin";
import TableCellActionMenuPlugin from './plugins/TableActionMenuPlugin';
import TableCellResizer from './plugins/TableCellResizer';
import TextFormatFloatingToolbarPlugin from "./plugins/TextFormatFloatingToolbarPlugin";
import HorizontalRulePlugin from "./plugins/HorizontalRulePlugin";
import { MathNode } from "./nodes/MathNode";
import MathPlugin from "./plugins/MathPlugin";
import { ImageNode } from "./nodes/ImageNode";
import ImagePlugin from "./plugins/ImagePlugin";
import { SketchNode } from './nodes/SketchNode';
import SketchPlugin from './plugins/SketchPlugin';
import { GraphNode } from './nodes/GraphNode';
import GraphPlugin from './plugins/GraphPlugin';
import { StickyNode } from './nodes/StickyNode';
import StickyPlugin from './plugins/StickyPlugin';

import { useDispatch, useSelector } from "react-redux";
import { AppDispatch, RootState } from "../store";
import { actions } from "../slices";
import { EditorDocument } from "../slices/app";

import theme from "./theme";
import "./styles.css";
import { SxProps, Theme } from '@mui/material/styles';
import Box from '@mui/material/Box';
import { validate } from 'uuid';

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

  const { historyState } = useSharedHistoryContext();
  const config = useSelector((state: RootState) => state.app.config.editor);
  const dispatch = useDispatch<AppDispatch>();

  function onChange(editorState: EditorState, editor: LexicalEditor) {
    const serializedEditorState = editor.getEditorState().toJSON();
    if (JSON.stringify(serializedEditorState) === JSON.stringify(document.data)) {
      return;
    }
    validate(document.id) && dispatch(actions.app.saveDocument(serializedEditorState));
  }

  return (
    <LexicalComposer initialConfig={{ ...editorConfig, editorState: JSON.stringify(document.data), readOnly }}>
      <Box className="editor-shell" sx={sx}>
        <ToolbarPlugin />
        <div className="editor-inner">
          <RichTextPlugin contentEditable={<ContentEditable className="editor-input" />} placeholder="" />
          <HistoryPlugin externalHistoryState={historyState} />
          <OnChangePlugin ignoreInitialChange ignoreSelectionChange onChange={onChange} />
          {config.debug && <TreeViewPlugin />}
          <CodeHighlightPlugin />
          <ListPlugin />
          <CheckListPlugin />
          <LinkPlugin />
          <AutoLinkPlugin />
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
        </div>
      </Box>
    </LexicalComposer>
  );
}

export default Editor;