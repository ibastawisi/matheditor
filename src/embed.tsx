/* eslint-disable react-hooks/exhaustive-deps */
import { useState, useEffect } from "react";
import { useParams } from "react-router-dom";
import { getDocument } from "./services";
import { exportHtml } from "./utils/exportHtml";
import type { EditorDocument } from "./types";
import { Helmet } from "react-helmet";

const EmbedDocument: React.FC = () => {
  const [document, setDocument] = useState<EditorDocument | null>(null);
  const params = useParams<{ id: string }>();
  useEffect(() => {
    const loadDocument = async (id: string) => {
      try {
        const data = await getDocument(id);
        if (data) setDocument(data);
        const html = await exportHtml(data);
        window.document.write(html);
      } catch (error) {
        console.error(error);
      }
    }
    params.id && loadDocument(params.id);
  }, []);

  return <Helmet defaultTitle="Loading Document" title={document?.name} />
}

export default EmbedDocument;