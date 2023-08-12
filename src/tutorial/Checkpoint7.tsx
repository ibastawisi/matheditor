import Typography from "@mui/material/Typography";
import type { EditorState } from "../editor/types";

const Checkpoint7 = [
  {
    name: "Insert a Graph after this line",
    steps: <>
      <Typography variant="subtitle2" gutterBottom>
        1. Click the empty line below then type
      </Typography>
      <Typography variant="subtitle2" gutterBottom>
        {'/plot'}
      </Typography>
      <Typography variant="subtitle2" gutterBottom>
        2. Press Enter
      </Typography>
      <Typography variant="subtitle2" gutterBottom>
        3. Type a function then click insert button
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
            if (target?.__type === "graph") result = true;
          }
        });
      });
      return result;
    }
  },
  {
    name: "Insert a Sketch after this line",
    steps: <>
      <Typography variant="subtitle2" gutterBottom>
        1. Click the empty line below then type
      </Typography>
      <Typography variant="subtitle2" gutterBottom>
        {'/sketch'}
      </Typography>
      <Typography variant="subtitle2" gutterBottom>
        2. Press Enter
      </Typography>
      <Typography variant="subtitle2" gutterBottom>
        3. Draw something then click insert button
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
            if (target?.__type === "sketch") result = true;
          }
        });
      });
      return result;
    }
  },
  {
    name: "Insert a 4x4 Table after this line",
    steps: <>
      <Typography variant="subtitle2" gutterBottom>
        1. Click the empty line below then type
      </Typography>
      <Typography variant="subtitle2" gutterBottom>
        {'/4x4'}
      </Typography>
      <Typography variant="subtitle2" gutterBottom>
        2. Press Enter
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
            const target = paragraphNode.getNextSibling();
            if (target?.__type === "table" && target.__size === 4) result = true;
          }
        });
      });
      return result;
    }
  },
];

export default Checkpoint7;