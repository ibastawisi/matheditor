/* eslint-disable react-hooks/exhaustive-deps */
import { useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import { actions } from "../slices";
import { AppDispatch, RootState } from "../store";
import { useParams } from "react-router-dom";
import Editor from "../lexical/Editor";

import SplashScreen from "./SplachScreen";
import { Helmet } from "react-helmet";

const EditDocument: React.FC = () => {
  const dispatch = useDispatch<AppDispatch>();
  const document = useSelector((state: RootState) => state.app.editor);
  const params = useParams<{ id: string }>();

  useEffect(() => {
    const loadDocument = async (id: string) => {
      // load from local storage
      const storedDocument = window.localStorage.getItem(id);
      if (storedDocument) {
        const editorDocument = JSON.parse(storedDocument);
        dispatch(actions.app.loadDocument(editorDocument));
      } else {
        // load from server
        const response = await dispatch(actions.app.getDocumentAsync(id));
        const { payload, error } = response as any;
        if (!error) dispatch(actions.app.loadDocument(payload));
      }
    }
    params.id && loadDocument(params.id);

  }, []);

  return document.id === params.id ? <>
    <Helmet><title>{document.name}</title></Helmet>
    <Editor document={document} editable={true} />
  </> : <SplashScreen title="Loading Document" />;
}

export default EditDocument;