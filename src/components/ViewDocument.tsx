"use client"
import RouterLink from 'next/link'
import EditIcon from '@mui/icons-material/Edit';
import { Transition } from 'react-transition-group';
import { useScrollTrigger, Fab } from '@mui/material';

import "mathlive/static.css"
import '@/editor/theme.css';

const ViewDocument: React.FC<React.PropsWithChildren & { params: { handle: string } }> = ({ params, children }) => {
  const slideTrigger = useScrollTrigger({
    disableHysteresis: true,
    threshold: 100,
  });

  return <>
    {children}
    <Transition in={slideTrigger} timeout={225}>
      <Fab variant="extended" size='medium' component={RouterLink} prefetch={false} href={`/new/${params.handle}`}
        sx={{ position: 'fixed', right: slideTrigger ? 64 : 24, bottom: 16, px: 2, displayPrint: 'none', transition: `right 225ms ease-in-out` }}>
        <EditIcon />Fork
      </Fab>
    </Transition>
  </>
}

export default ViewDocument;