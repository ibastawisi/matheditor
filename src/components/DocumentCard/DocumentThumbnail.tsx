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
  const thumbnailPromise = thumbnailContext?.[document?.head ?? ''];
  const thumbnail = thumbnailPromise ? use(thumbnailPromise) : null;
  if (thumbnail) return (
    <Box className='document-thumbnail' dangerouslySetInnerHTML={{ __html: thumbnail.replaceAll('<a', '<span').replaceAll('</a', '</span') }} />
  );
  // the server only has the cloud head's thumbnail; show it while the local head's thumbnail is generated
  const placeholderPromise = isLocal && isCloud ? thumbnailContext?.[cloudDocument.head] : undefined;
  const placeholder = placeholderPromise ? use(placeholderPromise) : null;
  return <LocalDocumentThumbnail documentId={document?.id} revisionId={document?.head} placeholder={placeholder} />;
});

export default DocumentThumbnail;
