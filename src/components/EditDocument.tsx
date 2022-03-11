/* eslint-disable react-hooks/exhaustive-deps */
import { useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import { actions } from "../slices";
import { AppDispatch, RootState } from "../store";
import { useNavigate, useParams } from "react-router-dom";
import Editor from "./Editor";
import CircularProgress from "@mui/material/CircularProgress";
import { validate } from "uuid";
import JSONCrush from "jsoncrush";

const EditDocument: React.FC = () => {
  const dispatch = useDispatch<AppDispatch>();
  const document = useSelector((state: RootState) => state.app.document);
  const params = useParams<{ id: string }>();
  const navigate = useNavigate();

  useEffect(() => {
    if (params.id) {
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
        try {
          // parse document from url
          const document = JSON.parse(JSONCrush.uncrush(params.id));
          if (document.id) {
            window.localStorage.setItem(document.id, JSON.stringify(document));
            dispatch(actions.app.loadDocument(document));
            navigate(`/edit/${document.id}`);
          }
        } catch (error) {
          dispatch(actions.app.announce({ message: "Invalid document data" }));
        }
      }
    } else {
      // create new document
      navigate("/new");
    }

  }, []);

  return document.id === params.id ? <Editor document={document} /> : <CircularProgress />;
}

export default EditDocument;