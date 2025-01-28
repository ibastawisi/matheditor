"use client"
import { UserDocument } from "@/types";
import { memo, Suspense, use } from "react";
import ThumbnailSkeleton from "./ThumbnailSkeleton";
import { useThumbnailContext } from "../../app/context/ThumbnailContext";
import { Box } from "@mui/material";
import LocalDocumentThumbnail from "./LocalDocumentThumbnail";

const DocumentThumbnail: React.FC<{ userDocument?: UserDocument }> = memo(({ userDocument }) => {
  const localDocument = userDocument?.local;
  const cloudDocument = userDocument?.cloud;
  const isLocal = !!localDocument;
  const isCloud = !!cloudDocument;
  const isCloudOnly = isCloud && !isLocal;
  const isPublished = isCloudOnly && cloudDocument.published;
  const document = isCloudOnly ? cloudDocument : localDocument;
  const thumbnailContext = useThumbnailContext();
  if (!thumbnailContext) return <LocalDocumentThumbnail documentId={document?.id} revisionId={document?.head} />;
  if (isPublished) {
    const thumbnailPromise = thumbnailContext[cloudDocument.head];
    if (!thumbnailPromise) return <LocalDocumentThumbnail documentId={document?.id} revisionId={document?.head} />;
    const thumbnail = use(thumbnailPromise);
    return (
      <Suspense fallback={<ThumbnailSkeleton />}>
        <Box className='document-thumbnail' dangerouslySetInnerHTML={{ __html: thumbnail.replaceAll('<a', '<span').replaceAll('</a', '</span') }} />
      </Suspense>
    );
  }

  return <LocalDocumentThumbnail documentId={document?.id} revisionId={document?.head} />;
});

export default DocumentThumbnail;