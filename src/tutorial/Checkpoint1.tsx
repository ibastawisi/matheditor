import { FormatBold, FormatItalic, FormatUnderlined, Code, FormatStrikethrough, Subscript, Superscript, FormatColorFill } from "@mui/icons-material";
import { ListItemNode, type EditorState, TextNode } from "../editor/types";
import { Typography, ToggleButton } from "@mui/material";

const Checkpoint1 = [
  {
    name: "Make the following text bold",
    steps: <>
      <Typography variant="subtitle2" gutterBottom>
        1. Select the text
      </Typography>
      <Typography variant="subtitle2">
        2. Click the
        <ToggleButton value="bold" size="small" sx={{ m: 1 }}>
          <FormatBold />
        </ToggleButton>
        button in the toolbar
      </Typography>
    </>,
    check: (editorState?: EditorState) => {
      let result = false;
      if (!editorState) return result;
      editorState.read(() => {
        const node = [...editorState._nodeMap].find(([_, node]) => node.__type === "listitem" && (node as ListItemNode).__value === 1)?.[1] as ListItemNode;
        if (!node) return result;
        const paragraphNode = node.getParent()?.getNextSibling();
        if (!paragraphNode) return result;
        const target = paragraphNode.getFirstChild();
        if (target && target.hasFormat("bold")) result = true;
      });
      return result;
    }
  },
  {
    name: "Make the following text italic",
    steps: <>
      <Typography variant="subtitle2" gutterBottom>
        1. Select the text
      </Typography>
      <Typography variant="subtitle2">
        2. Click the
        <ToggleButton value="italic" size="small" sx={{ m: 1 }}>
          <FormatItalic />
        </ToggleButton>
        button in the toolbar
      </Typography>
    </>,
    check: (editorState?: EditorState) => {
      let result = false;
      if (!editorState) return result;
      editorState.read(() => {
        const node = [...editorState._nodeMap].find(([_, node]) => node.__type === "listitem" && (node as ListItemNode).__value === 2)?.[1] as ListItemNode;
        if (!node) return result;
        const paragraphNode = node.getParent()?.getNextSibling();
        if (!paragraphNode) return result;
        const target = paragraphNode.getFirstChild();
        if (target && target.hasFormat("italic")) result = true;
      });
      return result;
    }
  },
  {
    name: "Make the following text underlined",
    steps: <>
      <Typography variant="subtitle2" gutterBottom>
        1. Select the text
      </Typography>
      <Typography variant="subtitle2">
        2. Click the
        <ToggleButton value="underline" size="small" sx={{ m: 1 }}>
          <FormatUnderlined />
        </ToggleButton>
        button in the toolbar
      </Typography>
    </>,
    check: (editorState?: EditorState) => {
      let result = false;
      if (!editorState) return result;
      editorState.read(() => {
        const node = [...editorState._nodeMap].find(([_, node]) => node.__type === "listitem" && (node as ListItemNode).__value === 3)?.[1] as ListItemNode;
        if (!node) return result;
        const paragraphNode = node.getParent()?.getNextSibling();
        if (!paragraphNode) return result;
        const target = paragraphNode.getFirstChild();
        if (target && target.hasFormat("underline")) result = true;
      });
      return result;
    }
  },
  {
    name: "Format the following text inline code",
    steps: <>
      <Typography variant="subtitle2" gutterBottom>
        1. Select the text
      </Typography>
      <Typography variant="subtitle2">
        2. Click the
        <ToggleButton value="code" size="small" sx={{ m: 1 }}>
          <Code />
        </ToggleButton>
        button in the toolbar
      </Typography>
    </>,
    check: (editorState?: EditorState) => {
      let result = false;
      if (!editorState) return result;
      editorState.read(() => {
        const node = [...editorState._nodeMap].find(([_, node]) => node.__type === "listitem" && (node as ListItemNode).__value === 4)?.[1] as ListItemNode;
        if (!node) return result;
        const paragraphNode = node.getParent()?.getNextSibling();
        if (!paragraphNode) return result;
        const target = paragraphNode.getFirstChild();
        if (target && target.hasFormat("code")) result = true;
      });
      return result;
    }
  },
  {
    name: "Format the following text with a strikethrough",
    steps: <>
      <Typography variant="subtitle2" gutterBottom>
        1. Select the text
      </Typography>
      <Typography variant="subtitle2">
        2. Click the
        <ToggleButton value="strike" size="small" sx={{ m: 1 }}>
          <FormatStrikethrough />
        </ToggleButton>
        button in the toolbar
      </Typography>
    </>,
    check: (editorState?: EditorState) => {
      let result = false;
      if (!editorState) return result;
      editorState.read(() => {
        const node = [...editorState._nodeMap].find(([_, node]) => node.__type === "listitem" && (node as ListItemNode).__value === 5)?.[1] as ListItemNode;
        if (!node) return result;
        const paragraphNode = node.getParent()?.getNextSibling();
        if (!paragraphNode) return result;
        const target = paragraphNode.getFirstChild();
        if (target && target.hasFormat("strikethrough")) result = true;
      });
      return result;
    }
  },
  {
    name: 'Make the word "subscript" a subscript',
    steps: <>
      <Typography variant="subtitle2" gutterBottom>
        1. Select the word
      </Typography>
      <Typography variant="subtitle2">
        2. Click the
        <ToggleButton value="subscript" size="small" sx={{ m: 1 }}>
          <Subscript />
        </ToggleButton>
        button in the toolbar
      </Typography>
    </>,
    check: (editorState?: EditorState) => {
      let result = false;
      if (!editorState) return result;
      editorState.read(() => {
        editorState._nodeMap.forEach((node) => {
          if (node.getTextContent() === "subscript") {
            if ((node as TextNode).hasFormat("subscript")) result = true;
          }
        });
      });
      return result;
    }
  },
  {
    name: 'Make the word "superscript" a superscript',
    steps: <>
      <Typography variant="subtitle2" gutterBottom>
        1. Select the word
      </Typography>
      <Typography variant="subtitle2">
        2. Click the
        <ToggleButton value="superscript" size="small" sx={{ m: 1 }}>
          <Superscript />
        </ToggleButton>
        button in the toolbar
      </Typography>
    </>,
    check: (editorState?: EditorState) => {
      let result = false;
      if (!editorState) return result;
      editorState.read(() => {
        editorState._nodeMap.forEach((node) => {
          if (node.getTextContent() === "superscript") {
            if ((node as TextNode).hasFormat("superscript")) result = true;
          }
        });
      });
      return result;
    }
  },
  {
    name: "Change the font color of the following text",
    steps: <>
      <Typography variant="subtitle2" gutterBottom>
        1. Select the text
      </Typography>
      <Typography variant="subtitle2" gutterBottom>
        2. Click the
        <ToggleButton value="text" size="small" sx={{ m: 1 }}>
          <FormatColorFill />
        </ToggleButton>
        button in the toolbar
      </Typography>
      <Typography variant="subtitle2">
        3. Select a text color
      </Typography>
    </>,
    check: (editorState?: EditorState) => {
      let result = false;
      if (!editorState) return result;
      editorState.read(() => {
        const node = [...editorState._nodeMap].find(([_, node]) => node.__type === "listitem" && (node as ListItemNode).__value === 8)?.[1] as ListItemNode;
        if (!node) return result;
        const paragraphNode = node.getParent()?.getNextSibling();
        if (!paragraphNode) return result;
        const target = paragraphNode.getFirstChild();
        if (target && target.getStyle().includes("color")) result = true;
      });
      return result;
    }
  },
  {
    name: "Change the background color of the following text",
    steps: <>
      <Typography variant="subtitle2" gutterBottom>
        1. Select the text
      </Typography>
      <Typography variant="subtitle2" gutterBottom>
        2. Click the
        <ToggleButton value="background" size="small" sx={{ m: 1 }}>
          <FormatColorFill />
        </ToggleButton>
        button in the toolbar
      </Typography>
      <Typography variant="subtitle2">
        3. Select a background color
      </Typography>
    </>,
    check: (editorState?: EditorState) => {
      let result = false;
      if (!editorState) return result;
      editorState.read(() => {
        const node = [...editorState._nodeMap].find(([_, node]) => node.__type === "listitem" && (node as ListItemNode).__value === 9)?.[1] as ListItemNode;
        if (!node) return result;
        const paragraphNode = node.getParent()?.getNextSibling();
        if (!paragraphNode) return result;
        const target = paragraphNode.getFirstChild();
        if (target && target.getStyle().includes("background-color")) result = true;
      });
      return result;
    }
  },
];

export default Checkpoint1;