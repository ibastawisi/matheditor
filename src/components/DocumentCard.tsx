"use client"
import * as React from 'react';
import Card from '@mui/material/Card';
import CardHeader from '@mui/material/CardHeader';
import CardActions from '@mui/material/CardActions';
import Avatar from '@mui/material/Avatar';
import RouterLink from 'next/link'
import { UserDocument, isCloudDocument, isLocalDocument } from '@/types';
import ArticleIcon from '@mui/icons-material/Article';
import { useSelector } from '@/store';
import CloudDoneIcon from '@mui/icons-material/CloudDone';
import CardActionArea from '@mui/material/CardActionArea';
import PublicIcon from '@mui/icons-material/Public';
import Chip from '@mui/material/Chip';
import MobileFriendlyIcon from '@mui/icons-material/MobileFriendly';
import CloudSyncIcon from '@mui/icons-material/CloudSync';
import CloudIcon from '@mui/icons-material/Cloud';
import type { options } from './DocumentActionMenu';
import Typography from '@mui/material/Typography';
import { memo } from 'react';
import Skeleton from '@mui/material/Skeleton';
import IconButton from '@mui/material/IconButton';
import MoreVertIcon from '@mui/icons-material/MoreVert';
import { SxProps, Theme } from '@mui/material/styles';
import DocumentActionMenu from './DocumentActionMenu';


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
      <CardActionArea component={RouterLink} prefetch={false} href={href} sx={{ flexGrow: 1 }}>
        <CardHeader sx={{ alignItems: "start", '& .MuiCardHeader-content': { overflow: "hidden", textOverflow: "ellipsis" } }}
          title={document ? document.name : <Skeleton variant="text" width={190} />}
          subheader={
            <>
              <Typography variant="subtitle2"
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
          avatar={<Avatar sx={{ bgcolor: 'primary.main' }}><ArticleIcon /></Avatar>}
        />
      </CardActionArea>
      <CardActions sx={{ "& button:first-of-type": { ml: "auto !important" } }}>
        {!document && <Chip sx={{ width: 0, flex: 1, maxWidth: "fit-content" }} label={<Skeleton variant="text" width={50} />} />}
        {!document && <Chip sx={{ width: 0, flex: 1, maxWidth: "fit-content" }} label={<Skeleton variant="text" width={70} />} />}
        {isLocal && <Chip sx={{ width: 0, flex: 1, maxWidth: "fit-content" }} icon={<MobileFriendlyIcon />} label="Local" />}
        {isUploaded && <Chip sx={{ width: 0, flex: 1, maxWidth: "fit-content" }} icon={isUpToDate ? <CloudDoneIcon /> : <CloudSyncIcon />} label={isUpToDate ? "Up to date" : "Out of Sync"} />}
        {isCloud && <Chip sx={{ width: 0, flex: 1, maxWidth: "fit-content" }} icon={<CloudIcon />} label="Cloud" />}
        {isPublished && <Chip sx={{ width: 0, flex: 1, maxWidth: "fit-content" }} icon={<PublicIcon />} label="Published" />}
        {document ? <DocumentActionMenu document={document} options={options} /> : <IconButton size="small" sx={{ ml: "auto" }} disabled><MoreVertIcon /></IconButton>}
      </CardActions>
    </Card>
  );
});

export default DocumentCard;