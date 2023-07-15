import { LexicalComposer, InitialConfigType } from "@lexical/react/LexicalComposer";
import { ContentEditable } from "@lexical/react/LexicalContentEditable";
import { editorConfig } from "./config";
import LexicalErrorBoundary from "@lexical/react/LexicalErrorBoundary";
import { RichTextPlugin } from "@lexical/react/LexicalRichTextPlugin";
import "./styles.css";

export const Viewer: React.FC<{ initialConfig: Partial<InitialConfigType>; }> = ({ initialConfig }) => {
  return (
    <LexicalComposer initialConfig={{ ...editorConfig, ...initialConfig, editable: false }}>
      <RichTextPlugin contentEditable={<ContentEditable className="editor-input" />} ErrorBoundary={LexicalErrorBoundary} placeholder={null} />
    </LexicalComposer>
  );
};

export default Viewer;