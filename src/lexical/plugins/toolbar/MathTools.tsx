import ToggleButton from "@mui/material/ToggleButton";
import ToggleButtonGroup from "@mui/material/ToggleButtonGroup";
import DeleteIcon from '@mui/icons-material/Delete';
import { LexicalEditor, } from "lexical";
import { SxProps, Theme } from '@mui/material/styles';
import SvgIcon from '@mui/material/SvgIcon';
import { MathNode } from "../../nodes/MathNode";

const WolframIcon = () => <SvgIcon viewBox='0 0 20 20' fontSize='small'>
  <path d="M15.33 10l2.17-2.47-3.19-.71.33-3.29-3 1.33L10 2 8.35 4.86l-3-1.33.32 3.29-3.17.71L4.67 10 2.5 12.47l3.19.71-.33 3.29 3-1.33L10 18l1.65-2.86 3 1.33-.32-3.29 3.19-.71zm-2.83 1.5h-5v-1h5zm0-2h-5v-1h5z" fill="#f96932"></path>
</SvgIcon>;

export default function MathTools({ editor, node, sx }: { editor: LexicalEditor, node: MathNode, sx?: SxProps<Theme> | undefined }): JSX.Element {
  const mathfield = node.getMathfield();
  return (<ToggleButtonGroup size="small" sx={{ ...sx }} >
    <ToggleButton value="wolfram"
      onClick={() => {
        if (!mathfield) return;
        const selection = mathfield.selection;
        const value = mathfield.getValue(selection, 'latex') || mathfield.value;
        window.open(`https://www.wolframalpha.com/input?i=${encodeURIComponent(value)}`)
      }}>
      <WolframIcon />
    </ToggleButton>
    <ToggleButton value="delete"
      onClick={() => {
        editor.update(() => {
          node.selectPrevious();
          node.remove();
        });
      }}>
      <DeleteIcon />
    </ToggleButton>
  </ToggleButtonGroup>)
}