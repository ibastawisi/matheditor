"use client"
import * as React from 'react';
import { DocumentRevision, isCloudDocument, isLocalDocument } from '@/types';
import { memo } from 'react';
import { SxProps, Theme } from '@mui/material/styles';
import { Card, CardActionArea, CardHeader, Avatar, CardActions, Chip, IconButton } from '@mui/material';
import { CloudDone, CloudUpload, Delete, MobileFriendly } from '@mui/icons-material';
import { useSelector } from '@/store';

const RevisionCard: React.FC<{
  revision: DocumentRevision,
  restoreRevision: () => void, deleteRevision: () => void,
  sx?: SxProps<Theme> | undefined
}> = memo(({ revision, restoreRevision, deleteRevision, sx }) => {
  const user = useSelector(state => state.user);
  const localDocument = useSelector(state => state.documents.filter(isLocalDocument).find(d => d.id === revision.documentId));
  const cloudDocument = useSelector(state => state.documents.filter(isCloudDocument).find(d => d.id === revision.documentId));
  const isLocalHead = revision.id === localDocument?.head;
  const isCloudHead = cloudDocument && revision.id === cloudDocument.head;
  const showSave = !cloudDocument?.revisions?.find(r => r.id === revision.id);
  const isAuthor = user?.id === revision.author.id;
  const showDelete = !(isLocalHead || isCloudHead);
  return (
    <Card variant="outlined"
      sx={{
        display: "flex",
        flexDirection: "column",
        justifyContent: "space-between",
        height: "100%",
        maxWidth: "100%",
        ...sx
      }}>
      <CardActionArea sx={{ flexGrow: 1 }} onClick={restoreRevision}>
        <CardHeader sx={{ alignItems: "start", '& .MuiCardHeader-content': { overflow: "hidden", textOverflow: "ellipsis" } }}
          title={new Date(revision.createdAt).toLocaleString()}
          subheader={revision.author.name}
          avatar={<Avatar sx={{ bgcolor: 'primary.main' }} src={revision.author.image || undefined}></Avatar>}
        />
      </CardActionArea>
      <CardActions sx={{ "& button:first-of-type": { ml: "auto !important" }, '& .MuiChip-root:last-of-type': { mr: 1 } }}>
        {isLocalHead && <Chip sx={{ width: 0, flex: 1, maxWidth: "fit-content" }} icon={<MobileFriendly />} label="Current" />}
        {isCloudHead && <Chip sx={{ width: 0, flex: 1, maxWidth: "fit-content" }} icon={<CloudDone />} label="Cloud" />}
        {showSave && <>
          <IconButton aria-label="Save Revision" size="small" onClick={restoreRevision}><CloudUpload /></IconButton>
        </>}
        {showDelete && <>
          <IconButton aria-label="Delete Revision" size="small" onClick={deleteRevision} disabled={!isAuthor}><Delete /></IconButton>
        </>}
      </CardActions>
    </Card>
  );
});

export default RevisionCard;