import theme from "./theme";
import { LexicalEditor, EditorState } from 'lexical';
import { LexicalComposer } from "@lexical/react/LexicalComposer";
import { RichTextPlugin } from "@lexical/react/LexicalRichTextPlugin";
import { ContentEditable } from "@lexical/react/LexicalContentEditable";
import { HistoryPlugin } from "@lexical/react/LexicalHistoryPlugin";
import { OnChangePlugin } from '@lexical/react/LexicalOnChangePlugin';
import { AutoFocusPlugin } from "@lexical/react/LexicalAutoFocusPlugin";
import { HeadingNode, QuoteNode } from "@lexical/rich-text";
import {TablePlugin} from '@lexical/react/LexicalTablePlugin';
import { TableCellNode, TableNode, TableRowNode } from "@lexical/table";
import { ListItemNode, ListNode } from "@lexical/list";
import { CodeHighlightNode, CodeNode } from "@lexical/code";
import { AutoLinkNode, LinkNode } from "@lexical/link";
import { LinkPlugin } from "@lexical/react/LexicalLinkPlugin";
import { ListPlugin } from "@lexical/react/LexicalListPlugin";
import {CheckListPlugin} from '@lexical/react/LexicalCheckListPlugin';
import { HorizontalRuleNode } from "@lexical/react/LexicalHorizontalRuleNode";
import { MarkdownShortcutPlugin } from "@lexical/react/LexicalMarkdownShortcutPlugin";
import { TRANSFORMERS } from "@lexical/markdown";

import TreeViewPlugin from "./plugins/TreeViewPlugin";
import ToolbarPlugin from "./plugins/toolbar/ToolbarPlugin";
import ListMaxIndentLevelPlugin from "./plugins/ListMaxIndentLevelPlugin";
import CodeHighlightPlugin from "./plugins/CodeHighlightPlugin";
import AutoLinkPlugin from "./plugins/AutoLinkPlugin";
import TableCellActionMenuPlugin from './plugins/TableActionMenuPlugin';
import TableCellResizer from './plugins/TableCellResizer';
import TextFormatFloatingToolbarPlugin from "./plugins/TextFormatFloatingToolbarPlugin";
import ImagesPlugin from "./plugins/ImagesPlugin";
import HorizontalRulePlugin from "./plugins/HorizontalRulePlugin";

import { useSharedHistoryContext } from "./context/SharedHistoryContext";
import { ImageNode } from "./nodes/ImageNode";

import "./styles.css";

function Placeholder() {
  return <div className="editor-placeholder">Enter some rich text...</div>;
}

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
    ImageNode,
    HorizontalRuleNode,

  ]
};

// When the editor changes, you can get notified via the
// LexicalOnChangePlugin!
function onChange(editorState: EditorState, editor: LexicalEditor) {
  const serializedEditorState = JSON.stringify(editor.getEditorState().toJSON());
  // console.log(serializedEditorState);



  // const newEditorState = editor.parseEditorState(serializedEditorState);
}

export default function Editor() {
  const { historyState } = useSharedHistoryContext();
  return (
    <LexicalComposer initialConfig={editorConfig}>
      <div className="editor-container">
        <ToolbarPlugin />
        <div className="editor-inner">
          <RichTextPlugin
            contentEditable={<ContentEditable className="editor-input" />}
            placeholder={<Placeholder />}
          />
          <HistoryPlugin externalHistoryState={historyState} />
          <OnChangePlugin onChange={onChange} />
          <TreeViewPlugin />
          <AutoFocusPlugin />
          <CodeHighlightPlugin />
          <ListPlugin />
          <CheckListPlugin />
          <LinkPlugin />
          <AutoLinkPlugin />
          <ListMaxIndentLevelPlugin maxDepth={7} />
          <MarkdownShortcutPlugin transformers={TRANSFORMERS} />
          <TextFormatFloatingToolbarPlugin />
          <ImagesPlugin />
          <HorizontalRulePlugin />
          <TablePlugin />
            <TableCellActionMenuPlugin />
            <TableCellResizer />

        </div>
      </div>
    </LexicalComposer>
  );
}
