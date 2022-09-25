/* eslint-disable react-hooks/exhaustive-deps */
import Editor from "../lexical";
import { Helmet } from "react-helmet";
import playgroundTemplate from '../templates/Playground.json';
import { EditorDocument } from "../slices/app";

const Playground: React.FC = () => {
  const document = playgroundTemplate as unknown as EditorDocument;

  return <>
    <Helmet><title>{document.name}</title></Helmet>
    <Editor document={(document as EditorDocument)} editable={true} />
  </>;
}

export default Playground;