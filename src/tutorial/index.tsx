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
import FormatColorTextIcon from '@mui/icons-material/FormatColorText';
import FormatColorFillIcon from '@mui/icons-material/FormatColorFill';
import Select from "@mui/material/Select";
import MenuItem from "@mui/material/MenuItem";
import ViewHeadlineIcon from '@mui/icons-material/ViewHeadline';
import ListItemIcon from "@mui/material/ListItemIcon";
import ListItemText from "@mui/material/ListItemText";
import { EditorDocument } from "../slices/app";
import FormatQuoteIcon from '@mui/icons-material/FormatQuote';
import FormatListBulletedIcon from '@mui/icons-material/FormatListBulleted';
import SvgIcon from '@mui/material/SvgIcon';
import FormatAlignLeftIcon from '@mui/icons-material/FormatAlignLeft';
import FormatAlignCenterIcon from '@mui/icons-material/FormatAlignCenter';
import FormatAlignRightIcon from '@mui/icons-material/FormatAlignRight';
import FormatIndentIncreaseIcon from '@mui/icons-material/FormatIndentIncrease';
import IconButton from '@mui/material/IconButton';

const H3Icon = () => <SvgIcon viewBox='0 96 960 960' fontSize='small' sx={{ verticalAlign: "middle" }}>
  <path xmlns="http://www.w3.org/2000/svg" d="M120 776V376h60v170h180V376h60v400h-60V606H180v170h-60Zm420 0v-60h240V606H620v-60h160V436H540v-60h240q25 0 42.5 17.625T840 436v280q0 24.75-17.625 42.375T780 776H540Z" />
</SvgIcon>;

import Task1 from "./Task1.json";
import Task2 from "./Task2.json";
import Task3 from "./Task3.json";
import Task4 from "./Task4.json";

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
          <FormatColorTextIcon />
        </ToggleButton>
        button in the toolbar
      </Typography>
      <Typography variant="subtitle2">
        3. Select a color
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
        3. Select a color
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
        1. Select all items
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
        1. Select all items
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
        1. Select the text
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
        1. Select the text
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
        1. Select the text
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

const tasks = [
  Task1 as unknown,
  Task2 as unknown,
  Task3 as unknown,
  Task4 as unknown
] as EditorDocument[];

const checkpoints = [
  task1Checkpoints,
  task2Checkpoints,
  task3Checkpoints,
  task4Checkpoints
];

export { tasks, checkpoints }