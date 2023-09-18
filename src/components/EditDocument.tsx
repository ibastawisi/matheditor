"use client"
import { useEffect, useState } from "react";
import Editor from "./Editor";
import SplashScreen from "./SplashScreen";
import { Helmet } from "react-helmet";
import { EditorDocument } from '@/types';
import { useDispatch, useSelector, actions } from '@/store';
import { usePathname } from "next/navigation";

const EditDocument: React.FC = () => {
  const [document, setDocument] = useState<EditorDocument>();
  const [error, setError] = useState<string>();
  const dispatch = useDispatch();
  const pathname = usePathname();
  const id = pathname.split('/')[2];

  useEffect(() => {
    const loadDocument = async (id: string) => {
      const localResponse = await dispatch(actions.getLocalDocument(id));
      if (localResponse.type === actions.getLocalDocument.fulfilled.type) {
        const localDocument = localResponse.payload as EditorDocument;
        setDocument(localDocument);
      } else {
        const cloudResponse = await dispatch(actions.getCloudDocument(id));
        if (cloudResponse.type === actions.getCloudDocument.fulfilled.type) {
          const cloudDocument = cloudResponse.payload as ReturnType<typeof actions.getCloudDocument.fulfilled>['payload'];
          const { author, revisions, head, ...localDocument } = cloudDocument;
          setDocument(localDocument);
          dispatch(actions.createLocalDocument(localDocument));
        } else if (cloudResponse.type === actions.getCloudDocument.rejected.type) {
          setError(cloudResponse.payload as string);
        }
      }
    }
    id ? loadDocument(id) : setError("No document id provided");
  }, []);

  if (error) return <SplashScreen title={error} />;
  if (!document) return <SplashScreen title="Loading Document" />;

  return <>
    <Helmet title={`${document.name} | Math Editor`} />
    <Editor document={document} />
  </>;
}

export default EditDocument;