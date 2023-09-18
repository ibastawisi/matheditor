"use client"
import { useRouter } from 'next/navigation';
import Button from "@mui/material/Button";
import Dialog from "@mui/material/Dialog";
import DialogActions from "@mui/material/DialogActions";
import DialogContent from "@mui/material/DialogContent";
import DialogContentText from "@mui/material/DialogContentText";
import DialogTitle from "@mui/material/DialogTitle";
import { useEffect } from "react";
import useLocalStorage from "../hooks/useLocalStorage";
import Documents from "./Documents";

const Home: React.FC = () => {
  const [welcomed, setWelcomed] = useLocalStorage("welcomed", false);
  const router = useRouter();
  const navigate = (path: string) => router.push(path);
  const handleClose = () => setWelcomed(true);

  useEffect(() => { window.scrollTo(0, 0); }, []);

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
            <Button onClick={() => { navigate('/tutorial'); handleClose(); }}>
              Launch the Tutorial
            </Button>
          </DialogActions>
        </Dialog>
      )}
    </>
  );
};

export default Home;