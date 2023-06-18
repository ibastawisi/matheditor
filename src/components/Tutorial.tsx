/* eslint-disable react-hooks/exhaustive-deps */
import Editor from "../lexical";
import { Helmet } from "react-helmet";
import useLocalStorage from "../hooks/useLocalStorage";
import { useEffect, useState } from "react";
import Button from "@mui/material/Button";
import { EditorState } from "lexical";
import Box from "@mui/material/Box";
import Typography from "@mui/material/Typography";
import CheckIcon from "@mui/icons-material/Check";
import ClearIcon from "@mui/icons-material/Clear";
import Paper from "@mui/material/Paper";
import List from "@mui/material/List";
import ListItemText from "@mui/material/ListItemText";
import ListItemIcon from "@mui/material/ListItemIcon";
import ListItemButton from "@mui/material/ListItemButton";
import Collapse from "@mui/material/Collapse";
import ExpandLess from '@mui/icons-material/ExpandLess';
import ExpandMore from '@mui/icons-material/ExpandMore';

import { tasks, checkpoints } from "..//tutorial";
const Tutorial: React.FC = () => {
  const [editorState, setEditorState] = useState<EditorState>();
  const [currentTask, setCurrentTask] = useLocalStorage<number>("currentTutorialTask", 0);
  useEffect(() => { window.scrollTo(0, 0); }, []);

  const onChange = (editorState: EditorState) => {
    setEditorState(editorState);
  };

  const nextTask = () => {
    if (currentTask < tasks.length - 1) {
      setCurrentTask(currentTask + 1);
    }
  };

  const previousTask = () => {
    if (currentTask > 0) {
      setCurrentTask(currentTask - 1);
    }
  };

  return <>
    <Helmet><title>{tasks[currentTask].name}</title></Helmet>
    <Editor key={currentTask} document={tasks[currentTask]} editable={true} onChange={onChange} />
    <Paper sx={{ p: 2 }}>
      <Box key={`task-${currentTask}`} sx={{ mb: 2 }}>
        <Typography variant="h6">{tasks[currentTask].name}</Typography>
        <List>
          {checkpoints[currentTask].map((checkpoint, index) =>
            <CheckpointItem key={`checkpoint-${index}`} name={checkpoint.name} steps={checkpoint.steps} checked={checkpoint.check(editorState)} />
          )}
        </List>
      </Box>
      <Box sx={{ display: "flex", justifyContent: "end" }}>
        <Button onClick={previousTask} disabled={currentTask === 0}>Previous</Button>
        <Button onClick={nextTask} disabled={currentTask === tasks.length - 1}>Next</Button>
      </Box>
    </Paper>
  </>;
}

const CheckpointItem = ({ name, steps, checked }: { name: string, steps: JSX.Element, checked: boolean }) => {
  const [open, setOpen] = useState(false);

  const handleClick = () => {
    setOpen(!open);
  };

  return <>
    <ListItemButton onClick={handleClick}>
      <ListItemIcon>
        {checked ? <CheckIcon /> : <ClearIcon />}
      </ListItemIcon>
      <ListItemText primary={name} />
      {open ? <ExpandLess /> : <ExpandMore />}
    </ListItemButton>
    <Collapse in={open} timeout="auto" unmountOnExit>
      <Box sx={{ p: 2 }}>
        <Typography variant="button" component="div" sx={{ mb: 2 }}>Steps</Typography>
        {steps}
      </Box>
    </Collapse >
  </>
}

export default Tutorial;