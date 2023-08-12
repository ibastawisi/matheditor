import Typography from "@mui/material/Typography";
import type { EditorState } from "../editor/types";
import CodeIcon from '@mui/icons-material/Code';
import Select from "@mui/material/Select";
import MenuItem from "@mui/material/MenuItem";
import ViewHeadlineIcon from '@mui/icons-material/ViewHeadline';
import ListItemIcon from "@mui/material/ListItemIcon";
import ListItemText from "@mui/material/ListItemText";
import FormatQuoteIcon from '@mui/icons-material/FormatQuote';
import FormatListBulletedIcon from '@mui/icons-material/FormatListBulleted';
import SvgIcon from '@mui/material/SvgIcon';

const H3Icon = () => <SvgIcon viewBox='0 96 960 960' fontSize='small' sx={{ verticalAlign: "middle" }}>
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
              <ViewHeadlineIcon fontSize="small" />
            </ListItemIcon>
            <ListItemText>Normal</ListItemText>
          </MenuItem>
        </Select> menu in the toolbar
      </Typography>
      <Typography variant="subtitle2">
        3. Select <H3Icon /> Heading 3 from the menu
      </Typography>
    </>,
    check: (editorState?: EditorState) => {
      let result = false;
      if (!editorState) return result;
      editorState.read(() => {
        editorState._nodeMap.forEach((node) => {
          if (node.__value === 1) {
            const target = node.getParent()?.getNextSibling();
            if (target?.__tag == "h3") result = true;
          }
        });
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
              <ViewHeadlineIcon fontSize="small" />
            </ListItemIcon>
            <ListItemText>Normal</ListItemText>
          </MenuItem>
        </Select> menu in the toolbar
      </Typography>
      <Typography variant="subtitle2">
        3. Select <FormatListBulletedIcon sx={{ verticalAlign: "middle" }} /> Bullet List from the menu
      </Typography>
    </>,
    check: (editorState?: EditorState) => {
      let result = false;
      if (!editorState) return result;
      editorState.read(() => {
        editorState._nodeMap.forEach((node) => {
          if (node.__value === 2) {
            const target = node.getParent()?.getNextSibling();
            if (target?.__tag == "ul") result = true;
          }
        });
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
              <ViewHeadlineIcon fontSize="small" />
            </ListItemIcon>
            <ListItemText>Normal</ListItemText>
          </MenuItem>
        </Select> menu in the toolbar
      </Typography>
      <Typography variant="subtitle2">
        3. Select <FormatQuoteIcon sx={{ verticalAlign: "middle" }} /> Quote from the menu
      </Typography>
    </>,
    check: (editorState?: EditorState) => {
      let result = false;
      if (!editorState) return result;
      editorState.read(() => {
        editorState._nodeMap.forEach((node) => {
          if (node.__value === 3) {
            const target = node.getParent()?.getNextSibling();
            if (target?.__type == "quote") result = true;
          }
        });
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
              <ViewHeadlineIcon fontSize="small" />
            </ListItemIcon>
            <ListItemText>Normal</ListItemText>
          </MenuItem>
        </Select> menu in the toolbar
      </Typography>
      <Typography variant="subtitle2">
        3. Select <CodeIcon sx={{ verticalAlign: "middle" }} /> CodeBlock from the menu
      </Typography>
    </>,
    check: (editorState?: EditorState) => {
      let result = false;
      if (!editorState) return result;
      editorState.read(() => {
        editorState._nodeMap.forEach((node) => {
          if (node.__value === 4) {
            const target = node.getParent()?.getNextSibling();
            if (target?.__type == "code") result = true;
          }
        });
      });
      return result;
    }
  }
];

export default Checkpoint3;