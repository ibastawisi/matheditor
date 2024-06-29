import { Add, Brush, Functions, HorizontalRule, Image as ImageIcon, StickyNote2, TableChart } from "@mui/icons-material";
import type { ParagraphNode, EditorState, LexicalNode, ListItemNode, MathNode } from "@/editor";
import { IconButton, SvgIcon, Typography } from "@mui/material";

const Graph = () => <SvgIcon viewBox='0 0 512 512' fontSize='small' sx={{ verticalAlign: "middle" }}>
  <path d="M500.364,244.365h-37.248c12.695-18.223,27.124-31.674,42.415-39.273c5.76-2.851,8.099-9.844,5.248-15.593    c-2.851-5.76-9.821-8.122-15.593-5.248c-24.041,11.927-45.894,34.804-63.185,66.129c-22.726,41.146-52.166,63.802-82.909,63.802    c-26.077,0-51.188-16.465-72.087-46.545H384c6.423,0,11.636-5.201,11.636-11.636c0-6.435-5.213-11.636-11.636-11.636H267.636v-128    h11.636c4.701,0,8.948-2.828,10.752-7.18s0.803-9.356-2.525-12.684l-23.273-23.273c-4.55-4.55-11.904-4.55-16.454,0L224.5,96.502    c-3.328,3.328-4.329,8.332-2.525,12.684s6.051,7.18,10.752,7.18h11.636V218.09c-23.599-28.323-51.7-43.543-81.455-43.543    c-37.876,0-72.972,24.879-99.607,69.818H11.636C5.213,244.365,0,249.567,0,256.001c0,6.435,5.213,11.636,11.636,11.636h37.248    C36.189,285.86,21.76,299.312,6.47,306.911c-5.76,2.851-8.099,9.844-5.248,15.593c2.025,4.108,6.144,6.47,10.426,6.47    c1.734,0,3.503-0.384,5.167-1.21C40.855,315.836,62.708,292.959,80,261.633c22.726-41.158,52.166-63.814,82.909-63.814    c26.077,0,51.188,16.465,72.087,46.545H128c-6.423,0-11.636,5.201-11.636,11.636c0,6.435,5.213,11.636,11.636,11.636h116.364    v162.909c0,6.435,5.213,11.636,11.636,11.636s11.636-5.201,11.636-11.636V293.913c23.599,28.323,51.7,43.543,81.455,43.543    c37.876,0,72.972-24.879,99.607-69.818h51.665c6.423,0,11.636-5.201,11.636-11.636C512,249.567,506.787,244.365,500.364,244.365z" />
</SvgIcon>;

