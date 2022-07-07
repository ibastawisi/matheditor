import * as React from 'react';
import Card from '@mui/material/Card';
import CardHeader from '@mui/material/CardHeader';
import Avatar from '@mui/material/Avatar';
import { Link as RouterLink } from 'react-router-dom';
import { EditorDocument } from '../slices/app';
import ArticleIcon from '@mui/icons-material/Article';

import CardActionArea from '@mui/material/CardActionArea';

const TemplateCard: React.FC<{ template: EditorDocument }> = ({ template }) => {
  return (
    <Card variant="outlined">
    <CardActionArea component={RouterLink} to="/new" state={{ data: template.data }}>
      <CardHeader avatar={<Avatar sx={{ bgcolor: 'primary.main' }}><ArticleIcon /></Avatar>} title={template.name} />
    </CardActionArea>
  </Card>
  );
}

export default TemplateCard;