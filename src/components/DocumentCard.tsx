"use client"
import * as React from 'react';
import RouterLink from 'next/link'
import { UserDocument, isCloudDocument, isLocalDocument } from '@/types';
import { useSelector } from '@/store';
import type { options } from './DocumentActionMenu';
import { memo } from 'react';
import DocumentActionMenu from './DocumentActionMenu';
import { SxProps, Theme } from '@mui/material/styles';
import { Card, CardActionArea, CardHeader, Skeleton, Typography, Avatar, CardActions, Chip, IconButton } from '@mui/material';
import { Article, MobileFriendly, CloudDone, CloudSync, Cloud, Public, Share, MoreVert } from '@mui/icons-material';


const DocumentCard: React.FC<{ document?: UserDocument, sx?: SxProps<Theme> | undefined }> = memo(({ document, sx }) => {
  const user = useSelector(state => state.user);
  const isLocal = document && isLocalDocument(document);
  const isCloud = document && isCloudDocument(document);
  const isOwner = isLocal || document?.author.id === user?.id;
  const cloudDocument = useSelector(state => state.documents.filter(isCloudDocument).find(d => d.id === document?.id));
  const isUploaded = isLocal && !!cloudDocument;
  const isUpToDate = isUploaded && document.updatedAt === cloudDocument.updatedAt;
  const isPublished = isCloud ? document.published : isUploaded ? cloudDocument.published : false;

  const options: options =
    isLocal ?
      ['edit', 'download', 'embed', 'upload', 'fork', 'share', 'publish', 'delete']
      : isOwner ? ['edit', 'download', 'embed', 'fork', 'share', 'publish', 'delete']
        : ['fork', 'share', 'embed'];

  const handle = document?.handle || document?.id;
  const href = isOwner ? `/edit/${handle}` : `/view/${handle}`;
  const authorName = isCloud ? document.author.name : isUploaded ? cloudDocument.author.name : user ? user.name : 'Local User';

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
        {isLocal && <Chip sx={{ width: 0, flex: 1, maxWidth: "fit-content" }} icon={<MobileFriendly />} label="Local" />}
        {isUploaded && <Chip sx={{ width: 0, flex: 1, maxWidth: "fit-content" }} icon={isUpToDate ? <CloudDone /> : <CloudSync />} label={isUpToDate ? "Up to date" : "Out of Sync"} />}
        {isCloud && <Chip sx={{ width: 0, flex: 1, maxWidth: "fit-content" }} icon={<Cloud />} label="Cloud" />}
        {isPublished && <Chip sx={{ width: 0, flex: 1, maxWidth: "fit-content" }} icon={<Public />} label="Published" />}
        {document ? <DocumentActionMenu document={document} options={options} /> :
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