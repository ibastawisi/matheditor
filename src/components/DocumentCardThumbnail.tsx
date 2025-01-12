"use client"
import * as React from 'react';
import { memo, useEffect } from 'react';
import { Box, Skeleton } from '@mui/material';
import { actions, useDispatch } from '@/store';
import { generateHtml } from '@/editor';

const DocumentCardThumbnail: React.FC<{ documetId?: string }> = memo(({ documetId }) => {
  const dispatch = useDispatch();
  const [thumbnail, setThumbnail] = React.useState<string | null>(null);

  const getDocumentThumbnail = async () => {
    if (!documetId) return null;
    const localResponse = await dispatch(actions.getLocalDocument(documetId));
    if (localResponse.type === actions.getLocalDocument.fulfilled.type) {
      const editorDocument = localResponse.payload as ReturnType<typeof actions.getLocalDocument.fulfilled>['payload'];
      const data = editorDocument.data;
      const thumbnail = await generateHtml({ ...data, root: { ...data.root, children: data.root.children.slice(0, 5) } });
      return thumbnail;
    } else {
      const cloudResponse = await dispatch(actions.getCloudDocumentThumbnail(documetId));
      if (cloudResponse.type === actions.getCloudDocumentThumbnail.fulfilled.type) {
        const thumbnail = cloudResponse.payload as ReturnType<typeof actions.getCloudDocumentThumbnail.fulfilled>['payload'];
        return thumbnail;
      }
    }
    return null;
  }

  useEffect(() => {
    getDocumentThumbnail().then(setThumbnail);
  }, []);

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