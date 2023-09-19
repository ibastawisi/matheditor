import type { EditorState } from "../editor/types";
import FormatAlignLeftIcon from '@mui/icons-material/FormatAlignLeft';
import FormatAlignCenterIcon from '@mui/icons-material/FormatAlignCenter';
import FormatAlignRightIcon from '@mui/icons-material/FormatAlignRight';
import FormatIndentIncreaseIcon from '@mui/icons-material/FormatIndentIncrease';
import { Typography, IconButton } from "@mui/material";

const Checkpoint4 = [
  {
    name: "Center the following text",
    steps: <>
      <Typography variant="subtitle2" gutterBottom>
        1. Click the text
      </Typography>
      <Typography variant="subtitle2" gutterBottom>
        2. Click the
        <IconButton aria-label='Align Text'>
          <FormatAlignLeftIcon />
        </IconButton> menu in the toolbar
      </Typography>
      <Typography variant="subtitle2">
        3. Select <FormatAlignCenterIcon sx={{ verticalAlign: "middle" }} /> Align Center from the menu
      </Typography>
    </>,
    check: (editorState?: EditorState) => {
      let result = false;
      if (!editorState) return result;
      editorState.read(() => {
        editorState._nodeMap.forEach((node) => {
          if (node.__value === 1) {
            const paragraphNode = node.getParent()?.getNextSibling();
            if (!paragraphNode) return result;
            if (paragraphNode.__format === 2) result = true;
          }
        });
      });
      return result;
    }
  },
  {
    name: "Right align the following text",
    steps: <>
      <Typography variant="subtitle2" gutterBottom>
        1. Click the text
      </Typography>
      <Typography variant="subtitle2" gutterBottom>
        2. Click the
        <IconButton aria-label='Align Text'>
          <FormatAlignLeftIcon />
        </IconButton> menu in the toolbar
      </Typography>
      <Typography variant="subtitle2">
        3. Select <FormatAlignRightIcon sx={{ verticalAlign: "middle" }} /> Align Right from the menu
      </Typography>
    </>,
    check: (editorState?: EditorState) => {
      let result = false;
      if (!editorState) return result;
      editorState.read(() => {
        editorState._nodeMap.forEach((node) => {
          if (node.__value === 2) {
            const paragraphNode = node.getParent()?.getNextSibling();
            if (!paragraphNode) return result;
            if (paragraphNode.__format === 3) result = true;
          }
        });
      });
      return result;
    }
  },
  {
    name: "Indent the following text by 1 level",
    steps: <>
      <Typography variant="subtitle2" gutterBottom>
        1. Click the text
      </Typography>
      <Typography variant="subtitle2" gutterBottom>
        2. Click the
        <IconButton aria-label='Align Text'>
          <FormatAlignLeftIcon />
        </IconButton> menu in the toolbar
      </Typography>
      <Typography variant="subtitle2">
        3. Select <FormatIndentIncreaseIcon sx={{ verticalAlign: "middle" }} /> Indent from the menu
      </Typography>
    </>,
    check: (editorState?: EditorState) => {
      let result = false;
      if (!editorState) return result;
      editorState.read(() => {
        editorState._nodeMap.forEach((node) => {
          if (node.__value === 3) {
            const paragraphNode = node.getParent()?.getNextSibling();
            if (!paragraphNode) return result;
            if (paragraphNode.getIndent() === 1) result = true;
          }
        });
      });
      return result;
    }
  }
];

export default Checkpoint4;