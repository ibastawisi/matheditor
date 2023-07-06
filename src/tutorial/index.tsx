import ToggleButton from "@mui/material/ToggleButton";
import Typography from "@mui/material/Typography";
import { $isParagraphNode, $isTextNode, ParagraphNode } from "lexical";
import { EditorState } from "lexical/LexicalEditorState";
import FormatBoldIcon from '@mui/icons-material/FormatBold';
import FormatItalicIcon from '@mui/icons-material/FormatItalic';
import FormatUnderlinedIcon from '@mui/icons-material/FormatUnderlined';
import CodeIcon from '@mui/icons-material/Code';
import FormatStrikethroughIcon from '@mui/icons-material/FormatStrikethrough';
import SubscriptIcon from '@mui/icons-material/Subscript';
import SuperscriptIcon from '@mui/icons-material/Superscript';
import FormatColorFillIcon from '@mui/icons-material/FormatColorFill';
import Select from "@mui/material/Select";
import MenuItem from "@mui/material/MenuItem";
import ViewHeadlineIcon from '@mui/icons-material/ViewHeadline';
import ListItemIcon from "@mui/material/ListItemIcon";
import ListItemText from "@mui/material/ListItemText";
import { EditorDocument } from '../store/types';
import FormatQuoteIcon from '@mui/icons-material/FormatQuote';
import FormatListBulletedIcon from '@mui/icons-material/FormatListBulleted';
import SvgIcon from '@mui/material/SvgIcon';
import FormatAlignLeftIcon from '@mui/icons-material/FormatAlignLeft';
import FormatAlignCenterIcon from '@mui/icons-material/FormatAlignCenter';
import FormatAlignRightIcon from '@mui/icons-material/FormatAlignRight';
import FormatIndentIncreaseIcon from '@mui/icons-material/FormatIndentIncrease';
import IconButton from '@mui/material/IconButton';
import AddIcon from '@mui/icons-material/Add';
import HorizontalRuleIcon from '@mui/icons-material/HorizontalRule';
import ImageIcon from '@mui/icons-material/Image';
import TableIcon from '@mui/icons-material/TableChart';
import FunctionsIcon from '@mui/icons-material/Functions';
import BrushIcon from '@mui/icons-material/Brush';
import ViewInArIcon from '@mui/icons-material/ViewInAr';
import StickyNote2Icon from '@mui/icons-material/StickyNote2';

const H3Icon = () => <SvgIcon viewBox='0 96 960 960' fontSize='small' sx={{ verticalAlign: "middle" }}>
  <path xmlns="http://www.w3.org/2000/svg" d="M120 776V376h60v170h180V376h60v400h-60V606H180v170h-60Zm420 0v-60h240V606H620v-60h160V436H540v-60h240q25 0 42.5 17.625T840 436v280q0 24.75-17.625 42.375T780 776H540Z" />
</SvgIcon>;

const GraphIcon = () => <SvgIcon viewBox='0 0 512 512' fontSize='small' sx={{ verticalAlign: "middle" }}>
  <path d="M500.364,244.365h-37.248c12.695-18.223,27.124-31.674,42.415-39.273c5.76-2.851,8.099-9.844,5.248-15.593    c-2.851-5.76-9.821-8.122-15.593-5.248c-24.041,11.927-45.894,34.804-63.185,66.129c-22.726,41.146-52.166,63.802-82.909,63.802    c-26.077,0-51.188-16.465-72.087-46.545H384c6.423,0,11.636-5.201,11.636-11.636c0-6.435-5.213-11.636-11.636-11.636H267.636v-128    h11.636c4.701,0,8.948-2.828,10.752-7.18s0.803-9.356-2.525-12.684l-23.273-23.273c-4.55-4.55-11.904-4.55-16.454,0L224.5,96.502    c-3.328,3.328-4.329,8.332-2.525,12.684s6.051,7.18,10.752,7.18h11.636V218.09c-23.599-28.323-51.7-43.543-81.455-43.543    c-37.876,0-72.972,24.879-99.607,69.818H11.636C5.213,244.365,0,249.567,0,256.001c0,6.435,5.213,11.636,11.636,11.636h37.248    C36.189,285.86,21.76,299.312,6.47,306.911c-5.76,2.851-8.099,9.844-5.248,15.593c2.025,4.108,6.144,6.47,10.426,6.47    c1.734,0,3.503-0.384,5.167-1.21C40.855,315.836,62.708,292.959,80,261.633c22.726-41.158,52.166-63.814,82.909-63.814    c26.077,0,51.188,16.465,72.087,46.545H128c-6.423,0-11.636,5.201-11.636,11.636c0,6.435,5.213,11.636,11.636,11.636h116.364    v162.909c0,6.435,5.213,11.636,11.636,11.636s11.636-5.201,11.636-11.636V293.913c23.599,28.323,51.7,43.543,81.455,43.543    c37.876,0,72.972-24.879,99.607-69.818h51.665c6.423,0,11.636-5.201,11.636-11.636C512,249.567,506.787,244.365,500.364,244.365z" />
