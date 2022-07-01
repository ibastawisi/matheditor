/* eslint-disable react-hooks/exhaustive-deps */
import { useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import { actions } from "../slices";
import { AppDispatch, RootState } from "../store";
import { useNavigate, useParams } from "react-router-dom";
import Editor from "../editorjs/Editor";

import { validate } from "uuid";
import SplashScreen from "./SplachScreen";
import { Helmet } from "react-helmet";

const EditDocument: React.FC = () => {
  const dispatch = useDispatch<AppDispatch>();
  const document = useSelector((state: RootState) => state.app.editor);
  const params = useParams<{ id: string }>();
  const navigate = useNavigate();

  useEffect(() => {
    if (params.id) {
      if (document.id === params.id) return;
      if (validate(params.id)) {
        try {
          // load from local storage
          const storedDocument = window.localStorage.getItem(params.id);
          if (storedDocument) {
            dispatch(actions.app.loadDocument(JSON.parse(storedDocument)));
          } else {
            dispatch(actions.app.announce({ message: "No document with this id was found" }));
          }
        } catch (error) {
          dispatch(actions.app.announce({ message: "Invalid document data" }));
        }
      } else {
        dispatch(actions.app.announce({ message: "Document id is malformatted!" }));
        navigate("/open");
      }
    } else {
      navigate("/new");
    }

  }, []);

  return document.id === params.id ? <>
    <Helmet><title>{document.name}</title></Helmet>
    <Editor document={document} />
  </> : <SplashScreen />;
}

export default EditDocument;