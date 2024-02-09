"use client"
import * as React from 'react';
import RouterLink from 'next/link'
import { User, UserDocument } from '@/types';
import { memo } from 'react';
import { SxProps, Theme } from '@mui/material/styles';
import { Card, CardActionArea, CardHeader, Skeleton, Typography, Avatar, CardActions, Chip, Badge } from '@mui/material';
import { Article, MobileFriendly, Cloud, Public, Workspaces, Security, CloudDone, CloudSync } from '@mui/icons-material';

import dynamic from "next/dynamic";
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
  const isPrivate = isCloud && cloudDocument.private;
  const isAuthor = isCloud ? cloudDocument.author.id === user?.id : true
  const isCoauthor = isCloud ? cloudDocument.coauthors.some(u => u.id === user?.id) : false;

  const document = isCloudOnly ? cloudDocument : localDocument;
  const handle = cloudDocument?.handle ?? localDocument?.handle ?? document?.id;
  const href = (isAuthor || isCoauthor || isCollab) ? `/edit/${handle}` : `/view/${handle}`;
  const authorName = cloudDocument?.author.name ?? user?.name ?? 'Local User';

  const localDocumentRevisions = localDocument?.revisions ?? [];
  const cloudDocumentRevisions = cloudDocument?.revisions ?? [];
  const collabDocumentRevisions = cloudDocumentRevisions.filter(r => r.author.id !== cloudDocument?.author.id);
  const cloudHeadIndex = cloudDocumentRevisions.findIndex(r => r.id === cloudDocument?.head);
  const showRevisionsNumber = isAuthor && collabDocumentRevisions.length > 0 && cloudHeadIndex > 0;
  const showRevisionsDot = isUploaded && !isUpToDate && !showRevisionsNumber;
  const showRevisionsBadge = showRevisionsNumber || showRevisionsDot;
  const revisionsBadgeContent = showRevisionsNumber ? cloudHeadIndex : 1;

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
            <Badge badgeContent={revisionsBadgeContent} color="secondary" variant={showRevisionsDot ? "dot" : "standard"}>
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
        {isUploaded && !isCollab && <Chip sx={{ width: 0, flex: 1, maxWidth: "fit-content" }} icon={isUpToDate ? <CloudDone /> : <CloudSync />} label={isUpToDate ? "Synced" : "Out of Sync"} />}
        {isCloudOnly && !isCollab && (isAuthor || isCoauthor) && <Chip sx={{ width: 0, flex: 1, maxWidth: "fit-content" }} icon={<Cloud />} label="Cloud" />}
        {isPublished && <Chip sx={{ width: 0, flex: 1, maxWidth: "fit-content" }} icon={<Public />} label="Published" />}
        {isCollab && <Chip sx={{ width: 0, flex: 1, maxWidth: "fit-content" }} icon={<Workspaces />} label="Collab" />}
        {isPrivate && <Chip sx={{ width: 0, flex: 1, maxWidth: "fit-content" }} icon={<Security />} label="Private" />}
        {userDocument && <DocumentActionMenu userDocument={userDocument} user={user} />}
      </CardActions>
    </Card >
  );
});

export default DocumentCard;