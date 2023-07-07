import * as React from 'react';
import Card from '@mui/material/Card';
import CardHeader from '@mui/material/CardHeader';
import CardActions from '@mui/material/CardActions';
import Avatar from '@mui/material/Avatar';
import { Link as RouterLink } from 'react-router-dom';
import { AdminDocument, EditorDocument, UserDocument } from '../store/types';
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

import SvgIcon from '@mui/material/SvgIcon';
import DocumentActionMenu, { options } from './DocumentActionMenu';
import Typography from '@mui/material/Typography';
import { memo } from 'react';

export const MarkdownIcon = () => <SvgIcon viewBox="0 0 640 512" fontSize='small'>
  <path d="M593.8 59.1H46.2C20.7 59.1 0 79.8 0 105.2v301.5c0 25.5 20.7 46.2 46.2 46.2h547.7c25.5 0 46.2-20.7 46.1-46.1V105.2c0-25.4-20.7-46.1-46.2-46.1zM338.5 360.6H277v-120l-61.5 76.9-61.5-76.9v120H92.3V151.4h61.5l61.5 76.9 61.5-76.9h61.5v209.2zm135.3 3.1L381.5 256H443V151.4h61.5V256H566z" />
</SvgIcon>;


const DocumentCard: React.FC<{ document: Omit<EditorDocument, "data">, variant: 'local' | 'cloud' | 'public' | 'admin' }> = memo(({ document, variant }) => {
  const user = useSelector((state: RootState) => state.app.user);
  const cloudDocument = user?.documents?.find(d => d.id === document.id);
  const isUploaded = !!cloudDocument || variant === "public" || variant === "admin";
  const isUpToDate = cloudDocument?.updatedAt === document.updatedAt;
  const isPublic = cloudDocument?.isPublic || variant === "public" && document.isPublic;

  const options: options = variant === "local" ?
    ['rename', 'download', 'export', 'upload', 'fork', 'share', 'delete']
    : variant === "cloud" ?
      ['rename', 'download', 'fork', 'share', 'publish', 'delete', 'export']
      : variant === "public" ?
        ['fork', 'share', 'export']
        : ['fork', 'share', 'export']

  return (
    <Card variant="outlined" sx={{ display: "flex", flexDirection: "column", justifyContent: "space-between", height: "100%" }}>
      <CardActionArea component={RouterLink} to={`/${variant === 'public' || variant === 'admin' ? 'view' : 'edit'}/${document.id}`} sx={{ flexGrow: 1 }}>
        <CardHeader
          title={document.name}
          subheader={
            variant === "admin" ?
              <>
                <Typography variant="subtitle2" color="text.secondary">
                  Author: {(document as AdminDocument).author.name}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Created: {new Date(document.createdAt).toLocaleString()}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Updated: {new Date(document.updatedAt).toLocaleString()}
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
          icon={isPublic ? <PublicIcon /> : <LinkIcon />}
          label={isPublic ? "Public" : "Shared"}
        />}
        {isUploaded && variant === "local" && <Chip sx={{ width: 0, flex: 1, maxWidth: "fit-content" }} icon={isUpToDate ? <CloudDoneIcon /> : <CloudSyncIcon />} label={isUpToDate ? "Up to date" : "Out of Sync"} />}
        <DocumentActionMenu document={document} variant={variant} options={options} />
      </CardActions>
    </Card>
  );
});

export default DocumentCard;