"use client"
import type { EditorState, LexicalEditor } from "lexical";
import { useSharedHistoryContext } from "../context/SharedHistoryContext";
import LexicalErrorBoundary from '@lexical/react/LexicalErrorBoundary';
import { RichTextPlugin } from "@lexical/react/LexicalRichTextPlugin";
import { HistoryPlugin } from "@lexical/react/LexicalHistoryPlugin";
import { OnChangePlugin } from '@lexical/react/LexicalOnChangePlugin';
import { TablePlugin } from './TablePlugin';
import { LinkPlugin } from "@lexical/react/LexicalLinkPlugin";
import { ListPlugin } from "@lexical/react/LexicalListPlugin";
import { CheckListPlugin } from '@lexical/react/LexicalCheckListPlugin';
import { TabIndentationPlugin } from '@lexical/react/LexicalTabIndentationPlugin';
import MarkdownPlugin from "./MarkdownPlugin/MarkdownShortcutPlugin";
import ListMaxIndentLevelPlugin from "./ListPlugin/ListMaxIndentLevelPlugin";
import CodeHighlightPlugin from "./CodePlugin/CodeHighlightPlugin";
import AutoLinkPlugin from "./LinkPlugin/AutoLinkPlugin";
import TableCellActionMenuPlugin from './TablePlugin/TableActionMenuPlugin';
import TableCellResizer from './TablePlugin/TableCellResizer';
import FloatingToolbarPlugin from "./FloatingToolbar";
import HorizontalRulePlugin from "./HorizontalRulePlugin";
import MathPlugin from "./MathPlugin";
import ImagePlugin from "./ImagePlugin";
import SketchPlugin from './SketchPlugin';
import GraphPlugin from './GraphPlugin';
import StickyPlugin from './StickyPlugin';
import ClickableLinkPlugin from './LinkPlugin/ClickableLinkPlugin';
import ComponentPickerMenuPlugin from './ComponentPickerPlugin';
import TabFocusPlugin from './TabFocusPlugin';
import DragDropPaste from './DragDropPastePlugin';
import EmojiPickerPlugin from './EmojiPickerPlugin';

export const EditorPlugins: React.FC<{
  contentEditable: React.ReactElement;
  placeholder?: JSX.Element | ((isEditable: boolean) => JSX.Element | null) | null;
  onChange: (editorState: EditorState, editor: LexicalEditor) => void;
}> = ({ contentEditable, placeholder = null, onChange }) => {
  const { historyState } = useSharedHistoryContext();

  return (
    <>
      <RichTextPlugin contentEditable={contentEditable} ErrorBoundary={LexicalErrorBoundary} placeholder={placeholder} />
      <HistoryPlugin externalHistoryState={historyState} />
      <OnChangePlugin ignoreHistoryMergeTagChange ignoreSelectionChange onChange={onChange} />
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
      <DragDropPaste />
      <CodeHighlightPlugin />
      <AutoLinkPlugin />
    </>
  );
};