const Checkpoint5 = [
  {
    name: "Insert a Divider after this line",
    steps: <>
      <Typography variant="subtitle2" gutterBottom>
        1. Click the empty line below
      </Typography>
      <Typography variant="subtitle2" gutterBottom>
        2. Click the
        <IconButton aria-label='Insert'>
          <Add />
        </IconButton> button in the toolbar
      </Typography>
      <Typography variant="subtitle2">
        3. Select <HorizontalRule sx={{ verticalAlign: "middle" }} /> Divider from the menu
      </Typography>
    </>,
    check: (editorState?: EditorState) => {
      let result = false;
      if (!editorState) return result;
      editorState.read(() => {
        const node = [...editorState._nodeMap].find(([_, node]) => node.__type === "listitem" && (node as ListItemNode).__value === 1)?.[1] as ListItemNode;
        if (!node) return result;
        const target = node.getParent()?.getNextSibling()?.getNextSibling();
        if (target?.__type === "horizontalrule") result = true;
      });
      return result;
    }
  },
  {
    name: "Insert a Math field after this line",
    steps: <>
      <Typography variant="subtitle2" gutterBottom>
        1. Click the empty line below
      </Typography>
      <Typography variant="subtitle2" gutterBottom>
        2. Click the
        <IconButton aria-label='Insert'>
          <Add />
        </IconButton> button in the toolbar
      </Typography>
      <Typography variant="subtitle2">
        3. Select <Functions sx={{ verticalAlign: "middle" }} /> Math from the menu
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
        const target = paragraphNode.getFirstChild<MathNode>();
        if (target?.__type === "math" && target.__value === "x^2+5x+6=0") result = true;
      });
      return result;
    }
  },
  {
    name: "Insert a Graph after this line",
    steps: <>
      <Typography variant="subtitle2" gutterBottom>
        1. Click the empty line below
      </Typography>
      <Typography variant="subtitle2" gutterBottom>
        2. Click the
        <IconButton aria-label='Insert'>
          <Add />
        </IconButton> button in the toolbar
      </Typography>
      <Typography variant="subtitle2">
        3. Select <Graph /> Graph from the menu
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
        const target = paragraphNode.getFirstChild();
        if (target?.__type === "graph") result = true;
      });
      return result;
    }
  },
  {
    name: "Insert a Sketch after this line",
    steps: <>
      <Typography variant="subtitle2" gutterBottom>
        1. Click the empty line below
      </Typography>
      <Typography variant="subtitle2" gutterBottom>
        2. Click the
        <IconButton aria-label='Insert'>
          <Add />
        </IconButton> button in the toolbar
      </Typography>
      <Typography variant="subtitle2">
        3. Select <Brush sx={{ verticalAlign: "middle" }} /> Sketch from the menu
      </Typography>
    </>,
    check: (editorState?: EditorState) => {
      let result = false;
      if (!editorState) return result;
      editorState.read(() => {
        const node = [...editorState._nodeMap].find(([_, node]) => node.__type === "listitem" && (node as ListItemNode).__value === 4)?.[1] as ListItemNode;
        if (!node) return result;
        const paragraphNode = node.getParent()?.getNextSibling<ParagraphNode>();
        if (!paragraphNode) return result;
        const target = paragraphNode.getFirstChild();
        if (target?.__type === "sketch") result = true;
      });
      return result;
    }
  },
  {
    name: "Insert an Image after this line",
    steps: <>
      <Typography variant="subtitle2" gutterBottom>
        1. Click the empty line below
      </Typography>
      <Typography variant="subtitle2" gutterBottom>
        2. Click the
        <IconButton aria-label='Insert'>
          <Add />
        </IconButton> button in the toolbar
      </Typography>
      <Typography variant="subtitle2">
        3. Select <ImageIcon sx={{ verticalAlign: "middle" }} /> Image from the menu
      </Typography>
    </>,
    check: (editorState?: EditorState) => {
      let result = false;
      if (!editorState) return result;
      editorState.read(() => {
        const node = [...editorState._nodeMap].find(([_, node]) => node.__type === "listitem" && (node as ListItemNode).__value === 5)?.[1] as ListItemNode;
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
    name: "Insert a Table after this line",
    steps: <>
      <Typography variant="subtitle2" gutterBottom>
        1. Click the empty line below
      </Typography>
      <Typography variant="subtitle2" gutterBottom>
        2. Click the
        <IconButton aria-label='Insert'>
          <Add />
        </IconButton> button in the toolbar
      </Typography>
      <Typography variant="subtitle2">
        3. Select <TableChart sx={{ verticalAlign: "middle" }} /> Table from the menu
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
        const target = paragraphNode.getNextSibling();
        if (target?.__type === "table") result = true;
      });
      return result;
    }
  },
  {
    name: "Insert a Sticky Note aside the following text",
    steps: <>
      <Typography variant="subtitle2" gutterBottom>
        1. Click the text below
      </Typography>
      <Typography variant="subtitle2" gutterBottom>
        2. Click the
        <IconButton aria-label='Insert'>
          <Add />
        </IconButton> button in the toolbar
      </Typography>
      <Typography variant="subtitle2">
        3. Select <StickyNote2 sx={{ verticalAlign: "middle" }} /> Note from the menu
      </Typography>
    </>,
    check: (editorState?: EditorState) => {
      let result = false;
      if (!editorState) return result;
      editorState.read(() => {
        const node = [...editorState._nodeMap].find(([_, node]) => node.__type === "listitem" && (node as ListItemNode).__value === 7)?.[1] as ListItemNode;
        if (!node) return result;
        const paragraphNode = node.getParent()?.getNextSibling<ParagraphNode>();
        if (!paragraphNode) return result;
        const children = paragraphNode.getChildren();
        const containsSticky = children.some((child: LexicalNode) => child.__type === "sticky");
        if (containsSticky) result = true;
      });
      return result;
    }
  }
];

export default Checkpoint5;