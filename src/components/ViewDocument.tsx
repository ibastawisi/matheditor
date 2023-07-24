"use client"
import { useEffect, useState } from "react";
import RouterLink from 'next/link'
import SplashScreen from "./SplashScreen";
import { Helmet } from "react-helmet";
import { EditorDocument } from '@/types';
import Fab from "@mui/material/Fab";
import EditIcon from '@mui/icons-material/Edit';
import useScrollTrigger from "@mui/material/useScrollTrigger";
import { Transition } from 'react-transition-group';
import documentDB from "../indexeddb";
import dynamic from "next/dynamic";

const Viewer = dynamic(() => import("@/editor/Viewer"), { ssr: false, loading: () => <SplashScreen title="Loading Viewer" /> });

const ViewDocument: React.FC<{ params: { id?: string }, cloudDocument?: EditorDocument }> = ({ params, cloudDocument }) => {
  const [document, setDocument] = useState<EditorDocument | null>(null);
  const slideTrigger = useScrollTrigger({
    disableHysteresis: true,
    threshold: 100,
  });

  useEffect(() => {
    const loadDocument = async (id: string) => {
      const storedDocument = await documentDB.getByID(id);
      if (storedDocument) {
        setDocument(storedDocument);
      } else if (cloudDocument) {
        setDocument(cloudDocument);
      }
    }
    params.id && loadDocument(params.id);
  }, []);

  if (!document) {
    return <SplashScreen title="Loading Document" />;
  }

  return document.id === params.id ? <>
    <Helmet><title>{document.name}</title></Helmet>
    <Viewer initialConfig={{ editorState: JSON.stringify(document.data) }} />
    <Transition in={slideTrigger} timeout={225}>
      <Fab variant="extended" size='medium' component={RouterLink} href={{ pathname: `/new/${document.id}`, query: { data: JSON.stringify(document.data) } } as any}
        sx={{ position: 'fixed', right: slideTrigger ? 64 : 24, bottom: 24, px: 2, displayPrint: 'none', transition: `right 225ms ease-in-out` }}>
        <EditIcon />Fork
      </Fab>
    </Transition>
  </> : <SplashScreen />;
}

export default ViewDocument;