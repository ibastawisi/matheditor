"use client"
import * as React from 'react';
import RouterLink from 'next/link'
import { LocalDocumentRevision, User, UserDocument } from '@/types';
import { memo, Suspense } from 'react';
import { SxProps, Theme } from '@mui/material/styles';
import { Card, CardActionArea, CardHeader, Skeleton, Typography, Avatar, CardActions, Chip, Badge, IconButton } from '@mui/material';
import { MobileFriendly, Cloud, Public, Workspaces, Security, CloudDone, CloudSync, MoreVert, Share } from '@mui/icons-material';
import DocumentActionMenu from './DocumentActionMenu';
import DocumentThumbnail from './DocumentThumbnail';
import ThumbnailSkeleton from './ThumbnailSkeleton';
import { useHydration } from '@/hooks/useHydration';

const DocumentCard: React.FC<{ userDocument?: UserDocument, user?: User, sx?: SxProps<Theme> | undefined }> = memo(({ userDocument, user, sx }) => {
  const localDocument = userDocument?.local;
  const cloudDocument = userDocument?.cloud;
  const isLocal = !!localDocument;
  const isCloud = !!cloudDocument;
  const isLocalOnly = isLocal && !isCloud;
  const isCloudOnly = !isLocal && isCloud;
  const isUploaded = isLocal && isCloud;
  const isUpToDate = isUploaded && localDocument.head === cloudDocument.head;
  const isPublished = isCloud && cloudDocument.published;
  const isCollab = isCloud && cloudDocument.collab;
  const isPrivate = isCloud && cloudDocument.private;
  const isAuthor = isCloud ? cloudDocument.author.id === user?.id : true
  const isCoauthor = isCloud ? cloudDocument.coauthors.some(u => u.id === user?.id) : false;

  const document = isCloudOnly ? cloudDocument : localDocument;
  const handle = cloudDocument?.handle ?? localDocument?.handle ?? document?.id;
  const isEditable = isAuthor || isCoauthor || isCollab;
  const href = isEditable ? `/edit/${handle}` : `/view/${handle}`;
  const author = cloudDocument?.author ?? user;

  const localDocumentRevisions = localDocument?.revisions ?? [];
  const cloudDocumentRevisions = cloudDocument?.revisions ?? [];
  const isHeadLocalRevision = localDocumentRevisions.some(r => r.id === localDocument?.head);
  const isHeadCloudRevision = cloudDocumentRevisions.some(r => r.id === localDocument?.head);
  const localOnlyRevisions = isUploaded ? localDocumentRevisions.filter(r => !cloudDocumentRevisions.some(cr => cr.id === r.id)) : [];
  const unsavedChanges = isUploaded && !isHeadLocalRevision && !isHeadCloudRevision;
  if (unsavedChanges) {
    const unsavedRevision = { id: localDocument?.head, documentId: localDocument?.id, createdAt: localDocument?.updatedAt } as LocalDocumentRevision;
    localOnlyRevisions.unshift(unsavedRevision);
  }
  const cloudHeadIndex = cloudDocumentRevisions.findIndex(r => r.id === cloudDocument?.head);
  let revisionsBadgeContent = localOnlyRevisions.length;
  if (isAuthor && isCollab && cloudHeadIndex > 0) revisionsBadgeContent++;

  const hydrated = useHydration();

  return (
    <Card variant="outlined" sx={{ display: "flex", flexDirection: "column", justifyContent: "space-between", height: "100%", maxWidth: "100%", ...sx }}>
      <CardActionArea component={RouterLink} prefetch={false} href={document ? href : "/"} sx={{ flexGrow: 1 }}>
        <CardHeader sx={{ alignItems: "start", '& .MuiCardHeader-content, .MuiCardHeader-title': { whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" } }}
          title={document ? document.name : <Skeleton variant="text" width={190} />}
          subheader={
            <>
              <Chip size='small' sx={{ my: 1 }} avatar={
                document ? <Avatar alt={author?.name ?? "Local User"} src={author?.image ?? undefined} />
                  : <Skeleton variant="circular" width={24} height={24} />}
                label={document ? author?.name ?? "Local User" : <Skeleton variant="text" width={100} />} />
              <Typography variant="overline" color="text.secondary"
                sx={{ display: "block", lineHeight: 1.5, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                {document ? <Suspense key={hydrated ? 'local' : 'utc'}>
                  <time dateTime={new Date(document.createdAt).toISOString()}>
                    Created: {new Date(document.createdAt).toLocaleString(undefined, { dateStyle: "medium", timeStyle: "short" })}
                  </time>
                </Suspense> : <Skeleton variant="text" width={150} />}
              </Typography>
              <Typography variant="overline" color="text.secondary"
                sx={{ display: "block", lineHeight: 1.5, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}
              >
                {document ? <Suspense key={hydrated ? 'local' : 'utc'}>
                  <time dateTime={new Date(document.updatedAt).toISOString()}>
                    Updated: {new Date(document.updatedAt).toLocaleString(undefined, { dateStyle: "medium", timeStyle: "short" })}
                  </time>
                </Suspense> : <Skeleton variant="text" width={150} />}
              </Typography>
            </>
          }
          avatar={
            <Badge badgeContent={revisionsBadgeContent} color="secondary">
              <Suspense fallback={<ThumbnailSkeleton />}>
                <DocumentThumbnail userDocument={userDocument} />
              </Suspense>
            </Badge>
          }
        />
      </CardActionArea>
      <CardActions sx={{ height: 50, "& button:first-of-type": { ml: "auto !important" }, '& .MuiChip-root:last-of-type': { mr: 1 } }}>
        {!userDocument && <>
          <Chip sx={{ width: 0, flex: 1, maxWidth: "fit-content" }} label={<Skeleton variant="text" width={50} />} />
          <Chip sx={{ width: 0, flex: 1, maxWidth: "fit-content" }} label={<Skeleton variant="text" width={70} />} />
          <IconButton aria-label="Share Document" size="small" disabled><Share /></IconButton>
          <IconButton aria-label='Document Actions' size="small" disabled><MoreVert /></IconButton>
        </>}
        {isLocalOnly && <Chip sx={{ width: 0, flex: 1, maxWidth: "fit-content" }} icon={<MobileFriendly />} label="Local" />}
        {isUploaded && <Chip sx={{ width: 0, flex: 1, maxWidth: "fit-content" }} icon={isUpToDate ? <CloudDone /> : <CloudSync />} label={isUpToDate ? "Synced" : "Out of Sync"} />}
        {isCloudOnly && (isAuthor || isCoauthor) && <Chip sx={{ width: 0, flex: 1, maxWidth: "fit-content" }} icon={<Cloud />} label="Cloud" />}
        {isPublished && <Chip sx={{ width: 0, flex: 1, maxWidth: "fit-content" }} icon={<Public />} label="Published" />}
        {isCollab && <Chip sx={{ width: 0, flex: 1, maxWidth: "fit-content" }} icon={<Workspaces />} label="Collab" />}
        {isPrivate && <Chip sx={{ width: 0, flex: 1, maxWidth: "fit-content" }} icon={<Security />} label="Private" />}
        {userDocument && <DocumentActionMenu userDocument={userDocument} user={user} />}
      </CardActions>
    </Card >
  );
});

export default DocumentCard;