</SvgIcon>;

import Task1 from "./Task1.json";
import Task2 from "./Task2.json";
import Task3 from "./Task3.json";
import Task4 from "./Task4.json";
import Task5 from "./Task5.json";
import Task6 from "./Task6.json";
import Task7 from "./Task7.json";

const task1Checkpoints = [
  {
    name: "Make the following text bold",
    steps: <>
      <Typography variant="subtitle2" gutterBottom>
        1. Select the text
      </Typography>
      <Typography variant="subtitle2">
        2. Click the
        <ToggleButton value="bold" size="small" sx={{ m: 1 }}>
          <FormatBoldIcon />
        </ToggleButton>
        button in the toolbar
      </Typography>
    </>,
    check: (editorState?: EditorState) => {
      let result = false;
      if (!editorState) return result;
      editorState.read(() => {
        editorState._nodeMap.forEach((node) => {
          if (node.__value === 1) {
            const paragraphNode = node.getParent()?.getNextSibling();
            if (!$isParagraphNode(paragraphNode)) return result;
            const target = paragraphNode.getFirstChild();
            if ($isTextNode(target) && target.hasFormat("bold")) result = true;
          }
        });
      })
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
          <FormatItalicIcon />
        </ToggleButton>
        button in the toolbar
      </Typography>
    </>,
    check: (editorState?: EditorState) => {
      let result = false;
      if (!editorState) return result;
      editorState.read(() => {
        editorState._nodeMap.forEach((node) => {
          if (node.__value === 2) {
            const paragraphNode = node.getParent()?.getNextSibling();
            if (!$isParagraphNode(paragraphNode)) return result;
            const target = paragraphNode.getFirstChild();
            if ($isTextNode(target) && target.hasFormat("italic")) result = true;
          }
        });
      })
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
          <FormatUnderlinedIcon />
        </ToggleButton>
        button in the toolbar
      </Typography>
    </>,
    check: (editorState?: EditorState) => {
      let result = false;
      if (!editorState) return result;
      editorState.read(() => {
        editorState._nodeMap.forEach((node) => {
          if (node.__value === 3) {
            const paragraphNode = node.getParent()?.getNextSibling();
            if (!$isParagraphNode(paragraphNode)) return result;
            const target = paragraphNode.getFirstChild();
            if ($isTextNode(target) && target.hasFormat("underline")) result = true;
          }
        });
      })
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
          <CodeIcon />
        </ToggleButton>
        button in the toolbar
      </Typography>
    </>,
    check: (editorState?: EditorState) => {
      let result = false;
      if (!editorState) return result;
      editorState.read(() => {
        editorState._nodeMap.forEach((node) => {
          if (node.__value === 4) {
            const paragraphNode = node.getParent()?.getNextSibling();
            if (!$isParagraphNode(paragraphNode)) return result;
            const target = paragraphNode.getFirstChild();
            if ($isTextNode(target) && target.hasFormat("code")) result = true;
          }
        });
      })
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
          <FormatStrikethroughIcon />
        </ToggleButton>
        button in the toolbar
      </Typography>
    </>,
    check: (editorState?: EditorState) => {
      let result = false;
      if (!editorState) return result;
      editorState.read(() => {
        editorState._nodeMap.forEach((node) => {
          if (node.__value === 5) {
            const paragraphNode = node.getParent()?.getNextSibling();
            if (!$isParagraphNode(paragraphNode)) return result;
            const target = paragraphNode.getFirstChild();
            if ($isTextNode(target) && target.hasFormat("strikethrough")) result = true;
          }
        });
      })
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
          <SubscriptIcon />
        </ToggleButton>
        button in the toolbar
      </Typography>
    </>,
    check: (editorState?: EditorState) => {
      let result = false;
      if (!editorState) return result;
      editorState.read(() => {
        editorState._nodeMap.forEach((node) => {
          if ($isTextNode(node) && node.getTextContent() === "subscript") {
            if (node.hasFormat("subscript" as any)) result = true;
          }
        });
      })
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
          <SuperscriptIcon />
        </ToggleButton>
        button in the toolbar
      </Typography>
    </>,
    check: (editorState?: EditorState) => {
      let result = false;
      if (!editorState) return result;
      editorState.read(() => {
        editorState._nodeMap.forEach((node) => {
          if ($isTextNode(node) && node.getTextContent() === "superscript") {
            if (node.hasFormat("superscript" as any)) result = true;
          }
        });
      })
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
          <FormatColorFillIcon />
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
        editorState._nodeMap.forEach((node) => {
          if (node.__value === 8) {
            const paragraphNode = node.getParent()?.getNextSibling();
            if (!$isParagraphNode(paragraphNode)) return result;
            const target = paragraphNode.getFirstChild();
            if ($isTextNode(target) && target.getStyle().includes("color")) result = true;
          }
        });
      })
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
          <FormatColorFillIcon />
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
        editorState._nodeMap.forEach((node) => {
          if (node.__value === 9) {
            const paragraphNode = node.getParent()?.getNextSibling();
            if (!$isParagraphNode(paragraphNode)) return result;
            const target = paragraphNode.getFirstChild();
            if ($isTextNode(target) && target.getStyle().includes("background-color")) result = true;
          }
        });
      })
      return result;
    }
  },
];

const task2Checkpoints = [
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
            if (!$isParagraphNode(paragraphNode)) return result;
            const target = paragraphNode.getFirstChild();
            if ($isTextNode(target) && target.getStyle().includes("font-size: 20px")) result = true;
          }
        });
      })
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
          <MenuItem key='Roboto' value='Roboto'>'Roboto'</MenuItem>
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
            if (!$isParagraphNode(paragraphNode)) return result;
            const target = paragraphNode.getFirstChild();
            if ($isTextNode(target) && target.getStyle().includes("font-family: KaTeX_Main")) result = true;
          }
        });
      })
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
          <MenuItem key='Roboto' value='Roboto'>'Roboto'</MenuItem>
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
            if (!$isParagraphNode(paragraphNode)) return result;
            const target = paragraphNode.getFirstChild();
            if ($isTextNode(target) && target.getStyle().includes("font-family: Virgil")) result = true;
          }
        });
      })
      return result;
    }
  },
];

