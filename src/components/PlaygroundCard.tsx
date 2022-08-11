import * as React from 'react';
import Card from '@mui/material/Card';
import CardHeader from '@mui/material/CardHeader';
import Avatar from '@mui/material/Avatar';
import { Link as RouterLink } from 'react-router-dom';
import ArticleIcon from '@mui/icons-material/Article';
import CardActionArea from '@mui/material/CardActionArea';

const PlaygroundCard: React.FC = () => {

  return (
    <Card variant="outlined">
      <CardActionArea component={RouterLink} to="/playground">
        <CardHeader title="Playground" avatar={<Avatar sx={{ bgcolor: 'primary.main' }}><ArticleIcon /></Avatar>} />
      </CardActionArea>
    </Card>
  );
}

export default PlaygroundCard;