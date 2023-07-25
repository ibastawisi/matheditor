"use client"
import * as React from 'react';
import Card from '@mui/material/Card';
import CardHeader from '@mui/material/CardHeader';
import CardActions from '@mui/material/CardActions';
import Avatar from '@mui/material/Avatar';
import RouterLink from 'next/link'
import { AdminDocument, EditorDocument, User } from '@/types';
import ArticleIcon from '@mui/icons-material/Article';
import { RootState } from '../store';
import { useSelector } from 'react-redux';
import CloudDoneIcon from '@mui/icons-material/CloudDone';
import CardActionArea from '@mui/material/CardActionArea';
import PublicIcon from '@mui/icons-material/Public';
import Chip from '@mui/material/Chip';
import MobileFriendlyIcon from '@mui/icons-material/MobileFriendly';
import LinkIcon from '@mui/icons-material/Link';
import CloudSyncIcon from '@mui/icons-material/CloudSync';
import CloudIcon from '@mui/icons-material/Cloud';
import DocumentActionMenu, { options } from './DocumentActionMenu';
import Typography from '@mui/material/Typography';
import { memo } from 'react';

export type DocumentCardVariant = 'local' | 'cloud' | 'public' | 'admin';

const DocumentCard: React.FC<{ document: Omit<EditorDocument, "data">, variant: DocumentCardVariant }> = memo(({ document, variant }) => {
  const user = useSelector((state: RootState) => state.app.user);
  const cloudDocument = user?.documents?.find(d => d.id === document.id);
  const isUploaded = !!cloudDocument || variant === "public" || variant === "admin";
  const isUpToDate = cloudDocument?.updatedAt === document.updatedAt;
  const published = cloudDocument?.published || variant === "public" && document.published;

  const options: options = variant === "local" ?
    ['rename', 'download', 'export', 'embed', 'upload', 'fork', 'share', 'delete']
    : variant === "cloud" ?
      ['rename', 'download', 'export', 'embed', 'fork', 'share', 'publish', 'delete']
      : variant === "public" ?
        ['fork', 'share', 'export', 'embed']
        : ['fork', 'share', 'export', 'embed']

  return (
    <Card variant="outlined" sx={{ display: "flex", flexDirection: "column", justifyContent: "space-between", height: "100%" }}>
      <CardActionArea component={RouterLink} href={`/${variant === 'public' || variant === 'admin' ? 'view' : 'edit'}/${document.id}`} sx={{ flexGrow: 1 }}>
        <CardHeader
          title={document.name}
          subheader={
            variant === "admin" ?
              <>
                <Typography variant="subtitle2" color="text.secondary">
                  {(document as AdminDocument).author.name}
                </Typography>
                <Typography variant="subtitle2" color="text.secondary">
                  {new Date(document.createdAt).toLocaleString()}
                </Typography>
                <Typography variant="subtitle2" color="text.secondary">
                  {new Date(document.updatedAt).toLocaleString()}
                </Typography>
              </>
              : new Date(document.createdAt).toLocaleDateString()

          }
          avatar={<Avatar sx={{ bgcolor: 'primary.main' }}><ArticleIcon /></Avatar>}
        />
      </CardActionArea>
      <CardActions>
        <Chip sx={{ width: 0, flex: 1, maxWidth: "fit-content" }}
          icon={variant === "local" ? <MobileFriendlyIcon /> : <CloudIcon />}
          label={variant === "local" ? "Local" : "Cloud"}
        />
        {isUploaded && <Chip sx={{ width: 0, flex: 1, maxWidth: "fit-content" }}
          icon={published ? <PublicIcon /> : <LinkIcon />}
          label={published ? "Public" : "Shared"}
        />}
        {isUploaded && variant === "local" && <Chip sx={{ width: 0, flex: 1, maxWidth: "fit-content" }} icon={isUpToDate ? <CloudDoneIcon /> : <CloudSyncIcon />} label={isUpToDate ? "Up to date" : "Out of Sync"} />}
        <DocumentActionMenu document={document} variant={variant} options={options} />
      </CardActions>
    </Card>
  );
});

export default DocumentCard;