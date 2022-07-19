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
    if (params.id) {
      try {
        // load from local storage
        const storedDocument = window.localStorage.getItem(params.id);
        if (storedDocument) {
          const editorDocument = JSON.parse(storedDocument);
          dispatch(actions.app.loadDocument(editorDocument));
        } else {
          dispatch(actions.app.announce({ message: "No document with this id was found" }));
          setTimeout(() => { navigate("/open"); }, 3000);
        }
      } catch (error) {
        dispatch(actions.app.announce({ message: "Invalid document data" }));
        setTimeout(() => { navigate("/open"); }, 3000);
      }
    } else {
      navigate("/open");
    }

  }, []);

  return document.id === params.id ? <>
    <Helmet><title>{document.name}</title></Helmet>
    <Editor document={document} />
  </> : <SplashScreen />;
}

export default EditDocument;