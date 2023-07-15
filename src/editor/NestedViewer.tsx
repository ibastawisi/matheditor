import { ContentEditable } from "@lexical/react/LexicalContentEditable";
import LexicalErrorBoundary from "@lexical/react/LexicalErrorBoundary";
import { RichTextPlugin } from "@lexical/react/LexicalRichTextPlugin";
import { LexicalNestedComposer } from "@lexical/react/LexicalNestedComposer";
import type { LexicalEditor } from "lexical";


export const NestedViewer: React.FC<{ initialEditor: LexicalEditor; }> = ({ initialEditor }) => <LexicalNestedComposer initialEditor={initialEditor}>
  <RichTextPlugin contentEditable={<ContentEditable className="nested-contentEditable" />} ErrorBoundary={LexicalErrorBoundary} placeholder={null} />;
</LexicalNestedComposer>;

export default NestedViewer;