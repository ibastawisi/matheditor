"use client"
import * as React from 'react';
import Card from '@mui/material/Card';
import CardHeader from '@mui/material/CardHeader';
import CardActions from '@mui/material/CardActions';
import Avatar from '@mui/material/Avatar';
import RouterLink from 'next/link'
import { DocumentVariant, UserDocument, isCloudDocument, isLocalDocument } from '@/types';
import ArticleIcon from '@mui/icons-material/Article';
import { useSelector } from '@/store';
import CloudDoneIcon from '@mui/icons-material/CloudDone';
import CardActionArea from '@mui/material/CardActionArea';
import PublicIcon from '@mui/icons-material/Public';
import Chip from '@mui/material/Chip';
import MobileFriendlyIcon from '@mui/icons-material/MobileFriendly';
import CloudSyncIcon from '@mui/icons-material/CloudSync';
import CloudIcon from '@mui/icons-material/Cloud';
import DocumentActionMenu, { options } from './DocumentActionMenu';
import Typography from '@mui/material/Typography';
import { memo } from 'react';

const DocumentCard: React.FC<{ document: UserDocument, variant: DocumentVariant }> = memo(({ document, variant }) => {
  const user = useSelector(state => state.user);
  const isLocal = isLocalDocument(document);
  const isCloud = isCloudDocument(document);
  const isOwner = isLocal || document.author.id === user?.id;
  const cloudDocument = useSelector(state => state.documents.filter(isCloudDocument).find(d => d.id === document.id));
  const isUploaded = isLocal && !!cloudDocument;
  const isUpToDate = isUploaded && document.updatedAt === cloudDocument.updatedAt;
  const isPublished = isCloud? document.published : isUploaded ? cloudDocument.published : false;

  const options: options =
    isLocal ?
      ['rename', 'download', 'embed', 'upload', 'fork', 'share', 'publish', 'delete']
      : isOwner ? ['rename', 'download', 'embed', 'fork', 'share', 'publish', 'delete']
        : ['fork', 'share', 'embed'];

  const href = isOwner ? `/edit/${document.id}` : `/view/${document.id}`;
  const authorName = isCloud ? document.author.name : isUploaded ? cloudDocument.author.name : user ? user.name : 'Local User';

  return (
    <Card variant="outlined"
      sx={{
        display: "flex",
        flexDirection: "column",
        justifyContent: "space-between",
        height: "100%",
      }}>
      <CardActionArea component={RouterLink} prefetch={false} href={href} sx={{ flexGrow: 1 }}>
        <CardHeader sx={{ alignItems: "start", '& .MuiCardHeader-content': { overflow: "hidden", textOverflow: "ellipsis" } }}
          title={document.name}
          subheader={
            <>
              <Typography variant="subtitle2"
                sx={{ display: "block", lineHeight: 2, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}
                color="text.secondary"
              >
                {authorName}
              </Typography>
              <Typography variant="overline"
                sx={{ display: "block", lineHeight: 1.5, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}
                color="text.secondary"
              >
                Created: {new Date(document.createdAt).toLocaleString()}
              </Typography>
              <Typography variant="overline"
                sx={{ display: "block", lineHeight: 1.5, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}
                color="text.secondary"
              >
                Updated: {new Date(document.updatedAt).toLocaleString()}
              </Typography>
            </>
          }
          avatar={<Avatar sx={{ bgcolor: 'primary.main' }}><ArticleIcon /></Avatar>}
        />
      </CardActionArea>
      <CardActions>
        {isLocal && <Chip sx={{ width: 0, flex: 1, maxWidth: "fit-content" }} icon={<MobileFriendlyIcon />} label="Local" />}
        {isUploaded && <Chip sx={{ width: 0, flex: 1, maxWidth: "fit-content" }} icon={isUpToDate ? <CloudDoneIcon /> : <CloudSyncIcon />} label={isUpToDate ? "Up to date" : "Out of Sync"} />}
        {isCloud && <Chip sx={{ width: 0, flex: 1, maxWidth: "fit-content" }} icon={<CloudIcon />} label="Cloud" />}
        {isPublished && <Chip sx={{ width: 0, flex: 1, maxWidth: "fit-content" }} icon={<PublicIcon />} label="Published" />}
        <DocumentActionMenu document={document} variant={variant} options={options} />
      </CardActions>
    </Card>
  );
});

export default DocumentCard;