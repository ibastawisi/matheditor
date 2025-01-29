"use client"
import { UserDocument } from "@/types";
import { memo, use } from "react";
import { useThumbnailContext } from "../../app/context/ThumbnailContext";
import { Box } from "@mui/material";
import LocalDocumentThumbnail from "./LocalDocumentThumbnail";

const DocumentThumbnail: React.FC<{ userDocument?: UserDocument }> = memo(({ userDocument }) => {
  const localDocument = userDocument?.local;
  const cloudDocument = userDocument?.cloud;
  const isLocal = !!localDocument;
  const isCloud = !!cloudDocument;
  const isCloudOnly = isCloud && !isLocal;
  const document = isCloudOnly ? cloudDocument : localDocument;
  const thumbnailContext = useThumbnailContext();
  if (!thumbnailContext) return <LocalDocumentThumbnail documentId={document?.id} revisionId={document?.head} />;
  const thumbnailPromise = thumbnailContext[document?.head ?? ''];
  if (!thumbnailPromise) return <LocalDocumentThumbnail documentId={document?.id} revisionId={document?.head} />;
  const thumbnail = use(thumbnailPromise);
  return (
    <Box className='document-thumbnail' dangerouslySetInnerHTML={{ __html: thumbnail.replaceAll('<a', '<span').replaceAll('</a', '</span') }} />
  );
});

export default DocumentThumbnail;