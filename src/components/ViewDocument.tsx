/* eslint-disable react-hooks/exhaustive-deps */
import { useEffect, useState } from "react";
import { useDispatch } from "react-redux";
import { actions } from "../slices";
import { AppDispatch } from "../store";
import { useParams, Link as RouterLink } from "react-router-dom";
import Editor from "../lexical";

import SplashScreen from "./SplachScreen";
import { Helmet } from "react-helmet";
import { EditorDocument } from "../slices/app";
import Fab from "@mui/material/Fab";
import EditIcon from '@mui/icons-material/Edit';
import useScrollTrigger from "@mui/material/useScrollTrigger";
import { Transition } from 'react-transition-group';
import documentDB from "../db";

const ViewDocument: React.FC = () => {
  const dispatch = useDispatch<AppDispatch>();
  const params = useParams<{ id: string }>();
  const [document, setDocument] = useState<EditorDocument | null>(null);
  const slideTrigger = useScrollTrigger({
    disableHysteresis: true,
    threshold: 100,
  });

  useEffect(() => {
    const loadDocument = async (id: string) => {
      // load from local storage
      const storedDocument = await documentDB.getByID(id);
      if (storedDocument) {
        setDocument(storedDocument);
      } else {
        // load from server
        const response = await dispatch(actions.app.getDocumentAsync(id));
        const { payload, error } = response as any;
        if (!error) setDocument(payload);
      }
    }
    params.id && loadDocument(params.id);
  }, []);

  if (!document) {
    return <SplashScreen title="Loading Document" />;
  }

  return document.id === params.id ? <>
    <Helmet><title>{document.name}</title></Helmet>
    <Editor document={document} editable={false} />
    <Transition in={slideTrigger} timeout={225}>
      <Fab variant="extended" size='medium' component={RouterLink} to={`/new/${document.id}`} state={{ data: document.data }}
        sx={{ position: 'fixed', right: slideTrigger ? 64 : 24, bottom: 24, px: 2, displayPrint: 'none', transition: `right 225ms ease-in-out` }}>
        <EditIcon />Fork
      </Fab>
    </Transition>
  </> : <SplashScreen />;
}

export default ViewDocument;