"use client"
import { Box, IconButton, SwipeableDrawer, Typography } from '@mui/material';
import { Article, Close } from '@mui/icons-material';
import { actions, useDispatch, useSelector } from '@/store';
import { useEffect } from 'react';

const AppDrawer: React.FC<React.PropsWithChildren<{ title: string }>> = ({ title, children }) => {
  const open = useSelector(state => state.drawer);
  const dispatch = useDispatch();
  const toggleDrawer = () => { dispatch(actions.toggleDrawer()); }

  useEffect(() => {
    return () => { dispatch(actions.toggleDrawer(false)); }
  }, []);
  
  return (
    <>
      <SwipeableDrawer
        anchor="right"
        open={open}
        onOpen={toggleDrawer}
        onClose={toggleDrawer}
        sx={{ displayPrint: 'none' }}
      >
        <Box sx={{ p: 2, width: 300 }}>
          <Box sx={{ display: 'flex', alignItems: 'center' }}>
            <Article sx={{ mr: 1 }} />
            <Typography variant="h6">{title}</Typography>
            <IconButton onClick={toggleDrawer} sx={{ ml: "auto" }}><Close /></IconButton>
          </Box>
          {children}
        </Box>
      </SwipeableDrawer>
    </>
  );
}

export default AppDrawer;