import { Typography, Select, MenuItem } from "@mui/material";
import type { EditorState } from "../editor/types";

const Checkpoint2 = [
  {
    name: "Change the font size of the following text to 20px",
    steps: <>
      <Typography variant="subtitle2" gutterBottom>
        1. Select the text
      </Typography>
      <Typography variant="subtitle2" gutterBottom>
        2. Click the
        <Select size='small' sx={{ width: 68, mx: 1 }} value={15} readOnly>
          <MenuItem key={15} value={15}>15</MenuItem>
        </Select>
        menu in the toolbar
      </Typography>
      <Typography variant="subtitle2">
        3. Select 20 from the menu
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
            const target = paragraphNode.getFirstChild();
            if (target && target.getStyle().includes("font-size: 20px")) result = true;
          }
        });
      });
      return result;
    }
  },
  {
    name: "Change the font family of the following text to KaTeX",
    steps: <>
      <Typography variant="subtitle2" gutterBottom>
        1. Select the text
      </Typography>
      <Typography variant="subtitle2" gutterBottom>
        2. Click the
        <Select size='small' sx={{ width: 68, mx: 1 }} value='Roboto' readOnly>
          <MenuItem key='Roboto' value='Roboto'>Roboto</MenuItem>
        </Select>
        menu in the toolbar
      </Typography>
      <Typography variant="subtitle2">
        3. Select KaTeX from the menu
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
            const target = paragraphNode.getFirstChild();
            if (target && target.getStyle().includes("font-family: KaTeX_Main")) result = true;
          }
        });
      });
      return result;
    }
  },
  {
    name: "Change the font family of the following text to Virgil",
    steps: <>
      <Typography variant="subtitle2" gutterBottom>
        1. Select the text
      </Typography>
      <Typography variant="subtitle2" gutterBottom>
        2. Click the
        <Select size='small' sx={{ width: 68, mx: 1 }} value='Roboto' readOnly>
          <MenuItem key='Roboto' value='Roboto'>Roboto</MenuItem>
        </Select>
        menu in the toolbar
      </Typography>
      <Typography variant="subtitle2">
        3. Select Virgil from the menu
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
            const target = paragraphNode.getFirstChild();
            if (target && target.getStyle().includes("font-family: Virgil")) result = true;
          }
        });
      });
      return result;
    }
  },
];

export default Checkpoint2;