/* eslint-disable react-hooks/exhaustive-deps */
import Editor from "../lexical/Editor";
import { Helmet } from "react-helmet";
import playgroundTemplate from '../templates/Playground.json';
import { EditorDocument } from "../slices/app";
import { useEffect } from "react";
import { useDispatch } from "react-redux";
import { actions } from "../slices";
import { AppDispatch } from "../store";

const Playground: React.FC = () => {
  const document = playgroundTemplate as unknown as EditorDocument;
  const dispatch = useDispatch<AppDispatch>();

  useEffect(() => {
    dispatch(actions.app.loadDocument(document));
  }, []);

  return <>
    <Helmet><title>{document.name}</title></Helmet>
    <Editor document={(document as EditorDocument)} />
  </>;
}

export default Playground;