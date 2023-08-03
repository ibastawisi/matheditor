"use client"
import * as React from 'react';
import Card from '@mui/material/Card';
import CardHeader from '@mui/material/CardHeader';
import CardActions from '@mui/material/CardActions';
import Avatar from '@mui/material/Avatar';
import RouterLink from 'next/link'
import { DocumentVariant, UserDocument } from '@/types';
import ArticleIcon from '@mui/icons-material/Article';
import { RootState } from '../store';
import { useSelector } from 'react-redux';
import CloudDoneIcon from '@mui/icons-material/CloudDone';
import CardActionArea from '@mui/material/CardActionArea';
import PublicIcon from '@mui/icons-material/Public';
import Chip from '@mui/material/Chip';
import MobileFriendlyIcon from '@mui/icons-material/MobileFriendly';
import VerifiedUserIcon from '@mui/icons-material/VerifiedUser';
import CloudSyncIcon from '@mui/icons-material/CloudSync';
import CloudIcon from '@mui/icons-material/Cloud';
import DocumentActionMenu, { options } from './DocumentActionMenu';
import Typography from '@mui/material/Typography';
import { memo } from 'react';

const DocumentCard: React.FC<{ document: UserDocument, variant: DocumentVariant }> = memo(({ document, variant }) => {
  const documents = useSelector((state: RootState) => state.documents);
  const cloudDocument = documents.filter(d => d.variant === "cloud").find(d => d.id === document.id);
  const isUploaded = !!cloudDocument || variant === "published" || variant === "admin";
  const isUpToDate = cloudDocument?.updatedAt === document.updatedAt;
  const published = cloudDocument?.published || variant === "published";

  const options: options = variant === "local" ?
    ['rename', 'download', 'embed', 'upload', 'fork', 'share', 'publish', 'delete']
    : variant === "cloud" ?
      ['rename', 'download', 'embed', 'fork', 'share', 'publish', 'delete']
      : variant === "published" ?
        ['fork', 'share', 'embed']
        : ['fork', 'share', 'embed']

  const href = variant === "admin" || variant === "published" ? `/view/${document.id}` : `/edit/${document.id}`;

  return (
    <Card variant="outlined"
      sx={{
        display: "flex", 
        flexDirection: "column", 
        justifyContent: "space-between", 
        height: "100%", 
      }}>
      <CardActionArea component={RouterLink} prefetch={false} href={href} sx={{ flexGrow: 1 }}>
        <CardHeader
          title={document.name}
          subheader={
            variant === "admin" ?
              <>
                <Typography variant="subtitle2" color="text.secondary">
                  {document.author?.name}
                </Typography>
                <Typography variant="subtitle2" color="text.secondary">
                  {new Date(document.createdAt).toLocaleString()}
                </Typography>
                <Typography variant="subtitle2" color="text.secondary">
                  {new Date(document.updatedAt).toLocaleString()}
                </Typography>
              </>
              : variant === "published" ?
                <>
                  <Typography variant="subtitle2" color="text.secondary">
                    {document.author?.name}
                  </Typography>
                  <Typography variant="subtitle2" color="text.secondary">
                    {new Date(document.createdAt).toLocaleDateString()}
                  </Typography>
                </>
              : new Date(document.createdAt).toLocaleDateString()

          }
          avatar={<Avatar sx={{ bgcolor: 'primary.main' }}><ArticleIcon /></Avatar>}
        />
      </CardActionArea>
      <CardActions>
        {variant === "local" && <Chip sx={{ width: 0, flex: 1, maxWidth: "fit-content" }} icon={<MobileFriendlyIcon />} label="Local" />}
        {isUploaded && variant === "local" && <Chip sx={{ width: 0, flex: 1, maxWidth: "fit-content" }} icon={isUpToDate ? <CloudDoneIcon /> : <CloudSyncIcon />} label={isUpToDate ? "Up to date" : "Out of Sync"} />}
        {variant === "cloud" && <Chip sx={{ width: 0, flex: 1, maxWidth: "fit-content" }} icon={<CloudIcon />} label="Cloud" />}
        {published && <Chip sx={{ width: 0, flex: 1, maxWidth: "fit-content" }} icon={<PublicIcon />} label="Published" />}
        {variant === "admin" && <Chip sx={{ width: 0, flex: 1, maxWidth: "fit-content" }} icon={<VerifiedUserIcon />} label="Admin" />}
        <DocumentActionMenu document={document} variant={variant} options={options} />
      </CardActions>
    </Card>
  );
});

export default DocumentCard;