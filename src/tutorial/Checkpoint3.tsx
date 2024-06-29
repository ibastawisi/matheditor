import { ViewHeadline, FormatListBulleted, FormatQuote, Code } from "@mui/icons-material";
import type { HeadingNode, EditorState, ListItemNode, ListNode } from "@/editor";
import { ListItemIcon, ListItemText, MenuItem, Select, SvgIcon, Typography } from "@mui/material";

const H3 = () => <SvgIcon viewBox='0 96 960 960' fontSize='small' sx={{ verticalAlign: "middle" }}>
  <path xmlns="http://www.w3.org/2000/svg" d="M120 776V376h60v170h180V376h60v400h-60V606H180v170h-60Zm420 0v-60h240V606H620v-60h160V436H540v-60h240q25 0 42.5 17.625T840 436v280q0 24.75-17.625 42.375T780 776H540Z" />
</SvgIcon>;

const Checkpoint3 = [
  {
    name: "Make the following text a level 3 Heading",
    steps: <>
      <Typography variant="subtitle2" gutterBottom>
        1. Click the text
      </Typography>
      <Typography variant="subtitle2" gutterBottom>
        2. Click the
        <Select value="paragraph" size='small' readOnly sx={{
          mx: 1,
          '& .MuiSelect-select': { display: 'flex', alignItems: 'center', py: 0.5 },
          '& .MuiListItemIcon-root': { mr: { sm: 0.5 }, minWidth: 20 },
          '& .MuiListItemText-root': { display: { xs: "none", sm: "flex" } }
        }}>
          <MenuItem value='paragraph'>
            <ListItemIcon>
              <ViewHeadline fontSize="small" />
            </ListItemIcon>
            <ListItemText>Normal</ListItemText>
          </MenuItem>
        </Select> menu in the toolbar
      </Typography>
      <Typography variant="subtitle2">
        3. Select <H3 /> Heading 3 from the menu
      </Typography>
    </>,
    check: (editorState?: EditorState) => {
      let result = false;
      if (!editorState) return result;
      editorState.read(() => {
        const node = [...editorState._nodeMap].find(([_, node]) => node.__type === "listitem" && (node as ListItemNode).__value === 1)?.[1] as ListItemNode;
        if (!node) return result;
        const target = node.getParent()?.getNextSibling<HeadingNode>();
        if (target?.__tag == "h3") result = true;
      });
      return result;
    }
  },
  {
    name: "Make the following items a Bulleted List",
    steps: <>
      <Typography variant="subtitle2" gutterBottom>
        1. Select the text
      </Typography>
      <Typography variant="subtitle2" gutterBottom>
        2. Click the
        <Select value="paragraph" size='small' readOnly sx={{
          mx: 1,
          '& .MuiSelect-select': { display: 'flex', alignItems: 'center', py: 0.5 },
          '& .MuiListItemIcon-root': { mr: { sm: 0.5 }, minWidth: 20 },
          '& .MuiListItemText-root': { display: { xs: "none", sm: "flex" } }
        }}>
          <MenuItem value='paragraph'>
            <ListItemIcon>
              <ViewHeadline fontSize="small" />
            </ListItemIcon>
            <ListItemText>Normal</ListItemText>
          </MenuItem>
        </Select> menu in the toolbar
      </Typography>
      <Typography variant="subtitle2">
        3. Select <FormatListBulleted sx={{ verticalAlign: "middle" }} /> Bullet List from the menu
      </Typography>
    </>,
    check: (editorState?: EditorState) => {
      let result = false;
      if (!editorState) return result;
      editorState.read(() => {
        const node = [...editorState._nodeMap].find(([_, node]) => node.__type === "listitem" && (node as ListItemNode).__value === 2)?.[1] as ListItemNode;
        if (!node) return result;
        const target = node.getParent()?.getNextSibling<ListNode>();
        if (target?.__tag == "ul") result = true;
      });
      return result;
    }
  },
  {
    name: "Format the following text as a Quote",
    steps: <>
      <Typography variant="subtitle2" gutterBottom>
        1. Click the text
      </Typography>
      <Typography variant="subtitle2" gutterBottom>
        2. Click the
        <Select value="paragraph" size='small' readOnly sx={{
          mx: 1,
          '& .MuiSelect-select': { display: 'flex', alignItems: 'center', py: 0.5 },
          '& .MuiListItemIcon-root': { mr: { sm: 0.5 }, minWidth: 20 },
          '& .MuiListItemText-root': { display: { xs: "none", sm: "flex" } }
        }}>
          <MenuItem value='paragraph'>
            <ListItemIcon>
              <ViewHeadline fontSize="small" />
            </ListItemIcon>
            <ListItemText>Normal</ListItemText>
          </MenuItem>
        </Select> menu in the toolbar
      </Typography>
      <Typography variant="subtitle2">
        3. Select <FormatQuote sx={{ verticalAlign: "middle" }} /> Quote from the menu
      </Typography>
    </>,
    check: (editorState?: EditorState) => {
      let result = false;
      if (!editorState) return result;
      editorState.read(() => {
        const node = [...editorState._nodeMap].find(([_, node]) => node.__type === "listitem" && (node as ListItemNode).__value === 3)?.[1] as ListItemNode;
        if (!node) return result;
        const target = node.getParent()?.getNextSibling();
        if (target?.__type == "quote") result = true;
      });
      return result;
    }
  },
  {
    name: "Format the following text as a Code Block",
    steps: <>
      <Typography variant="subtitle2" gutterBottom>
        1. Select the text
      </Typography>
      <Typography variant="subtitle2" gutterBottom>
        2. Click the
        <Select value="paragraph" size='small' readOnly sx={{
          mx: 1,
          '& .MuiSelect-select': { display: 'flex', alignItems: 'center', py: 0.5 },
          '& .MuiListItemIcon-root': { mr: { sm: 0.5 }, minWidth: 20 },
          '& .MuiListItemText-root': { display: { xs: "none", sm: "flex" } }
        }}>
          <MenuItem value='paragraph'>
            <ListItemIcon>
              <ViewHeadline fontSize="small" />
            </ListItemIcon>
            <ListItemText>Normal</ListItemText>
          </MenuItem>
        </Select> menu in the toolbar
      </Typography>
      <Typography variant="subtitle2">
        3. Select <Code sx={{ verticalAlign: "middle" }} /> CodeBlock from the menu
      </Typography>
    </>,
    check: (editorState?: EditorState) => {
      let result = false;
      if (!editorState) return result;
      editorState.read(() => {
        const node = [...editorState._nodeMap].find(([_, node]) => node.__type === "listitem" && (node as ListItemNode).__value === 4)?.[1] as ListItemNode;
        if (!node) return result;
        const target = node.getParent()?.getNextSibling();
        if (target?.__type == "code") result = true;
      });
      return result;
    }
  }
];

export default Checkpoint3;