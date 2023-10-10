"use client"
import * as React from 'react';
import RouterLink from 'next/link'
import { UserDocument } from '@/types';
import { useSelector } from '@/store';
import { memo } from 'react';
import DocumentActionMenu from './DocumentActions/ActionMenu';
import { SxProps, Theme } from '@mui/material/styles';
import { Card, CardActionArea, CardHeader, Skeleton, Typography, Avatar, CardActions, Chip, IconButton } from '@mui/material';
import { Article, MobileFriendly, CloudDone, CloudSync, Cloud, Public, Share, MoreVert } from '@mui/icons-material';
import EditDocument from './DocumentActions/Edit';
import ShareDocument from './DocumentActions/Share';

const DocumentCard: React.FC<{ userDocument?: UserDocument, sx?: SxProps<Theme> | undefined }> = memo(({ userDocument, sx }) => {
  const user = useSelector(state => state.user);
  const initialized = useSelector(state => state.initialized);
  const localDocument = userDocument?.local;
  const cloudDocument = userDocument?.cloud;
  const isLocal = !!localDocument;
  const isCloud = !!cloudDocument;
  const isLocalOnly = isLocal && !isCloud;
  const isCloudOnly = !isLocal && isCloud;
  const isUploaded = isLocal && isCloud;
  const isUpToDate = isUploaded && localDocument.updatedAt === cloudDocument.updatedAt;
  const isPublished = isCloud && cloudDocument.published;
  const isAuthor = isCloud ? cloudDocument.author.id === user?.id : true
  const isCoauthor = isCloud ? cloudDocument.coauthors.some(u => u.id === user?.id) : false;

  const document = isCloudOnly ? cloudDocument : localDocument;
  const handle = cloudDocument?.handle ?? localDocument?.handle ?? document?.id;
  const href = (isAuthor || isCoauthor) ? `/edit/${handle}` : `/view/${handle}`;
  const authorName = cloudDocument?.author.name ?? user?.name ?? 'Local User';

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
      <CardActionArea component={RouterLink} prefetch={false} scroll={false} href={document ? href : "/"} sx={{ flexGrow: 1 }}>
        <CardHeader sx={{ alignItems: "start", '& .MuiCardHeader-content': { overflow: "hidden", textOverflow: "ellipsis" } }}
          title={document ? document.name : <Skeleton variant="text" width={190} />}
          subheader={
            <>
              <Typography component="span" variant="subtitle2"
                sx={{ display: "block", lineHeight: 2, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}
                color="text.secondary"
              >
                {document ? authorName : <Skeleton variant="text" width={100} />}
              </Typography>
              <Typography variant="overline"
                sx={{ display: "block", lineHeight: 1.5, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}
                color="text.secondary"
              >{document ? <>
                Created: {new Date(document.createdAt).toLocaleString()}
              </> : <Skeleton variant="text" width={150} />}
              </Typography>
              <Typography variant="overline"
                sx={{ display: "block", lineHeight: 1.5, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}
                color="text.secondary"
              >
                {document ? <>
                  Updated: {new Date(document.updatedAt).toLocaleString()}
                </> : <Skeleton variant="text" width={160} />}
              </Typography>
            </>
          }
          avatar={<Avatar sx={{ bgcolor: 'primary.main' }}><Article /></Avatar>}
        />
      </CardActionArea>
      <CardActions sx={{ "& button:first-of-type": { ml: "auto !important" }, '& .MuiChip-root:last-of-type': { mr: 1 } }}>
        {!document && <Chip sx={{ width: 0, flex: 1, maxWidth: "fit-content" }} label={<Skeleton variant="text" width={50} />} />}
        {!document && <Chip sx={{ width: 0, flex: 1, maxWidth: "fit-content" }} label={<Skeleton variant="text" width={70} />} />}
        {isLocalOnly && <Chip sx={{ width: 0, flex: 1, maxWidth: "fit-content" }} icon={<MobileFriendly />} label="Local" />}
        {isUploaded && <Chip sx={{ width: 0, flex: 1, maxWidth: "fit-content" }} icon={isUpToDate ? <CloudDone /> : <CloudSync />} label={isUpToDate ? "Up to date" : "Out of Sync"} />}
        {isCloudOnly && (isAuthor || isCoauthor) && <Chip sx={{ width: 0, flex: 1, maxWidth: "fit-content" }} icon={<Cloud />} label="Cloud" />}
        {isPublished && <Chip sx={{ width: 0, flex: 1, maxWidth: "fit-content" }} icon={<Public />} label="Published" />}
        {initialized && userDocument ? <>
          {isAuthor && <EditDocument userDocument={userDocument} />}
          <ShareDocument userDocument={userDocument} />
          <DocumentActionMenu userDocument={userDocument} />
        </> :
          <>
            <IconButton aria-label="Share Document" size="small" sx={{ ml: "auto" }} disabled><Share /></IconButton>
            <IconButton aria-label="Document Actions" size="small" disabled><MoreVert /></IconButton>
          </>
        }
      </CardActions>
    </Card>
  );
});

export default DocumentCard;