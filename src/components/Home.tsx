import Button from "@mui/material/Button";
import Dialog from "@mui/material/Dialog";
import DialogActions from "@mui/material/DialogActions";
import DialogContent from "@mui/material/DialogContent";
import DialogContentText from "@mui/material/DialogContentText";
import DialogTitle from "@mui/material/DialogTitle";
import React, { useEffect } from "react";
import { useSelector } from "react-redux";
import { Navigate, useNavigate } from "react-router-dom";
import { RootState } from "../store";

const Home: React.FC = () => {
  const editor = useSelector((state: RootState) => state.app.editor);
  const welcomed = localStorage.getItem("welcomed") === "true";
  const navigate = useNavigate();

  useEffect(() => {
    if (!welcomed) {
      setOpen(true);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const [open, setOpen] = React.useState(false);

  const handleClose = () => {
    setOpen(false);
    localStorage.setItem("welcomed", "true");
  };

  if (welcomed) {
    return <Navigate to={editor.id ? `/edit/${editor.id}` : "/open"} />;
  }

  return (
    <Dialog
      open={open}
      onClose={handleClose}
      aria-labelledby="welcome-dialog-title"
      aria-describedby="welcome-dialog-description"
    >
      <DialogTitle id="welcome-dialog-title">Welcome to Math Editor</DialogTitle>
      <DialogContent>
        <DialogContentText id="welcome-dialog-description">
          It seems like you are new here. Would you like to take a tour?
        </DialogContentText>
      </DialogContent>
      <DialogActions>
        <Button onClick={handleClose}>Dismess</Button>
        <Button onClick={() => { navigate('/playground'); handleClose(); }}>
          Go to the Playground
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default Home;