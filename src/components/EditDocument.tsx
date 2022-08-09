/* eslint-disable react-hooks/exhaustive-deps */
import { useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import { actions } from "../slices";
import { AppDispatch, RootState } from "../store";
import { useNavigate, useParams } from "react-router-dom";
import Editor from "../lexical/Editor";

import SplashScreen from "./SplachScreen";
import { Helmet } from "react-helmet";

const EditDocument: React.FC = () => {
  const dispatch = useDispatch<AppDispatch>();
  const document = useSelector((state: RootState) => state.app.editor);
  const params = useParams<{ id: string }>();
  const navigate = useNavigate();

  useEffect(() => {
    window.scrollTo(0, 0);
    const loadDocument = async (id: string) => {
      // load from local storage
      const storedDocument = window.localStorage.getItem(id);
      if (storedDocument) {
        const editorDocument = JSON.parse(storedDocument);
        dispatch(actions.app.loadDocument(editorDocument));
      } else {
        // load from server
        const { payload } = await dispatch(actions.app.getDocumentAsync(id));
        if (!payload) return;
        dispatch(actions.app.loadDocument(payload));
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

  return document.id === params.id ? <>
    <Helmet><title>{document.name}</title></Helmet>
    <Editor document={document} />
  </> : <SplashScreen title="Loading Document" />;
}

export default EditDocument;