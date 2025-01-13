"use client"
import * as React from 'react';
import { memo, useEffect, useState } from 'react';
import { Box, Skeleton } from '@mui/material';
import { generateHtml } from '@/editor';
import documentDB from '@/indexeddb';
import { GetDocumentThumbnailResponse } from '@/types';

const thumbnailCache = new Map<string, string>();

const getDocumentThumbnail = async (id: string, head: string) => {
  const cachedThumbnail = thumbnailCache.get(id);
  if (cachedThumbnail) return cachedThumbnail;
  const document = await documentDB.getByID(id);
  if (document) {
    const data = document.data;
    const thumbnail = await generateHtml({ ...data, root: { ...data.root, children: data.root.children.slice(0, 5) } });
    thumbnailCache.set(head, thumbnail);
    return thumbnail;
  } else {
    const response = await fetch(`/api/thumbnails/${id}`);
    const { data } = await response.json() as GetDocumentThumbnailResponse;
    if (data) thumbnailCache.set(head, data);
    return data;
  }
}

const DocumentCardThumbnail: React.FC<{ documentId?: string, head?: string }> = memo(({ documentId, head }) => {
  const [thumbnail, setThumbnail] = useState(head ? thumbnailCache.get(head) : null);

  useEffect(() => {
    if (!documentId || !head) return;
    getDocumentThumbnail(documentId, head).then(setThumbnail);
  }, [documentId, head]);

  if (thumbnail) return <Box className='document-thumbnail' dangerouslySetInnerHTML={{ __html: thumbnail.replaceAll('<a', '<span').replaceAll('</a', '</span') }} />;
  return (
    <Box className='document-thumbnail' sx={{ display: 'flex', flexDirection: 'column' }}>
      <Skeleton variant="text" width={150} height={40} sx={{ alignSelf: "center" }} />
      <Skeleton variant="text" width={100} height={20} sx={{ alignSelf: "start", my: 1 }} />
      <Skeleton variant="text" width={150} height={20} sx={{ alignSelf: "start", my: 1 }} />
      <Skeleton variant="text" width={120} height={20} sx={{ alignSelf: "start", my: 1 }} />
      <Skeleton variant="rectangular" width="100%" height={100} sx={{ alignSelf: "center", my: 2 }} />
    </Box>
  );
});

export default DocumentCardThumbnail;