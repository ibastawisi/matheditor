/* eslint-disable react-hooks/exhaustive-deps */
import { useEffect, useState } from "react";
import { useDispatch } from "react-redux";
import { actions } from "../slices";
import { AppDispatch } from "../store";
import { useNavigate, useParams, Link as RouterLink } from "react-router-dom";
import Editor from "../lexical/Editor";

import SplashScreen from "./SplachScreen";
import { Helmet } from "react-helmet";
import { EditorDocument } from "../slices/app";
import Fab from "@mui/material/Fab";
import EditIcon from '@mui/icons-material/Edit';

const ViewDocument: React.FC = () => {
  const dispatch = useDispatch<AppDispatch>();
  const params = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [document, setDocument] = useState<EditorDocument | null>(null);

  useEffect(() => {
    const loadDocument = async (id: string) => {
      // load from local storage
      const storedDocument = window.localStorage.getItem(id);
      if (storedDocument) {
        const editorDocument = JSON.parse(storedDocument);
        setDocument(editorDocument);
      } else {
        // load from server
        const { payload } = await dispatch(actions.app.getDocumentAsync(id));
        if (!payload) return;
        setDocument(payload);
      }
    }
    if (params.id) {
      try {
        loadDocument(params.id);
      } catch (error) {
        dispatch(actions.app.announce({ message: "No document with this id was found" }));
        setTimeout(() => { navigate("/open"); }, 3000);
      }
    } else {
      navigate("/open");
    }
  }, []);

  if (!document) {
    return <SplashScreen title="Loading Document" />;
  }

  return document.id === params.id ? <>
    <Helmet><title>{document.name}</title></Helmet>
    <Editor document={document} readOnly />
    <Fab variant="extended" size='medium' component={RouterLink} to="/new" state={{ data: document.data }}
      sx={{ position: 'fixed', bottom: 24, right: 48, px: 2, displayPrint: 'none' }}>
      <EditIcon />
      Fork
    </Fab>
  </> : <SplashScreen />;
}

export default ViewDocument;