const task3Checkpoints = [
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
      })
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
      })
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
      })
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
      })
      return result;
    }
  }
];

const task4Checkpoints = [
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
            if (!$isParagraphNode(paragraphNode)) return result;
            if (paragraphNode.__format === 2) result = true;
          }
        });
      })
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
            if (!$isParagraphNode(paragraphNode)) return result;
            if (paragraphNode.__format === 3) result = true;
          }
        });
      })
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
            if (!$isParagraphNode(paragraphNode)) return result;
            if (paragraphNode.getIndent() === 1) result = true;
          }
        });
      })
      return result;
    }
  }
];

const task5Checkpoints = [
  {
    name: "Insert a Divider after this line",
    steps: <>
      <Typography variant="subtitle2" gutterBottom>
        1. Click the empty line below
      </Typography>
      <Typography variant="subtitle2" gutterBottom>
        2. Click the
        <IconButton aria-label='Insert'>
          <AddIcon />
        </IconButton> button in the toolbar
      </Typography>
      <Typography variant="subtitle2">
        3. Select <HorizontalRuleIcon sx={{ verticalAlign: "middle" }} /> Divider from the menu
      </Typography>
    </>,
    check: (editorState?: EditorState) => {
      let result = false;
      if (!editorState) return result;
      editorState.read(() => {
        editorState._nodeMap.forEach((node) => {
          if (node.__value === 1) {
            const target = node.getParent()?.getNextSibling()?.getNextSibling();
            if (target?.__type === "horizontalrule") result = true;
          }
        });
      })
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
          <AddIcon />
        </IconButton> button in the toolbar
      </Typography>
      <Typography variant="subtitle2">
        3. Select <FunctionsIcon sx={{ verticalAlign: "middle" }} /> Math from the menu
      </Typography>
    </>,
    check: (editorState?: EditorState) => {
      let result = false;
      if (!editorState) return result;
      editorState.read(() => {
        editorState._nodeMap.forEach((node) => {
          if (node.__value === 2) {
            const paragraphNode = node.getParent()?.getNextSibling();
            if (!$isParagraphNode(paragraphNode)) return result;
            const target = paragraphNode.getFirstChild();
            if (target?.__type === "math" && target.__value === "x^2+5x+6=0") result = true;
          }
        });
      })
      return result;
    }
  },
  {
    name: "Insert a 2D Graph after this line",
    steps: <>
      <Typography variant="subtitle2" gutterBottom>
        1. Click the empty line below
      </Typography>
      <Typography variant="subtitle2" gutterBottom>
        2. Click the
        <IconButton aria-label='Insert'>
          <AddIcon />
        </IconButton> button in the toolbar
      </Typography>
      <Typography variant="subtitle2">
        3. Select <GraphIcon /> 2D Graph from the menu
      </Typography>
    </>,
    check: (editorState?: EditorState) => {
      let result = false;
      if (!editorState) return result;
      editorState.read(() => {
        editorState._nodeMap.forEach((node) => {
          if (node.__value === 3) {
            const paragraphNode = node.getParent()?.getNextSibling();
            if (!$isParagraphNode(paragraphNode)) return result;
            const target = paragraphNode.getFirstChild();
            if (target?.__type === "graph" && target.__graphType === "2D") result = true;
          }
        });
      })
      return result;
    }
  },
  {
    name: "Insert a 3D Graph after this line",
    steps: <>
      <Typography variant="subtitle2" gutterBottom>
        1. Click the empty line below
      </Typography>
      <Typography variant="subtitle2" gutterBottom>
        2. Click the
        <IconButton aria-label='Insert'>
          <AddIcon />
        </IconButton> button in the toolbar
      </Typography>
      <Typography variant="subtitle2">
        3. Select <ViewInArIcon sx={{ verticalAlign: "middle" }} /> 3D Graph from the menu
      </Typography>
    </>,
    check: (editorState?: EditorState) => {
      let result = false;
      if (!editorState) return result;
      editorState.read(() => {
        editorState._nodeMap.forEach((node) => {
          if (node.__value === 4) {
            const paragraphNode = node.getParent()?.getNextSibling();
            if (!$isParagraphNode(paragraphNode)) return result;
            const target = paragraphNode.getFirstChild();
            if (target?.__type === "graph" && target.__graphType === "3D") result = true;
          }
        });
      })
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
          <AddIcon />
        </IconButton> button in the toolbar
      </Typography>
      <Typography variant="subtitle2">
        3. Select <BrushIcon sx={{ verticalAlign: "middle" }} /> Sketch from the menu
      </Typography>
    </>,
    check: (editorState?: EditorState) => {
      let result = false;
      if (!editorState) return result;
      editorState.read(() => {
        editorState._nodeMap.forEach((node) => {
          if (node.__value === 5) {
            const paragraphNode = node.getParent()?.getNextSibling();
            if (!$isParagraphNode(paragraphNode)) return result;
            const target = paragraphNode.getFirstChild();
            if (target?.__type === "sketch") result = true;
          }
        });
      })
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
          <AddIcon />
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
        editorState._nodeMap.forEach((node) => {
          if (node.__value === 6) {
            const paragraphNode = node.getParent()?.getNextSibling();
            if (!$isParagraphNode(paragraphNode)) return result;
            const target = paragraphNode.getFirstChild();
            if (target?.__type === "image") result = true;
          }
        });
      })
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
          <AddIcon />
        </IconButton> button in the toolbar
      </Typography>
      <Typography variant="subtitle2">
        3. Select <TableIcon sx={{ verticalAlign: "middle" }} /> Table from the menu
      </Typography>
    </>,
    check: (editorState?: EditorState) => {
      let result = false;
      if (!editorState) return result;
      editorState.read(() => {
        editorState._nodeMap.forEach((node) => {
          if (node.__value === 7) {
            const paragraphNode = node.getParent()?.getNextSibling();
            if (!$isParagraphNode(paragraphNode)) return result;
            const target = paragraphNode.getNextSibling();
            if (target?.__type === "table") result = true;
          }
        });
      })
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
          <AddIcon />
        </IconButton> button in the toolbar
      </Typography>
      <Typography variant="subtitle2">
        3. Select <StickyNote2Icon sx={{ verticalAlign: "middle" }} /> Note from the menu
      </Typography>
    </>,
    check: (editorState?: EditorState) => {
      let result = false;
      if (!editorState) return result;
      editorState.read(() => {
        editorState._nodeMap.forEach((node) => {
          if (node.__value === 8) {
            const paragraphNode = node.getParent()?.getNextSibling();
            if (!$isParagraphNode(paragraphNode)) return result;
            const target = paragraphNode.getFirstChild();
            if (target?.__type === "sticky") result = true;
          }
        });
      })
      return result;
    }
  }
];

const task6Checkpoints = [
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
        editorState._nodeMap.forEach((node) => {
          if (node.__value === 1) {
            const target = node.getParent()?.getNextSibling();
            if (target?.__tag == "h2") result = true;
          }
        });
      })
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
        editorState._nodeMap.forEach((node) => {
          if (node.__value === 2) {
            const paragraphNode = node.getParent()?.getNextSibling();
            if (!$isParagraphNode(paragraphNode)) return result;
            const target = paragraphNode.getFirstChild();
            if ($isTextNode(target) && target.hasFormat("bold")) result = true;
          }
        });
      })
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
        editorState._nodeMap.forEach((node) => {
          if (node.__value === 3) {
            const paragraphNode = node.getParent()?.getNextSibling();
            if (!$isParagraphNode(paragraphNode)) return result;
            const target = paragraphNode.getFirstChild();
            if ($isTextNode(target) && target.hasFormat("italic")) result = true;
          }
        });
      })
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
        editorState._nodeMap.forEach((node) => {
          if (node.__value === 4) {
            const target = node.getParent()?.getNextSibling();
            if (target?.__type == "quote") result = true;
          }
        });
      })
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
        editorState._nodeMap.forEach((node) => {
          if (node.__value === 5) {
            const target = node.getParent()?.getNextSibling();
            if (target?.__tag == "ul") result = true;
          }
        });
      })
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
        editorState._nodeMap.forEach((node) => {
          if (node.__value === 6) {
            const paragraphNode = node.getParent()?.getNextSibling();
            if (!$isParagraphNode(paragraphNode)) return result;
            const target = paragraphNode.getFirstChild();
            if ($isTextNode(target) && target.hasFormat("code")) result = true;
          }
        });
      })
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
        editorState._nodeMap.forEach((node) => {
          if (node.__value === 7) {
            const target = node.getParent()?.getNextSibling();
            if (target?.__type == "code") result = true;
          }
        });
      })
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
        editorState._nodeMap.forEach((node) => {
          if (node.__value === 8) {
            const target = node.getParent()?.getNextSibling();
            if (target?.__type === "horizontalrule") result = true;
          }
        });
      })
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
        editorState._nodeMap.forEach((node) => {
          if (node.__value === 9) {
            const paragraphNode = node.getParent()?.getNextSibling();
            if (!$isParagraphNode(paragraphNode)) return result;
            const target = paragraphNode.getFirstChild();
            if (target?.__type === "link") result = true;
          }
        });
      })
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
        {'![Math Editor Logo](https://matheditor.ml/logo192.png)'}
      </Typography>
    </>,
    check: (editorState?: EditorState) => {
      let result = false;
      if (!editorState) return result;
      editorState.read(() => {
        editorState._nodeMap.forEach((node) => {
          if (node.__value === 10) {
            const paragraphNode = node.getParent()?.getNextSibling();
            if (!$isParagraphNode(paragraphNode)) return result;
            const target = paragraphNode.getFirstChild();
            if (target?.__type === "image") result = true;
          }
        });
      })
      return result;
    }
  },
  {
    name: "Insert a smile '😄' Emoji after this line",
    steps: <>
      <Typography variant="subtitle2" gutterBottom>
        1. Click the empty line below then type
      </Typography>
      <Typography variant="subtitle2" gutterBottom>
        {':smile'}
      </Typography>
      <Typography variant="subtitle2" gutterBottom>
        2. Pick the emoji from the List
      </Typography>
    </>,
    check: (editorState?: EditorState) => {
      let result = false;
      if (!editorState) return result;
      editorState.read(() => {
        editorState._nodeMap.forEach((node) => {
          if (node.__value === 11) {
            const paragraphNode = node.getParent()?.getNextSibling();
            if (!$isParagraphNode(paragraphNode)) return result;
            const target = paragraphNode.getFirstChild();
            if ($isTextNode(target) && target.getTextContent() === '😄') result = true;
          }
        });
      })
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
        editorState._nodeMap.forEach((node) => {
          if (node.__value === 12) {
            const paragraphNode = node.getParent()?.getNextSibling();
            if (!$isParagraphNode(paragraphNode)) return result;
            const target = paragraphNode.getFirstChild();
            if (target?.__type === "math") result = true;
          }
        });
      })
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
        editorState._nodeMap.forEach((node) => {
          if (node.__value === 13) {
            const paragraphNode = node.getParent()?.getNextSibling();
            if (!$isParagraphNode(paragraphNode)) return result;
            const target = paragraphNode.getFirstChild();
            if (target?.__type === "math" && target.__value === "y=x^2") result = true;
          }
        });
      })
      return result;
    }
  },
];

