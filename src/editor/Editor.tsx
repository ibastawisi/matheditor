"use client"
import type { EditorState, LexicalEditor } from "lexical";
import { ContentEditable } from "@lexical/react/LexicalContentEditable";
import { OnChangePlugin } from "@lexical/react/LexicalOnChangePlugin";
import { Box } from "@mui/material";
import { ToolbarComponent } from "./extensions/toolbar/component";

export const Editor: React.FC<{
  onChange?: (editorState: EditorState, editor: LexicalEditor, tags: Set<string>) => void;
  ignoreHistoryMerge?: boolean;
}> = ({ onChange, ignoreHistoryMerge = true }) => {
  return (
    <Box className="editor-container" sx={{ position: "relative" }}>
      <ToolbarComponent />
      {/* the editor root's parent hosts the pages of a paged document */}
      <div className="editor-pages">
        <ContentEditable className="editor-input" ariaLabel="editor input" />
      </div>
      {onChange && <OnChangePlugin ignoreHistoryMergeTagChange={ignoreHistoryMerge} ignoreSelectionChange onChange={onChange} />}
    </Box>
  );
};

export default Editor;
