"use client"
import type { EditorState, LexicalEditor } from "lexical";
import { useSharedHistoryContext } from "../context/SharedHistoryContext";
import LexicalErrorBoundary from '@lexical/react/LexicalErrorBoundary';
import { RichTextPlugin } from "@lexical/react/LexicalRichTextPlugin";
import { HistoryPlugin } from "@lexical/react/LexicalHistoryPlugin";
import { OnChangePlugin } from '@lexical/react/LexicalOnChangePlugin';
import { AutoFocusPlugin } from '@lexical/react/LexicalAutoFocusPlugin';
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
import { useLexicalComposerContext } from "@lexical/react/LexicalComposerContext";
import { ImageNode } from "../nodes/ImageNode";
import { SketchNode } from "../nodes/SketchNode";
import { GraphNode } from "../nodes/GraphNode";
import { StickyNode } from "../nodes/StickyNode";
import { TableNode } from "../nodes/TableNode";
import { PageBreakNode } from "../nodes/PageBreakNode";
import PageBreakPlugin from "./PageBreakPlugin";
import { IFrameNode } from "../nodes/IFrameNode";
import IFramePlugin from "./IFramePlugin";
import { LayoutPlugin } from "./LayoutPlugin";
import { LayoutContainerNode } from "../nodes/LayoutNode";
import SpeechToTextPlugin from "./SpeechToTextPlugin";

export const EditorPlugins: React.FC<{
  contentEditable: React.ReactElement;
  placeholder?: JSX.Element | ((isEditable: boolean) => JSX.Element | null) | null;
  onChange?: (editorState: EditorState, editor: LexicalEditor, tags: Set<string>) => void;
}> = ({ contentEditable, placeholder = null, onChange }) => {
  const [editor] = useLexicalComposerContext();
  const { historyState } = useSharedHistoryContext();

  return (
    <>
      <RichTextPlugin contentEditable={contentEditable} ErrorBoundary={LexicalErrorBoundary} placeholder={placeholder} />
      <HistoryPlugin externalHistoryState={historyState} />
      {onChange && <OnChangePlugin ignoreHistoryMergeTagChange ignoreSelectionChange onChange={onChange} />}
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
      <ComponentPickerMenuPlugin />
      <MathPlugin />
      <DragDropPaste />
      <CodeHighlightPlugin />
      <AutoLinkPlugin />
      <SpeechToTextPlugin />
      {editor.hasNode(TableNode) && <TablePlugin />}
      {editor.hasNode(TableNode) && <TableCellActionMenuPlugin />}
      {editor.hasNode(TableNode) && <TableCellResizer />}
      {editor.hasNode(ImageNode) && <ImagePlugin />}
      {editor.hasNode(SketchNode) && <SketchPlugin />}
      {editor.hasNode(GraphNode) && <GraphPlugin />}
      {editor.hasNode(StickyNode) && <StickyPlugin />}
      {editor.hasNode(PageBreakNode) && <PageBreakPlugin />}
      {editor.hasNode(IFrameNode) && <IFramePlugin />}
      {editor.hasNode(LayoutContainerNode) && <LayoutPlugin />}
    </>
  );
};
