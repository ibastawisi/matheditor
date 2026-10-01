"use client"
import { Box, IconButton, SwipeableDrawer, Typography } from '@mui/material';
import { Article, Close } from '@mui/icons-material';
import { useAppStore } from '@/store';
import { useEffect } from 'react';

const AppDrawer: React.FC<React.PropsWithChildren<{ title: string }>> = ({ title, children }) => {
  const open = useAppStore(state => state.drawer);
  const toggleDrawer = useAppStore(state => state.toggleDrawer);
  const handleToggle = () => { toggleDrawer(); }

  useEffect(() => {
    return () => { toggleDrawer(false); }
  }, []);
  
  return (
    <>
      <SwipeableDrawer
        anchor="right"
        open={open}
        onOpen={handleToggle}
        onClose={handleToggle}
        sx={{ displayPrint: 'none' }}
      >
        <Box sx={{ p: 2, width: 300 }}>
          <Box sx={{ display: 'flex', alignItems: 'center' }}>
            <Article sx={{ mr: 1 }} />
            <Typography variant="h6">{title}</Typography>
            <IconButton onClick={handleToggle} sx={{ ml: "auto" }}><Close /></IconButton>
          </Box>
          {children}
        </Box>
      </SwipeableDrawer>
    </>
  );
}

export default AppDrawer;