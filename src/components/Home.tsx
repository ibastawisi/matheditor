import Button from "@mui/material/Button";
import Dialog from "@mui/material/Dialog";
import DialogActions from "@mui/material/DialogActions";
import DialogContent from "@mui/material/DialogContent";
import DialogContentText from "@mui/material/DialogContentText";
import DialogTitle from "@mui/material/DialogTitle";
import React from "react";
import { useNavigate } from "react-router-dom";
import useLocalStorage from "../hooks/useLocalStorage";
import Documents from "./Documents";

const Home: React.FC = () => {
  const [welcomed, setWelcomed] = useLocalStorage("welcomed", false);
  const navigate = useNavigate();

  const handleClose = () => {
    setWelcomed(true);
  };

  return (
    <>
      <Documents />
      {!welcomed && (
        <Dialog open onClose={handleClose}>
          <DialogTitle>Welcome to Math Editor</DialogTitle>
          <DialogContent>
            <DialogContentText>
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
      )}
    </>
  );
};

export default Home;