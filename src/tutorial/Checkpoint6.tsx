import { Typography } from "@mui/material";
import type { HeadingNode, EditorState, ListItemNode, TextNode, ParagraphNode, ListNode, MathNode } from "@/editor";

const Checkpoint6 = [
  {
    name: "Insert a level 2 Heading after this line",
    steps: <>
      <Typography variant="subtitle2" gutterBottom>
        1. Click the empty line below then type
      </Typography>
      <Typography variant="subtitle2" gutterBottom>
        ## This is a level 2 heading
      </Typography>
    </>,
    check: (editorState?: EditorState) => {
      let result = false;
      if (!editorState) return result;
      editorState.read(() => {
        const node = [...editorState._nodeMap].find(([_, node]) => node.__type === "listitem" && (node as ListItemNode).__value === 1)?.[1] as ListItemNode;
        if (!node) return result;
        const target = node.getParent()?.getNextSibling<HeadingNode>();
        if (target?.__tag == "h2") result = true;
      });
      return result;
    }
  },

  {
    name: "Insert some bold text after this line",
    steps: <>
      <Typography variant="subtitle2" gutterBottom>
        1. Click the empty line below then type
      </Typography>
      <Typography variant="subtitle2" gutterBottom>
        **bold text**
      </Typography>
    </>,
    check: (editorState?: EditorState) => {
      let result = false;
      if (!editorState) return result;
      editorState.read(() => {
        const node = [...editorState._nodeMap].find(([_, node]) => node.__type === "listitem" && (node as ListItemNode).__value === 2)?.[1] as ListItemNode;
        if (!node) return result;
        const paragraphNode = node.getParent()?.getNextSibling<ParagraphNode>();
        if (!paragraphNode) return result;
        const target = paragraphNode.getFirstChild<TextNode>();
        if (target && target.hasFormat("bold")) result = true;
      });
      return result;
    }
  },
  {
    name: "Insert some italicized text after this line",
    steps: <>
      <Typography variant="subtitle2" gutterBottom>
        1. Click the empty line below then type
      </Typography>
      <Typography variant="subtitle2" gutterBottom>
        *italicized text*
      </Typography>
    </>,
    check: (editorState?: EditorState) => {
      let result = false;
      if (!editorState) return result;
      editorState.read(() => {
        const node = [...editorState._nodeMap].find(([_, node]) => node.__type === "listitem" && (node as ListItemNode).__value === 3)?.[1] as ListItemNode;
        if (!node) return result;
        const paragraphNode = node.getParent()?.getNextSibling<ParagraphNode>();
        if (!paragraphNode) return result;
        const target = paragraphNode.getFirstChild<TextNode>();
        if (target && target.hasFormat("italic")) result = true;
      });
      return result;
    }
  },
  {
    name: "Insert a Blockquote after this line",
    steps: <>
      <Typography variant="subtitle2" gutterBottom>
        1. Click the empty line below then type
      </Typography>
      <Typography variant="subtitle2" gutterBottom>
        {'> This is a blockquote'}
      </Typography>
    </>,
    check: (editorState?: EditorState) => {
      let result = false;
      if (!editorState) return result;
      editorState.read(() => {
        const node = [...editorState._nodeMap].find(([_, node]) => node.__type === "listitem" && (node as ListItemNode).__value === 4)?.[1] as ListItemNode;
        if (!node) return result;
        const target = node.getParent()?.getNextSibling();
        if (target?.__type == "quote") result = true;
      });
      return result;
    }
  },
  {
    name: "Insert a Bulleted List after this line",
    steps: <>
      <Typography variant="subtitle2" gutterBottom>
        1. Click the empty line below then type
      </Typography>
      <Typography variant="subtitle2" gutterBottom>
        {'- This is a bulleted list'}
      </Typography>
    </>,
    check: (editorState?: EditorState) => {
      let result = false;
      if (!editorState) return result;
      editorState.read(() => {
        const node = [...editorState._nodeMap].find(([_, node]) => node.__type === "listitem" && (node as ListItemNode).__value === 5)?.[1] as ListItemNode;
        if (!node) return result;
        const target = node.getParent()?.getNextSibling<ListNode>();
        if (target?.__tag == "ul") result = true;
      });
      return result;
    }
  },
  {
    name: "Insert some inline code after this line",
    steps: <>
      <Typography variant="subtitle2" gutterBottom>
        1. Click the empty line below then type
      </Typography>
      <Typography variant="subtitle2" gutterBottom>
        {'`This is inline code`'}
      </Typography>
    </>,
    check: (editorState?: EditorState) => {
      let result = false;
      if (!editorState) return result;
      editorState.read(() => {
        const node = [...editorState._nodeMap].find(([_, node]) => node.__type === "listitem" && (node as ListItemNode).__value === 6)?.[1] as ListItemNode;
        if (!node) return result;
        const paragraphNode = node.getParent()?.getNextSibling<ParagraphNode>();
        if (!paragraphNode) return result;
        const target = paragraphNode.getFirstChild<TextNode>();
        if (target && target.hasFormat("code")) result = true;
      });
      return result;
    }
  },
  {
    name: "Insert a Code Block after this line",
    steps: <>
      <Typography variant="subtitle2" gutterBottom>
        1. Click the empty line below then type
      </Typography>
      <Typography variant="subtitle2" gutterBottom>
        {'```'}
      </Typography>
      <Typography variant="subtitle2" gutterBottom>
        2. Press Space
      </Typography>
    </>,
    check: (editorState?: EditorState) => {
      let result = false;
      if (!editorState) return result;
      editorState.read(() => {
        const node = [...editorState._nodeMap].find(([_, node]) => node.__type === "listitem" && (node as ListItemNode).__value === 7)?.[1] as ListItemNode;
        if (!node) return result;
        const target = node.getParent()?.getNextSibling();
        if (target?.__type == "code") result = true;
      });
      return result;
    }
  },
  {
    name: "Insert a Horizontal Rule after this line",
    steps: <>
      <Typography variant="subtitle2" gutterBottom>
        1. Click the empty line below then type
      </Typography>
      <Typography variant="subtitle2" gutterBottom>
        {'---'}
      </Typography>
      <Typography variant="subtitle2" gutterBottom>
        2. Press Space
      </Typography>
    </>,
    check: (editorState?: EditorState) => {
      let result = false;
      if (!editorState) return result;
      editorState.read(() => {
        const node = [...editorState._nodeMap].find(([_, node]) => node.__type === "listitem" && (node as ListItemNode).__value === 8)?.[1] as ListItemNode;
        if (!node) return result;
        const target = node.getParent()?.getNextSibling();
        if (target?.__type === "horizontalrule") result = true;
      });
      return result;
    }
  },
  {
    name: "Insert a Link after this line",
    steps: <>
      <Typography variant="subtitle2" gutterBottom>
        1. Click the empty line below then type
      </Typography>
      <Typography variant="subtitle2" gutterBottom>
        {'[This is a link](https://www.example.com)'}
      </Typography>
    </>,
    check: (editorState?: EditorState) => {
      let result = false;
      if (!editorState) return result;
      editorState.read(() => {
        const node = [...editorState._nodeMap].find(([_, node]) => node.__type === "listitem" && (node as ListItemNode).__value === 9)?.[1] as ListItemNode;
        if (!node) return result;
        const paragraphNode = node.getParent()?.getNextSibling<ParagraphNode>();
        if (!paragraphNode) return result;
        const target = paragraphNode.getFirstChild();
        if (target?.__type === "link") result = true;
      });
      return result;
    }
  },
  {
    name: "Insert an Image after this line",
    steps: <>
      <Typography variant="subtitle2" gutterBottom>
        1. Click the empty line below then type
      </Typography>
      <Typography variant="subtitle2" gutterBottom>
        {'![Math Editor Logo](https://matheditor.me/logo.svg)'}
      </Typography>
    </>,
    check: (editorState?: EditorState) => {
      let result = false;
      if (!editorState) return result;
      editorState.read(() => {
        const node = [...editorState._nodeMap].find(([_, node]) => node.__type === "listitem" && (node as ListItemNode).__value === 10)?.[1] as ListItemNode;
        if (!node) return result;
        const paragraphNode = node.getParent()?.getNextSibling<ParagraphNode>();
        if (!paragraphNode) return result;
        const target = paragraphNode.getFirstChild();
        if (target?.__type === "image") result = true;
      });
      return result;
    }
  },
  {
    name: "Insert a Math field after this line",
    steps: <>
      <Typography variant="subtitle2" gutterBottom>
        1. Click the empty line below then type
      </Typography>
      <Typography variant="subtitle2" gutterBottom>
        {'$$'}
      </Typography>
    </>,
    check: (editorState?: EditorState) => {
      let result = false;
      if (!editorState) return result;
      editorState.read(() => {
        const node = [...editorState._nodeMap].find(([_, node]) => node.__type === "listitem" && (node as ListItemNode).__value === 11)?.[1] as ListItemNode;
        if (!node) return result;
        const paragraphNode = node.getParent()?.getNextSibling<ParagraphNode>();
        if (!paragraphNode) return result;
        const target = paragraphNode.getFirstChild();
        if (target?.__type === "math") result = true;
      });
      return result;
    }
  },
  {
    name: "Insert a Math field with initial value y=x^2 after this line",
    steps: <>
      <Typography variant="subtitle2" gutterBottom>
        1. Click the empty line below then type
      </Typography>
      <Typography variant="subtitle2" gutterBottom>
        {'$y=x^2$'}
      </Typography>
    </>,
    check: (editorState?: EditorState) => {
      let result = false;
      if (!editorState) return result;
      editorState.read(() => {
        const node = [...editorState._nodeMap].find(([_, node]) => node.__type === "listitem" && (node as ListItemNode).__value === 12)?.[1] as ListItemNode;
        if (!node) return result;
        const paragraphNode = node.getParent()?.getNextSibling<ParagraphNode>();
        if (!paragraphNode) return result;
        const target = paragraphNode.getFirstChild<MathNode>();
        if (target?.__type === "math" && target.__value === "y=x^2") result = true;
      });
      return result;
    }
  },
];

export default Checkpoint6;