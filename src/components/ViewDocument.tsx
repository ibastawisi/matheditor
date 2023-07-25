"use client"
import RouterLink from 'next/link'
import Fab from "@mui/material/Fab";
import EditIcon from '@mui/icons-material/Edit';
import useScrollTrigger from "@mui/material/useScrollTrigger";
import { Transition } from 'react-transition-group';

import '@/editor/theme.css';
import '@/editor/nodes/StickyNode/StickyNode.css';
import "mathlive/static.css"

const ViewDocument: React.FC<React.PropsWithChildren & { id: string }> = ({ id, children }) => {
  const slideTrigger = useScrollTrigger({
    disableHysteresis: true,
    threshold: 100,
  });

  return <>
    {children}
    <Transition in={slideTrigger} timeout={225}>
      <Fab variant="extended" size='medium' component={RouterLink} href={`/new/${id}`}
        sx={{ position: 'fixed', right: slideTrigger ? 64 : 24, bottom: 24, px: 2, displayPrint: 'none', transition: `right 225ms ease-in-out` }}>
        <EditIcon />Fork
      </Fab>
    </Transition>
  </>
}

export default ViewDocument;