const task7Checkpoints = [
  {
    name: "Insert a 2D Graph after this line",
    steps: <>
      <Typography variant="subtitle2" gutterBottom>
        1. Click the empty line below then type
      </Typography>
      <Typography variant="subtitle2" gutterBottom>
        {'/2d'}
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
            if (!$isParagraphNode(paragraphNode)) return result;
            const target = paragraphNode.getFirstChild();
            if (target?.__type === "graph" && target.__graphType === "2D") result = true;
          }
        });
      })
      return result;
    }
  },
  {
    name: "Insert a 3D Graph after this line",
    steps: <>
      <Typography variant="subtitle2" gutterBottom>
        1. Click the empty line below then type
      </Typography>
      <Typography variant="subtitle2" gutterBottom>
        {'/3d'}
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
          if (node.__value === 2) {
            const paragraphNode = node.getParent()?.getNextSibling();
            if (!$isParagraphNode(paragraphNode)) return result;
            const target = paragraphNode.getFirstChild();
            if (target?.__type === "graph" && target.__graphType === "3D") result = true;
          }
        });
      })
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
          if (node.__value === 3) {
            const paragraphNode = node.getParent()?.getNextSibling();
            if (!$isParagraphNode(paragraphNode)) return result;
            const target = paragraphNode.getFirstChild();
            if (target?.__type === "sketch") result = true;
          }
        });
      })
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
          if (node.__value === 4) {
            const paragraphNode = node.getParent()?.getNextSibling();
            if (!$isParagraphNode(paragraphNode)) return result;
            const target = paragraphNode.getNextSibling();
            if (target?.__type === "table" && target.__size === 4) result = true;
          }
        });
      })
      return result;
    }
  },
];

const tasks = [
  Task1 as unknown,
  Task2 as unknown,
  Task3 as unknown,
  Task4 as unknown,
  Task5 as unknown,
  Task6 as unknown,
  Task7 as unknown,
] as EditorDocument[];

const checkpoints = [
  task1Checkpoints,
  task2Checkpoints,
  task3Checkpoints,
  task4Checkpoints,
  task5Checkpoints,
  task6Checkpoints,
  task7Checkpoints,
];

export { tasks, checkpoints }