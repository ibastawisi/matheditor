"use client"
import * as React from 'react';
import { memo, useEffect, useState } from 'react';
import { Box } from '@mui/material';
import documentDB from '@/indexeddb';
import { GetDocumentThumbnailResponse } from '@/types';
import ThumbnailSkeleton from './ThumbnailSkeleton';

const thumbnailCache = new Map<string, string>();

const getDocumentThumbnail = async (documentId: string, revisionId: string) => {
  const cachedThumbnail = thumbnailCache.get(revisionId);
  if (cachedThumbnail) return cachedThumbnail;
  const document = await documentDB.getByID(documentId);
  if (document) {
    const data = document.data;
    const { generateHtml } = await import('@/editor/utils/generateHtml');
    const thumbnail = await generateHtml({ ...data, root: { ...data.root, children: data.root.children.slice(0, 3) } });
    thumbnailCache.set(revisionId, thumbnail);
    return thumbnail;
  } else {
    const response = await fetch(`/api/thumbnails/${documentId}`);
    const { data } = await response.json() as GetDocumentThumbnailResponse;
    if (data) thumbnailCache.set(revisionId, data);
    return data;
  }
}

const LocalDocumentThumbnail: React.FC<{ documentId?: string, revisionId?: string, placeholder?: string | null }> = memo(({ documentId, revisionId, placeholder }) => {
  const [thumbnail, setThumbnail] = useState(revisionId ? thumbnailCache.get(revisionId) : null);

  useEffect(() => {
    if (!documentId || !revisionId) return;
    getDocumentThumbnail(documentId, revisionId).then(setThumbnail);
  }, [documentId, revisionId]);

  const html = thumbnail || placeholder;
  if (html) return <Box className='document-thumbnail' dangerouslySetInnerHTML={{ __html: html.replaceAll('<a', '<span').replaceAll('</a', '</span') }} />;
  return <ThumbnailSkeleton />;
});

export default LocalDocumentThumbnail;
