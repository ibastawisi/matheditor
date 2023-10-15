"use client"
import { LexicalEditor, } from "lexical";
import { SET_DIALOGS_COMMAND } from "..";
import { SxProps, Theme } from '@mui/material/styles';
import { ToggleButtonGroup, ToggleButton } from "@mui/material";
import { Edit, Delete } from "@mui/icons-material";
import { IFrameNode } from "@/editor/nodes/IFrameNode";

export default function IFrameTools({ editor, node, sx }: { editor: LexicalEditor, node: IFrameNode, sx?: SxProps<Theme> | undefined }): JSX.Element {
  const openIFrameDialog = () => editor.dispatchCommand(SET_DIALOGS_COMMAND, ({ iframe: { open: true } }));

  return (
    <>
      <ToggleButtonGroup size="small" sx={{ ...sx }} >

        <ToggleButton value="edit" key="edit"
          onClick={openIFrameDialog}>
          <Edit />
        </ToggleButton>
        <ToggleButton value="delete"
          onClick={() => {
            editor.update(() => {
              node.selectPrevious();
              node.remove();
            });
          }}>
          <Delete />
        </ToggleButton>
      </ToggleButtonGroup>
    </>
  )
}