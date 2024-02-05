"use client"
import * as React from 'react';
import RouterLink from 'next/link'
import { LocalDocumentRevision, User, UserDocument, UserDocumentRevision } from '@/types';
import { memo } from 'react';
import { SxProps, Theme } from '@mui/material/styles';
import { Card, CardActionArea, CardHeader, Skeleton, Typography, Avatar, CardActions, Chip, Badge } from '@mui/material';
import { Article, MobileFriendly, CloudDone, CloudSync, Cloud, Public, Workspaces } from '@mui/icons-material';

import dynamic from "next/dynamic";
import { useSelector } from 'react-redux';
const DocumentActionMenu = dynamic(() => import('@/components/DocumentActions/ActionMenu'), { ssr: false });

const DocumentCard: React.FC<{ userDocument?: UserDocument, user?: User, sx?: SxProps<Theme> | undefined }> = memo(({ userDocument, user, sx }) => {
  const localDocument = userDocument?.local;
  const cloudDocument = userDocument?.cloud;
  const isLocal = !!localDocument;
  const isCloud = !!cloudDocument;
  const isLocalOnly = isLocal && !isCloud;
  const isCloudOnly = !isLocal && isCloud;
  const isUploaded = isLocal && isCloud;
  const isUpToDate = isUploaded && localDocument.updatedAt === cloudDocument.updatedAt;
  const isPublished = isCloud && cloudDocument.published;
  const isCollab = isPublished && cloudDocument.collab;
  const isAuthor = isCloud ? cloudDocument.author.id === user?.id : true
  const isCoauthor = isCloud ? cloudDocument.coauthors.some(u => u.id === user?.id) : false;

  const document = isCloudOnly ? cloudDocument : localDocument;
  const handle = cloudDocument?.handle ?? localDocument?.handle ?? document?.id;
  const href = (isAuthor || isCoauthor || isCollab) ? `/edit/${handle}` : `/view/${handle}`;
  const authorName = cloudDocument?.author.name ?? user?.name ?? 'Local User';

  const cloudDocumentRevisions = cloudDocument?.revisions ?? [];
  const isHeadCloudRevision = cloudDocumentRevisions.some(r => r.id === localDocument?.head);

  const revisions: UserDocumentRevision[] = [...cloudDocumentRevisions];
  if (isLocal && !isHeadCloudRevision) {
    const unsavedRevision = {
      id: localDocument.head,
      documentId: localDocument.id,
      createdAt: localDocument.updatedAt,
    } as LocalDocumentRevision;
    revisions.unshift(unsavedRevision);
  }
  const sortedRevisions = [...revisions].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

  const revisionsBadgeContent = sortedRevisions.findIndex(r => r.id === cloudDocument?.head);
  const showRevisionsBadge = revisionsBadgeContent > 0;

  return (
    <Card variant="outlined" sx={{ display: "flex", flexDirection: "column", justifyContent: "space-between", height: "100%", maxWidth: "100%", ...sx }}>
      <CardActionArea component={RouterLink} prefetch={false} scroll={false} href={document ? href : "/"} sx={{ flexGrow: 1 }}>
        <CardHeader sx={{ alignItems: "start", '& .MuiCardHeader-content': { overflow: "hidden", textOverflow: "ellipsis" } }}
          title={document ? document.name : <Skeleton variant="text" width={190} />}
          subheader={
            <>
              <Typography component="span" variant="subtitle2" color="text.secondary"
                sx={{ display: "block", lineHeight: 2, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}
              >
                {document ? authorName : <Skeleton variant="text" width={100} />}
              </Typography>
              <Typography variant="overline" color="text.secondary"
                sx={{ display: "block", lineHeight: 1.5, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                {document ? <>Created: {new Date(document.createdAt).toLocaleString()}</> : <Skeleton variant="text" width={150} />}
              </Typography>
              <Typography variant="overline" color="text.secondary"
                sx={{ display: "block", lineHeight: 1.5, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}
              >
                {document ? <>Updated: {new Date(document.updatedAt).toLocaleString()}</> : <Skeleton variant="text" width={160}></Skeleton>}
              </Typography>
            </>
          }
          avatar={showRevisionsBadge ?
            <Badge badgeContent={revisionsBadgeContent} color="secondary">
              <Avatar sx={{ bgcolor: 'primary.main' }}><Article /></Avatar>
            </Badge> :
            <Avatar sx={{ bgcolor: 'primary.main' }}><Article /></Avatar>
          }
        />
      </CardActionArea>
      <CardActions sx={{ height: 50, "& button:first-of-type": { ml: "auto !important" }, '& .MuiChip-root:last-of-type': { mr: 1 } }}>
        {!document && <Chip sx={{ width: 0, flex: 1, maxWidth: "fit-content" }} label={<Skeleton variant="text" width={50} />} />}
        {!document && <Chip sx={{ width: 0, flex: 1, maxWidth: "fit-content" }} label={<Skeleton variant="text" width={70} />} />}
        {isLocalOnly && <Chip sx={{ width: 0, flex: 1, maxWidth: "fit-content" }} icon={<MobileFriendly />} label="Local" />}
        {isUploaded && !isCollab && <Chip sx={{ width: 0, flex: 1, maxWidth: "fit-content" }} icon={isUpToDate ? <CloudDone /> : <CloudSync />} label={isUpToDate ? "Up to date" : "Out of Sync"} />}
        {isCloudOnly && !isCollab && (isAuthor || isCoauthor) && <Chip sx={{ width: 0, flex: 1, maxWidth: "fit-content" }} icon={<Cloud />} label="Cloud" />}
        {isPublished && <Chip sx={{ width: 0, flex: 1, maxWidth: "fit-content" }} icon={<Public />} label="Published" />}
        {isCollab && <Chip sx={{ width: 0, flex: 1, maxWidth: "fit-content" }} icon={<Workspaces />} label="Collab" />}
        {userDocument && <DocumentActionMenu userDocument={userDocument} user={user} />}
      </CardActions>
    </Card >
  );
});

export default DocumentCard;