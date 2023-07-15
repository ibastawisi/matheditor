import type { EditorState, LexicalEditor } from "lexical";
import { LexicalComposer, InitialConfigType } from "@lexical/react/LexicalComposer";
import { ContentEditable } from "@lexical/react/LexicalContentEditable";
import { useSharedHistoryContext } from "./context/SharedHistoryContext";
import LexicalErrorBoundary from '@lexical/react/LexicalErrorBoundary';
import { RichTextPlugin } from "@lexical/react/LexicalRichTextPlugin";
import { HistoryPlugin } from "@lexical/react/LexicalHistoryPlugin";
import { OnChangePlugin } from '@lexical/react/LexicalOnChangePlugin';
import { TablePlugin } from './plugins/TablePlugin';
import { LinkPlugin } from "@lexical/react/LexicalLinkPlugin";
import { ListPlugin } from "@lexical/react/LexicalListPlugin";
import { CheckListPlugin } from '@lexical/react/LexicalCheckListPlugin';
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
import DragDropPaste from './plugins/DragDropPastePlugin';
import EmojiPickerPlugin from './plugins/EmojiPickerPlugin';
import { IS_MOBILE } from './shared/environment';
import { editorConfig } from "./config";
import "./styles.css";

export const EditorPlugins: React.FC<{
  contentEditable: React.ReactElement;
  placeholder?: JSX.Element | ((isEditable: boolean) => JSX.Element | null) | null;
  onChange: (editorState: EditorState, editor: LexicalEditor) => void;
  showDebugView?: boolean;
}> =
  ({ contentEditable, placeholder = null, onChange, showDebugView }) => {
    const { historyState } = useSharedHistoryContext();
    return (
      <>
        <RichTextPlugin contentEditable={contentEditable} ErrorBoundary={LexicalErrorBoundary} placeholder={placeholder} />
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

export const Editor: React.FC<{ initialConfig: Partial<InitialConfigType>, appConfig: { debug: boolean }, onChange: (editorState: EditorState) => void }> = ({ initialConfig, appConfig, onChange }) => {
  const disableContextMenu = (e: React.MouseEvent<HTMLDivElement, MouseEvent>) => { if (IS_MOBILE) e.preventDefault(); }
  return (
    <LexicalComposer initialConfig={{ ...editorConfig, ...initialConfig }}>
      <ToolbarPlugin />
      <EditorPlugins contentEditable={<ContentEditable className="editor-input" onContextMenu={disableContextMenu} />} onChange={onChange} showDebugView={appConfig.debug} />
    </LexicalComposer>
  );
}
