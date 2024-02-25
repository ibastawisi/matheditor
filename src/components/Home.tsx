"use client"
import { useRouter } from 'next/navigation';
import { useEffect } from "react";
import useLocalStorage from "../hooks/useLocalStorage";
import Documents from "./Documents";
import { Button, Dialog, DialogActions, DialogContent, DialogContentText, DialogTitle } from '@mui/material';
import dynamic from "next/dynamic";

const DisplayAd = dynamic(() => import('@/components/Ads/DisplayAd'), { ssr: false });

const Home: React.FC = () => {
  const [welcomed, setWelcomed] = useLocalStorage("welcomed", false);
  const router = useRouter();
  const navigate = (path: string) => router.push(path);
  const handleClose = () => setWelcomed(true);

  useEffect(() => { window.scrollTo(0, 0); }, []);

  return (
    <>
      <Documents />
      <DisplayAd sx={{ mt: 2 }} />
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